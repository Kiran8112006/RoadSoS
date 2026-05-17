const express = require('express');

const admin = require('firebase-admin');

const router = express.Router();

router.post(
  '/complete',
  async (req, res) => {


    try {

      const {
        fullName,
        age,
        gender,
        role,
        bloodGroup,
        allergies,
        medicalConditions,
        medications,
        emergencyNotes,
        emergencyContacts,
      } = req.body;

      const token =
        req.headers.authorization?.split(
          'Bearer '
        )[1];

      if (!token) {

        return res.status(401).json({
          message: 'No token provided',
        });

      }

      const decodedToken =
        await admin
          .auth()
          .verifyIdToken(token);

      const uid =
        decodedToken.uid;


      await admin
        .firestore()
        .collection('users')
        .doc(uid)
        .set({
          fullName,
          age,
          gender,
          role,
          bloodGroup,
          allergies,
          medicalConditions,
          medications,
          emergencyNotes,

          email:
            decodedToken.email || '',

          phone:
            decodedToken.phone_number || '',

          profileCompleted: true,

          createdAt:
            admin.firestore.FieldValue.serverTimestamp(),
        });

      for (
        let i = 0;
        i < emergencyContacts.length;
        i++
      ) {

        await admin
          .firestore()
          .collection('users')
          .doc(uid)
          .collection(
            'emergencyContacts'
          )
          .add({
            ...emergencyContacts[i],
            createdAt:
              admin.firestore.FieldValue.serverTimestamp(),
          });

      }

      return res.status(200).json({
        success: true,
        message:
          'Profile completed successfully',
      });

    } catch (error) {

      console.log(error);

      return res.status(500).json({
        message:
          'Server Error',
      });

    }

  }
);
router.get(
  '/profile',
  async (req, res) => {


    try {

      const token =
        req.headers.authorization?.split(
          'Bearer '
        )[1];

      if (!token) {

        return res.status(401).json({
          message: 'No token provided',
        });

      }

      const decodedToken =
        await admin
          .auth()
          .verifyIdToken(token);

      const uid =
        decodedToken.uid;


      const userDoc =
        await admin
          .firestore()
          .collection('users')
          .doc(uid)
          .get();

      if (!userDoc.exists) {

        return res.status(404).json({
          message: 'User profile not found',
        });

      }

      return res.status(200).json(
        userDoc.data()
      );

    } catch (error) {

      console.log(error);

      return res.status(500).json({
        message: 'Server Error',
      });

    }

  }
);
module.exports = router;
