const express = require("express");
const cors = require("cors");
const { admin, db } = require("./firebaseAdmin");

const app = express();

app.use(cors());
app.use(express.json());

// Middleware to verify Firebase login token
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

// Save user profile after first login
app.post("/api/users/profile", verifyFirebaseToken, async (req, res) => {
    try {
        const uid = req.user.uid;

        const {
            fullName,
            email,
            phone,
            age,
            gender,
            bloodGroup,
            allergies,
            medicalConditions,
            medications,
            existingDiseases,
            address,
            emergencyNotes,
            emergencyContacts,
        } = req.body;

        if (!fullName || !phone || !bloodGroup) {
            return res.status(400).json({
                message: "Full name, phone, and blood group are required",
            });
        }

        const userRef = db.collection("users").doc(uid);

        await userRef.set(
            {
                uid,
                fullName,
                email: email || req.user.email || "",
                phone,
                age: age || null,
                gender: gender || "",
                role: "user",
                authProvider: req.user.firebase.sign_in_provider,
                address: address || "",
                profileCompleted: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
        );

        await userRef.collection("medicalInfo").doc("private").set(
            {
                fullName,
                age: age || null,
                gender: gender || "",
                bloodGroup,
                allergies: allergies || [],
                medicalConditions: medicalConditions || [],
                medications: medications || [],
                existingDiseases: existingDiseases || [],
                emergencyNotes: emergencyNotes || "",
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
        );

        if (Array.isArray(emergencyContacts)) {
            const contactsRef = userRef.collection("emergencyContacts");

            for (const contact of emergencyContacts) {
                if (!contact.name || !contact.phone) {
                    continue;
                }

                await contactsRef.add({
                    name: contact.name,
                    phone: contact.phone,
                    relationship: contact.relationship || "",
                    isPrimary: contact.isPrimary || false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
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

// Get current user's profile
app.get("/api/users/profile", verifyFirebaseToken, async (req, res) => {
    try {
        const uid = req.user.uid;

        const userDoc = await db.collection("users").doc(uid).get();

        if (!userDoc.exists) {
            return res.status(404).json({
                message: "User profile not found",
            });
        }

        const medicalDoc = await db
            .collection("users")
            .doc(uid)
            .collection("medicalInfo")
            .doc("private")
            .get();

        const contactsSnapshot = await db
            .collection("users")
            .doc(uid)
            .collection("emergencyContacts")
            .get();

        const contacts = contactsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return res.status(200).json({
            user: userDoc.data(),
            medicalInfo: medicalDoc.exists ? medicalDoc.data() : null,
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

app.listen(PORT);