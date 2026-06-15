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

    console.log("===== EMERGENCY CONTACT DEBUG =====");
    console.log("Victim UID:", userId);
    console.log("Emergency contacts count:", contactsSnapshot.size);

    contactsSnapshot.docs.forEach((doc) => {
      console.log(
        "CONTACT DOC:",
        doc.id,
        JSON.stringify(doc.data(), null, 2)
      );
    });

    const tokens = [];
    const compatibleDonors = [];
    const victimBloodGroup =
      userData.bloodGroup;

    for (const contactDoc of contactsSnapshot.docs) {

      const contactData =
        contactDoc.data();

      console.log("CONTACT USER ID:", contactData.contactUserId);

      if (contactData.contactUserId) {
        const linkedUserDoc = await db
          .collection("users")
          .doc(contactData.contactUserId)
          .get();

        console.log(
          "LINKED USER EXISTS:",
          linkedUserDoc.exists
        );

        if (linkedUserDoc.exists) {
          const linkedUserData = linkedUserDoc.data();

          console.log(
            "LINKED USER DOC ID:",
            linkedUserDoc.id
          );

          console.log(
            "LINKED USER DATA:",
            JSON.stringify(linkedUserData, null, 2)
          );

          console.log(
            "LINKED USER FCM TOKEN:",
            linkedUserData?.fcmToken
          );
        }
      }

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

      if (
        !linkedUserDoc.exists
      ) {
        continue;
      }

      const linkedUserData =
        linkedUserDoc.data();

      console.log("CONTACT LOOKUP DETAILS:", {
        contactUserId: contactData.contactUserId,
        linkedUserExists: linkedUserDoc.exists,
        linkedUserId: linkedUserDoc.id,
        linkedUserData,
        fcmToken: linkedUserData?.fcmToken,
      });

      if (
        linkedUserData?.fcmToken
      ) {

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

    console.log("CONTACT LOOKUP RESULTS");
    console.log("TOKENS ARRAY", tokens);
    console.log("TOKENS ARRAY:", JSON.stringify(tokens, null, 2));

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
