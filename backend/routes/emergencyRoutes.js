const express = require("express");
const router = express.Router();

const { admin, db } = require("../firebaseAdmin");

function canDonate(
  donor,
  recipient
) {

  const rules = {

    "O-":
      ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],

    "O+":
      ["O+", "A+", "B+", "AB+"],

    "A-":
      ["A-", "A+", "AB-", "AB+"],

    "A+":
      ["A+", "AB+"],

    "B-":
      ["B-", "B+", "AB-", "AB+"],

    "B+":
      ["B+", "AB+"],

    "AB-":
      ["AB-", "AB+"],

    "AB+":
      ["AB+"],

  };

  return (
    rules[donor]?.includes(
      recipient
    ) || false
  );

}

async function sendReminder(
  alertId,
  tokens,
  payload,
  delay
) {

  setTimeout(
    async () => {

      try {

        const alertDoc =
          await db
            .collection(
              "emergencyAlerts"
            )
            .doc(alertId)
            .get();


        if (
          !alertDoc.exists ||
          alertDoc.data()
            .acknowledged
        ) {
          return;
        }

        if (
          tokens.length === 0
        ) {
          return;
        }

        await admin
          .messaging()
          .sendEachForMulticast(
            payload
          );

        console.log(
          "FCM REMINDER SENT:",
          alertId
        );

      } catch (error) {

        console.error(
          "FCM reminder error:",
          error
        );

      }

    },

    delay

  );

}

router.post("/trigger", async (req, res) => {

  console.log("TRIGGER HIT");
  console.log(req.body);

  try {
    const { latitude, longitude, userId } = req.body;

    if (

      userId == null ||

      latitude == null ||

      longitude == null

    ) {
      return res.status(400).json({
        success: false,
        error: "userId, latitude, and longitude are required",
      });
    }

    const locationLink = `https://maps.google.com/?q=${latitude},${longitude}`;

    const userDoc = await db
      .collection("users")
      .doc(userId)
      .get();
    console.log("Victim user exists:", userDoc.exists);

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const userData = userDoc.data();

    const contactsSnapshot = await db
      .collection("users")
      .doc(userId)
      .collection("emergencyContacts")
      .get();
    console.log("Emergency contacts count:", contactsSnapshot.size);

    const tokens = [];
    const compatibleDonors = [];
    const victimBloodGroup =
      userData.bloodGroup;

    for (const contactDoc of contactsSnapshot.docs) {

      const contactData = contactDoc.data();
      console.log("Contact userId:", contactData.contactUserId);

      if (
        !contactData.contactUserId
      ) {
        continue;
      }

      const linkedUserDoc =
        await db
          .collection("users")
          .doc(
            contactData.contactUserId
          )
          .get();
      console.log("Linked user fetched for:", contactData.contactUserId);

      if (
        !linkedUserDoc.exists
      ) {
        console.log("Linked user does not exist:", contactData.contactUserId);
        continue;
      }

      const linkedUserData =
        linkedUserDoc.data();

        console.log("Linked user FCM token:", linkedUserData?.fcmToken);
        if (linkedUserData?.fcmToken) {
        console.log("Linked user has FCM token:", !!linkedUserData?.fcmToken);

        tokens.push(
          linkedUserData.fcmToken
        );

      }

      const donorBloodGroup =
        linkedUserData.bloodGroup;

      if (
        canDonate(
          donorBloodGroup,
          victimBloodGroup
        )
      ) {

        compatibleDonors.push({

          name:
            contactData.name,

          relationship:
            contactData.relationship,

          bloodGroup:
            donorBloodGroup,

          phone:
            contactData.phone,

        });

      }

    }

      console.log("Tokens count before early return:", tokens.length);
      if (tokens.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No FCM tokens found for emergency contacts",
      });
    }

    const timestamp =
      new Date().toLocaleString();

    const alertRef =
      await db
        .collection(
          "emergencyAlerts"
        )
        .add({

          victimId:
            userId,

          acknowledged:
            false,

          createdAt:
            admin.firestore
              .FieldValue
              .serverTimestamp(),

        });

    const alertId =
      alertRef.id;

    const payload = {
      tokens,
      notification: {
        title: "🚨 RoadSoS Emergency Alert",
        body: `${userData.fullName || "User"} may require assistance. Tap to view live location and medical information.`,
      },
      data: {
        alertId: String(alertId),
        userId: String(userId),
        victimName: String(userData.fullName || "User"),
        victimPhone: String(userData.phone || ""),
        bloodGroup: String(userData.bloodGroup || ""),
        allergies: String(userData.allergies || ""),
        medicalConditions: String(userData.medicalConditions || ""),
        medications: String(userData.medications || ""),
        emergencyNotes: String(userData.emergencyNotes || ""),
        compatibleDonors: JSON.stringify(compatibleDonors),
        latitude: String(latitude),
        longitude: String(longitude),
        locationLink: String(locationLink),
        timestamp: String(timestamp),
      },
      android: {
        priority: "high",
        notification: {
          channelId: "emergency_alarm_v2",
          sound: "alarm",
        },
      },
    };

    const response =
      await admin
        .messaging()
        .sendEachForMulticast(
          payload
        );

    sendReminder(
      alertId,
      tokens,
      payload,
      5 * 60 * 1000
    );

    sendReminder(
      alertId,
      tokens,
      payload,
      10 * 60 * 1000
    );

    console.log(
      "FCM RESPONSE:",
      JSON.stringify(response, null, 2)
    );

    console.log("FCM ALERT SENT");

    return res.status(200).json({
      success: true,
      message: "Emergency alert sent",
      alertId,
      sentCount: response.successCount,
      failedCount: response.failureCount,
    });
  } catch (error) {
    console.error("Emergency alert error:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
