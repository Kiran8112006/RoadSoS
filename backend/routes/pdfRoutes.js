const express = require("express");
const PDFDocument = require("pdfkit");

const { db } = require("../firebaseAdmin");

const router = express.Router();

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

function ensureSpace(
  doc,
  y,
  requiredHeight
) {

  if (
    y + requiredHeight >
    720
  ) {

    doc.addPage();

    return 50;

  }

  return y;

}

function drawSection(
  doc,
  title,
  y,
  height
) {

  y = ensureSpace(
    doc,
    y,
    height
  );

  doc
    .roundedRect(
      40,
      y,
      520,
      height,
      10
    )
    .fillAndStroke(
      "#F8FAFC",
      "#E5E7EB"
    );

  doc
    .fillColor("#DC2626")
    .fontSize(15)
    .font("Helvetica-Bold")
    .text(
      title,
      60,
      y + 15
    );

  return y + 45;

}

router.get(
  "/medical-report/:userId",
  async (req, res) => {

    try {

      const { userId } =
        req.params;

      const userDoc =
        await db
          .collection("users")
          .doc(userId)
          .get();

      if (!userDoc.exists) {

        return res
          .status(404)
          .json({
            message:
              "User not found",
          });

      }

      const user =
        userDoc.data();

      const contactsSnapshot =
        await db
          .collection("users")
          .doc(userId)
          .collection("emergencyContacts")
          .get();

      const contacts =
        contactsSnapshot.docs.map(
          doc => ({
            id: doc.id,
            ...doc.data(),
          })
        );

      const compatibleDonors = [];

      for (
        const contact of contacts
      ) {

        if (
          !contact.contactUserId
        ) {
          continue;
        }

        const donorDoc =
          await db
            .collection("users")
            .doc(
              contact.contactUserId
            )
            .get();

        if (
          !donorDoc.exists
        ) {
          continue;
        }

        const donor =
          donorDoc.data();

        if (
          canDonate(
            donor.bloodGroup,
            user.bloodGroup
          )
        ) {

          compatibleDonors.push({

            name:
              contact.name,

            relationship:
              contact.relationship,

            phone:
              contact.phone,

            bloodGroup:
              donor.bloodGroup,

          });

        }

      }

      res.setHeader(
        "Content-Type",
        "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename=RoadSoS-Medical-Report.pdf`
      );

      const doc =
        new PDFDocument({
          margin: 50,
        });

      doc.pipe(res);

      let y = 0;

      doc
        .rect(
          0,
          0,
          612,
          90
        )
        .fill("#DC2626");

      doc
        .fillColor("white")
        .fontSize(28)
        .font("Helvetica-Bold")
        .text(
          "RoadSoS",
          50,
          25
        );

      doc
        .fontSize(13)
        .text(
          "Emergency Medical Report",
          50,
          60
        );

      y = 120;

      const patientHeight =
        140;

      y = drawSection(
        doc,
        "PATIENT INFORMATION",
        y,
        patientHeight
      );

      doc
        .fillColor("black")
        .fontSize(12)
        .font("Helvetica");

      doc.text(
        `Name: ${user.fullName || "-"}`,
        60,
        y
      );

      doc.text(
        `Phone: ${user.phone || "-"}`,
        60,
        y + 25
      );

      doc.text(
        `Gender: ${user.gender || "-"}`,
        60,
        y + 50
      );

      doc.text(
        `DOB: ${user.dob || "-"}`,
        60,
        y + 75
      );

      doc
        .roundedRect(
          430,
          y - 10,
          80,
          50,
          8
        )
        .fill("#DC2626");

      doc
        .fillColor("white")
        .fontSize(22)
        .font("Helvetica-Bold")
        .text(
          user.bloodGroup || "-",
          452,
          y + 5
        );

      y += 120;

      const medicalHeight =
        160;

      y = drawSection(
        doc,
        "MEDICAL INFORMATION",
        y,
        medicalHeight
      );

      doc
        .fillColor("black")
        .fontSize(12)
        .font("Helvetica");

      doc.text(
        `Allergies: ${user.allergies || "-"}`,
        60,
        y
      );

      doc.text(
        `Medical Conditions: ${user.medicalConditions || "-"}`,
        60,
        y + 25
      );

      doc.text(
        `Medications: ${user.medications || "-"}`,
        60,
        y + 50
      );

      doc.text(
        `Emergency Notes: ${user.emergencyNotes || "-"}`,
        60,
        y + 75
      );

      y += 140;

      const donorHeight =
        Math.max(
          100,
          compatibleDonors.length * 30 + 60
        );

      y = drawSection(
        doc,
        "COMPATIBLE BLOOD DONORS",
        y,
        donorHeight
      );

      doc
        .fillColor("black")
        .fontSize(12)
        .font("Helvetica");

      if (
        compatibleDonors.length === 0
      ) {

        doc
          .fillColor("#DC2626")
          .font("Helvetica-Bold")
          .text(
            "No compatible blood donors found.",
            60,
            y
          );

      }
      else {

        let donorY = y;

        compatibleDonors.forEach(
          donor => {

            doc
              .fillColor("#16A34A")
              .font("Helvetica-Bold")
              .text(
                `✓ ${donor.relationship} (${donor.bloodGroup})`,
                60,
                donorY
              );

            doc
              .fillColor("black")
              .font("Helvetica")
              .text(
                donor.phone || "-",
                300,
                donorY
              );

            donorY += 25;

          }
        );

      }

      y += donorHeight;

      const contactsHeight =
        Math.max(
          120,
          contacts.length * 30 + 60
        );

      y = drawSection(
        doc,
        "EMERGENCY CONTACTS",
        y,
        contactsHeight
      );

      let contactY = y;

      contacts.forEach(
        contact => {

          doc
            .fillColor("black")
            .font("Helvetica")
            .fontSize(12);

          doc.text(
            contact.relationship ||
            "Contact",
            60,
            contactY
          );

          doc.text(
            contact.name || "-",
            220,
            contactY
          );

          doc.text(
            contact.phone || "-",
            420,
            contactY
          );

          contactY += 30;

        }
      );

      y += contactsHeight;

      y += 20;

      y = ensureSpace(
        doc,
        y,
        40
      );

      doc
        .fillColor("#6B7280")
        .fontSize(10)
        .text(
          "Generated by RoadSoS • Emergency Response Platform",
          40,
          y,
          {
            align: "center",
          }
        );

      doc.end();

    }

    catch (error) {

      console.log(error);

      res
        .status(500)
        .json({
          error:
            error.message,
        });

    }

  }
);

module.exports = router;
