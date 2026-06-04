const express = require('express');
const admin = require('firebase-admin');

const router = express.Router();

const validSeverities = [
  'low',
  'medium',
  'high',
  'critical',
];

const validActions = [
  'canHelp',
  'ambulanceCalled',
  'policeInformed',
  'falseReport',
];

async function verifyFirebaseToken(req, res, next) {
  try {
    const token =
      req.headers.authorization?.split('Bearer ')[1];

    if (!token) {
      return res.status(401).json({
        message: 'No token provided',
      });
    }

    const decodedToken =
      await admin.auth().verifyIdToken(token);

    req.user = decodedToken;

    return next();
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired token',
      error: error.message,
    });
  }
}

function serializeReport(doc) {
  const data = doc.data();

  return {
    id: doc.id,
    title: data.title,
    description: data.description,
    severity: data.severity,
    status: data.status,
    location: data.location,
    distanceMeters: data.distanceMeters || 0,
    createdAt:
      data.createdAt?.toDate?.().toISOString?.() ||
      new Date().toISOString(),
    updatedAt:
      data.updatedAt?.toDate?.().toISOString?.() ||
      new Date().toISOString(),
    actions: data.actions || {},
    actionUsers: data.actionUsers || {},
    replies: data.replies || [],
  };
}

module.exports = function createReportRoutes(io, notifyNearbyUsers) {
  router.get(
    '/nearby',
    verifyFirebaseToken,
    async (_req, res) => {
      try {
        const snapshot =
          await admin
            .firestore()
            .collection('accidentReports')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        const reports =
          snapshot.docs
            .map(serializeReport)
            .filter((report) =>
              ['active', 'helping', 'ambulanceArrived'].includes(
                report.status
              )
            );

        return res.status(200).json({
          reports,
        });
      } catch (error) {
        return res.status(500).json({
          message: 'Failed to fetch reports',
          error: error.message,
        });
      }
    }
  );

  router.post(
    '/',
    verifyFirebaseToken,
    async (req, res) => {
      try {
        const {
          title,
          description,
          severity,
          location,
        } = req.body;

        if (
          !title ||
          !description ||
          !validSeverities.includes(severity) ||
          !location?.address ||
          typeof location.latitude !== 'number' ||
          typeof location.longitude !== 'number'
        ) {
          return res.status(400).json({
            message: 'Invalid accident report data',
          });
        }

        const reportRef =
          await admin
            .firestore()
            .collection('accidentReports')
            .add({
              title,
              description,
              severity,
              location,
              status: 'active',
              distanceMeters: 0,
              reporterUid: req.user.uid,
              reporterName:
                req.user.name ||
                req.user.email ||
                req.user.phone_number ||
                'RoadSoS user',
              actions: {
                canHelp: 0,
                ambulanceCalled: 0,
                policeInformed: 0,
                falseReport: 0,
              },
              actionUsers: {
                canHelp: [],
                ambulanceCalled: [],
                policeInformed: [],
                falseReport: [],
              },
              replies: [],
              createdAt:
                admin.firestore.FieldValue.serverTimestamp(),
              updatedAt:
                admin.firestore.FieldValue.serverTimestamp(),
            });

        const reportDoc =
          await reportRef.get();

        const report =
          serializeReport(reportDoc);

        notifyNearbyUsers(report);

        io.emit('report:created', report);

        return res.status(201).json({
          report,
        });
      } catch (error) {
        return res.status(500).json({
          message: 'Failed to create report',
          error: error.message,
        });
      }
    }
  );

  router.post(
    '/:reportId/actions',
    verifyFirebaseToken,
    async (req, res) => {
      try {
        const {
          reportId,
        } = req.params;

        const {
          action,
        } = req.body;

        if (!validActions.includes(action)) {
          return res.status(400).json({
            message: 'Invalid report action',
          });
        }

        const reportRef =
          admin
            .firestore()
            .collection('accidentReports')
            .doc(reportId);

        const existingReport =
          await reportRef.get();

        if (!existingReport.exists) {
          return res.status(404).json({
            message: 'Report not found',
          });
        }

        const statusUpdate =
          action === 'falseReport'
            ? {}
            : {
                status: 'helping',
              };

        const actionUser = {
          uid: req.user.uid,
          name: req.user.name || req.user.email || req.user.phone_number || 'Anonymous',
          timestamp: new Date().toISOString(),
        };

        await reportRef.set(
          {
            ...statusUpdate,
            [`actions.${action}`]:
              admin.firestore.FieldValue.increment(1),
            [`actionUsers.${action}`]:
              admin.firestore.FieldValue.arrayUnion(actionUser),
            updatedAt:
              admin.firestore.FieldValue.serverTimestamp(),
          },
          {
            merge: true,
          }
        );

        const reportDoc =
          await reportRef.get();

        const report =
          serializeReport(reportDoc);

        io.emit('report:updated', report);

        return res.status(200).json({
          report,
        });
      } catch (error) {
        return res.status(500).json({
          message: 'Failed to update report action',
          error: error.message,
        });
      }
    }
  );

  router.post(
    '/:reportId/status',
    verifyFirebaseToken,
    async (req, res) => {
      try {
        const { reportId } = req.params;
        const { status } = req.body;

        const validStatuses = ['active', 'helping', 'ambulanceArrived', 'victimRescued', 'roadCleared', 'resolved'];
        
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            message: 'Invalid status',
          });
        }

        const reportRef = admin.firestore().collection('accidentReports').doc(reportId);
        const existingReport = await reportRef.get();

        if (!existingReport.exists) {
          return res.status(404).json({
            message: 'Report not found',
          });
        }

        // Auto-resolve when victim rescued or road cleared
        const finalStatus = ['victimRescued', 'roadCleared'].includes(status) ? 'resolved' : status;

        await reportRef.set(
          {
            status: finalStatus,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        const reportDoc = await reportRef.get();
        const report = serializeReport(reportDoc);

        io.emit('report:updated', report);
        
        // Notify that report is resolved
        if (finalStatus === 'resolved') {
          io.emit('report:resolved', { id: reportId });
        }

        return res.status(200).json({ report });
      } catch (error) {
        return res.status(500).json({
          message: 'Failed to update status',
          error: error.message,
        });
      }
    }
  );

  router.post(
    '/:reportId/replies',
    verifyFirebaseToken,
    async (req, res) => {
      try {
        const {
          reportId,
        } = req.params;

        const {
          message,
        } = req.body;

        if (!message) {
          return res.status(400).json({
            message: 'Reply message is required',
          });
        }

        const reportRef =
          admin
            .firestore()
            .collection('accidentReports')
            .doc(reportId);

        const existingReport =
          await reportRef.get();

        if (!existingReport.exists) {
          return res.status(404).json({
            message: 'Report not found',
          });
        }

        const reply = {
          id: `reply-${Date.now()}`,
          authorName:
            req.user.name ||
            req.user.email ||
            req.user.phone_number ||
            'RoadSoS user',
          message,
          createdAt: new Date().toISOString(),
        };

        await reportRef.set(
          {
            replies:
              admin.firestore.FieldValue.arrayUnion(reply),
            updatedAt:
              admin.firestore.FieldValue.serverTimestamp(),
          },
          {
            merge: true,
          }
        );

        const reportDoc =
          await reportRef.get();

        const report =
          serializeReport(reportDoc);

        io.emit('report:updated', report);

        return res.status(201).json({
          report,
        });
      } catch (error) {
        return res.status(500).json({
          message: 'Failed to add reply',
          error: error.message,
        });
      }
    }
  );

  return router;
};
