const express = require("express");
const admin = require("firebase-admin");

const router = express.Router();

function calculateAge(dob) {
  if (!dob) return null;

  const birthDate = new Date(dob);
  const today = new Date();

  let age =
    today.getFullYear() -
    birthDate.getFullYear();

  const monthDiff =
    today.getMonth() -
    birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 &&
      today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

router.post("/complete", async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      dob,
      gender,
      bloodGroup,
      allergies,
      medicalConditions,
      medications,
      emergencyNotes,
      emergencyContacts,
    } = req.body;

    const token =
      req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    const decodedToken = await admin
      .auth()
      .verifyIdToken(token);

    const uid = decodedToken.uid;

    const allowedGenders = [
      "Male",
      "Female",
      "Others",
    ];

    if (
      !fullName ||
      !email ||
      !phone ||
      !dob ||
      !gender ||
      !bloodGroup ||
      !allergies ||
      !medicalConditions ||
      !medications ||
      !emergencyNotes ||
      !emergencyContacts ||
      !Array.isArray(emergencyContacts) ||
      emergencyContacts.length === 0
    ) {
      return res.status(400).json({
        message:
          "All fields are mandatory. Please complete the profile.",
      });
    }

    if (!allowedGenders.includes(gender)) {
      return res.status(400).json({
        message:
          "Gender must be Male, Female, or Others",
      });
    }

    for (const contact of emergencyContacts) {
      if (
        !contact.name ||
        !contact.phone ||
        !contact.relationship
      ) {
        return res.status(400).json({
          message:
            "Each emergency contact must include name, phone, and relationship",
        });
      }
    }

    const userRef = admin
      .firestore()
      .collection("users")
      .doc(uid);

    await userRef.set(
      {
        uid,
        fullName,
        email:
          email ||
          decodedToken.email ||
          "",
        phone:
          phone ||
          decodedToken.phone_number ||
          "",
        dob,
        gender,
        role: "user",
        bloodGroup,
        allergies,
        medicalConditions,
        medications,
        emergencyNotes,
        profileCompleted: true,
        updatedAt:
          admin.firestore.FieldValue.serverTimestamp(),
        createdAt:
          admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const allUsers =
      await admin
        .firestore()
        .collection("users")
        .get();

    for (
      const userDoc
      of allUsers.docs
    ) {

      const contactsSnapshot =
        await userDoc.ref
          .collection(
            "emergencyContacts"
          )
          .where(
            "phone",
            "==",
            phone
          )
          .get();

      for (
        const contactDoc
        of contactsSnapshot.docs
      ) {

        await contactDoc.ref
          .update({

            contactUserId:
              uid,

          });

        console.log(
          `Linked ${phone} to ${uid}`
        );

      }

    }

    const contactsRef = userRef.collection(
      "emergencyContacts"
    );

    for (const contact of emergencyContacts) {
      const contactsRef =
        userRef.collection("emergencyContacts");

      for (const contact of emergencyContacts) {

        let contactUserId = null;

        const matchingUsers =
          await admin
            .firestore()
            .collection("users")
            .where(
              "phone",
              "==",
              contact.phone
            )
            .limit(1)
            .get();

        if (!matchingUsers.empty) {

          contactUserId =
            matchingUsers.docs[0].id;

        }

        await contactsRef.add({

          name:
            contact.name,

          phone:
            contact.phone,

          relationship:
            contact.relationship,

          contactUserId,

          isPrimary:
            contact.isPrimary || false,

          createdAt:
            admin.firestore.FieldValue.serverTimestamp(),

        });

      }
    }

    return res.status(200).json({
      success: true,
      message:
        "Profile completed successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
});

router.get("/profile", async (req, res) => {
  try {
    const token =
      req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    const decodedToken = await admin
      .auth()
      .verifyIdToken(token);

    const uid = decodedToken.uid;

    const userRef = admin
      .firestore()
      .collection("users")
      .doc(uid);

    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({
        message: "User profile not found",
      });
    }

    const contactsSnapshot =
      await userRef
        .collection("emergencyContacts")
        .get();

    const emergencyContacts =
      contactsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

    const userData = userDoc.data();

    return res.status(200).json({
      ...userData,
      age: calculateAge(userData.dob),
      emergencyContacts,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
});

module.exports = router;
