const express = require("express");
const cors = require("cors");
const http = require("http");
const { admin, db } = require("./firebaseAdmin");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const profileRoutes =
  require('./routes/profile.routes');

const userLocations = new Map();

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function notifyNearbyUsers(report, radiusMeters = 5000) {
  const reportLat = report.location.latitude;
  const reportLon = report.location.longitude;

  userLocations.forEach((userLocation, socketId) => {
    const distance = calculateDistance(
      reportLat,
      reportLon,
      userLocation.latitude,
      userLocation.longitude
    );

    if (distance <= radiusMeters) {
      io.to(socketId).emit('report:nearby', {
        ...report,
        distanceMeters: Math.round(distance),
      });
    }
  });
}

const reportRoutes =
  require('./routes/report.routes');

app.use(cors());
app.use(express.json());


app.use(
  '/api/profile',
  profileRoutes
);

app.use(
  '/api/reports',
  reportRoutes(io, notifyNearbyUsers)
);

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('user:location', (location) => {
    if (location?.latitude && location?.longitude) {
      userLocations.set(socket.id, location);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
    userLocations.delete(socket.id);
  });
});



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

server.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});
