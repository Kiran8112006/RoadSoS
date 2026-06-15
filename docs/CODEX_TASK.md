# RoadSoS Native Background Protection

Current branch: Kiran

IMPORTANT

Preserve all existing functionality.

Do not break:

- Login
- Profile completion
- FCM notifications
- Emergency contacts
- PDF reports
- Hospital lookup
- Existing emergency APIs
- Existing emergency screen
- Existing countdown

Goal:

When user presses Start Protection:

- Detection continues in background
- Detection continues when screen is locked
- Detection continues when app is minimized

Implement:

1. Android Kotlin Foreground Service
2. SensorManager Accelerometer
3. SensorManager Gyroscope
4. Background Location Tracking
5. Native React Native bridge
6. protectionManager.service.ts

Detection Logic:

Sensors
→ Driving Behavior ML Model
→ Road Surface ML Model
→ Suspicious Event
→ Validation Window (10-30s)
→ GPS Movement Analysis
→ Sensor Movement Analysis
→ Inactivity Analysis
→ Accident Confidence Score
→ Crash Confirmed
→ Existing Emergency Flow

Critical Rule:

Never trigger SOS from a single accelerometer spike.

After every suspicious event answer:

"Did the vehicle actually stop moving after the event?"

If GPS continues moving:
Cancel crash.

If accelerometer/gyroscope continue showing movement:
Cancel crash.

If no GPS movement and no sensor activity:
Increase confidence.

Crash Confirmed:

Use existing emergency screen.
Use existing countdown.
Use existing triggerEmergency().

Do not create a new emergency system.

Also implement:

- Full-screen Android crash alert
- Wake screen
- Play existing alarm
- Vibrate

Buttons:

I AM SAFE
GET HELP

Testing:

1. Pothole -> No crash
2. Impact + GPS moving -> Cancel
3. Impact + sensor movement -> Cancel
4. Impact + no movement -> Confirm
5. Locked screen -> Detection continues
6. Background app -> Detection continues

Deliver:

- Kotlin files
- Native bridge
- TS integration
- AndroidManifest changes
- app.json changes
- Install commands
- Testing instructions