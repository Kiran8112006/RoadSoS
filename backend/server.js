require('dotenv').config();
const express = require("express");
const cors = require("cors");
const { admin, db } = require("./firebaseAdmin");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const profileRoutes = require("./routes/profile.routes");

const emergencyRoutes = require("./routes/emergencyRoutes");

const alertRoutes =
  require(
    "./routes/alertRoutes"
  );

const hospitalRoutes =
  require(
    "./routes/hospitalRoutes"
  );

const pdfRoutes =
  require(
    "./routes/pdfRoutes"
  );

app.use(
  "/api/pdf",
  pdfRoutes
);

app.use(
  "/api/alerts",
  alertRoutes
);

app.use(
  "/api/hospitals",
  hospitalRoutes
);

app.use("/api/emergency", emergencyRoutes);
app.use("/api/profile", profileRoutes);

function calculateAge(dob) {
    if (!dob) return null;

    const birthDate = new Date(dob);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
        age--;
    }

    return age;
}

async function verifyFirebaseToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "No token provided",
            });
        }

        const token = authHeader.split("Bearer ")[1];

        const decodedToken = await admin.auth().verifyIdToken(token);

        req.user = decodedToken;

        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token",
            error: error.message,
        });
    }
}

app.post("/api/users/profile", verifyFirebaseToken, async (req, res) => {
    try {
        const uid = req.user.uid;

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

        const allowedGenders = ["Male", "Female", "Others"];

        if (
            !fullName ||
            !email ||
            !phone ||
            !dob ||
            !gender ||
            !bloodGroup ||
            !allergies ||
            !Array.isArray(allergies) ||
            allergies.length === 0 ||
            !medicalConditions ||
            !Array.isArray(medicalConditions) ||
            medicalConditions.length === 0 ||
            !medications ||
            !Array.isArray(medications) ||
            medications.length === 0 ||
            !emergencyNotes ||
            !emergencyContacts ||
            !Array.isArray(emergencyContacts) ||
            emergencyContacts.length === 0
        ) {
            return res.status(400).json({
                message: "All fields are mandatory. Please complete the profile.",
            });
        }

        if (!allowedGenders.includes(gender)) {
            return res.status(400).json({
                message: "Gender must be Male, Female, or Others",
            });
        }

        for (const contact of emergencyContacts) {
            if (!contact.name || !contact.phone || !contact.relationship) {
                return res.status(400).json({
                    message:
                        "Each emergency contact must include name, phone, and relationship",
                });
            }
        }

        const userRef = db.collection("users").doc(uid);

        await userRef.set(
            {
                uid,
                fullName,
                email,
                phone,
                dob,
                gender,
                role: "user",
                authProvider: req.user.firebase.sign_in_provider,
                profileCompleted: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
        );

        await userRef.collection("medicalInfo").doc("private").set(
            {
                fullName,
                dob,
                gender,
                bloodGroup,
                allergies,
                medicalConditions,
                medications,
                emergencyNotes,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
        );

        const contactsRef = userRef.collection("emergencyContacts");

        for (const contact of emergencyContacts) {
            await contactsRef.add({
                name: contact.name,
                phone: contact.phone,
                relationship: contact.relationship,
                isPrimary: contact.isPrimary || false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }

        return res.status(200).json({
            message: "User profile saved successfully",
            uid,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to save profile",
            error: error.message,
        });
    }
});

app.get("/api/users/profile", verifyFirebaseToken, async (req, res) => {
    try {
        const uid = req.user.uid;

        const userRef = db.collection("users").doc(uid);

        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({
                message: "User profile not found",
            });
        }

        const medicalDoc = await userRef
            .collection("medicalInfo")
            .doc("private")
            .get();

        const contactsSnapshot = await userRef
            .collection("emergencyContacts")
            .get();

        const contacts = contactsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        const userData = userDoc.data();
        const medicalData = medicalDoc.exists ? medicalDoc.data() : null;

        return res.status(200).json({
            user: {
                ...userData,
                age: calculateAge(userData.dob),
            },
            medicalInfo: medicalData
                ? {
                      ...medicalData,
                      age: calculateAge(medicalData.dob),
                  }
                : null,
            emergencyContacts: contacts,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch profile",
            error: error.message,
        });
    }
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
