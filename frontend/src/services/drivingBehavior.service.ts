interface SensorSample {
  timestamp: number;
  speed: number; // in km/h
  accel: { x: number; y: number; z: number };
  gyro: { x: number; y: number; z: number };
}

let samples: SensorSample[] = [];

export const clearDrivingBehaviorHistory = () => {
  samples = [];
};

export const addSample = (speed: number, accel: any, gyro: any) => {
  const now = Date.now();
  samples.push({
    timestamp: now,
    speed,
    accel: {
      x: accel?.x || 0,
      y: accel?.y || 0,
      z: accel?.z || 0,
    },
    gyro: {
      x: gyro?.x || 0,
      y: gyro?.y || 0,
      z: gyro?.z || 0,
    },
  });

  // Keep only last 5 seconds of samples
  const cutoff = now - 5000;
  samples = samples.filter((s) => s.timestamp >= cutoff);
};

export const getFeatures = (): number[] | null => {
  if (samples.length === 0) return null;

  // 1. Calculate roll, pitch, and relative yaw for all samples in the rolling window
  const computedSamples: Array<{
    speed: number;
    accel_mag: number;
    roll: number;
    pitch: number;
    yaw: number;
  }> = [];

  let currentYaw = 0;
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    const ax = s.accel.x;
    const ay = s.accel.y;
    const az = s.accel.z;
    const gz = s.gyro.z;

    // Roll = atan2(y, z) in degrees
    const roll = Math.atan2(ay, az) * (180 / Math.PI);

    // Pitch = atan2(-x, sqrt(y² + z²)) in degrees
    const pitch = Math.atan2(-ax, Math.sqrt(ay * ay + az * az)) * (180 / Math.PI);

    // Yaw: Integrate gyro.z over time within the rolling window
    if (i > 0) {
      const prev = samples[i - 1];
      const dt = (s.timestamp - prev.timestamp) / 1000; // in seconds
      if (dt > 0 && dt < 2) {
        // Integrate and convert gyro.z (rad/s) to degrees/s
        currentYaw += gz * dt * (180 / Math.PI);
      }
    } else {
      // First sample in window acts as yaw reference = 0
      currentYaw = 0;
    }

    const accel_mag = Math.sqrt(ax * ax + ay * ay + az * az);

    computedSamples.push({
      speed: s.speed,
      accel_mag,
      roll,
      pitch,
      yaw: currentYaw,
    });
  }

  // 2. Extract arrays
  const speeds = computedSamples.map((s) => s.speed);
  const accels = computedSamples.map((s) => s.accel_mag);
  const rolls = computedSamples.map((s) => s.roll);
  const pitches = computedSamples.map((s) => s.pitch);
  const yaws = computedSamples.map((s) => s.yaw);

  // 3. Statistical helpers
  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const max = (arr: number[]) => Math.max(...arr);
  const min = (arr: number[]) => Math.min(...arr);
  const std = (arr: number[]) => {
    if (arr.length <= 1) return 0;
    const m = mean(arr);
    const v = arr.reduce((a, b) => a + Math.pow(b - m, 2), 0) / arr.length;
    return Math.sqrt(v);
  };
  const range = (arr: number[]) => max(arr) - min(arr);

  // Return exactly 19 features in exact order
  return [
    // 1-5: Speed
    mean(speeds), max(speeds), min(speeds), std(speeds), range(speeds),
    // 6-10: Accel magnitude
    mean(accels), max(accels), min(accels), std(accels), range(accels),
    // 11-13: Roll
    mean(rolls), std(rolls), range(rolls),
    // 14-16: Pitch
    mean(pitches), std(pitches), range(pitches),
    // 17-19: Yaw
    mean(yaws), std(yaws), range(yaws),
  ];
};

export const getDrivingBehaviorPrediction = async (
  features: number[]
): Promise<{ prediction: number; confidence: number } | null> => {
  const rawApiUrl = process.env.EXPO_PUBLIC_API_URL || '';
  const API_BASE_URL = rawApiUrl.replace(/\/+$/, '').replace(/\/api$/, '');
  const requestUrl = `${API_BASE_URL}/api/ml/driving-risk`;

  console.log("ML FUNCTION ENTERED");

  console.log(
    "ML API URL:",
    requestUrl
  );

  console.log(
    "ML FEATURES LENGTH:",
    features.length
  );

  console.log("ML FETCH START");

  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ features }),
    });

    if (!response.ok) {
      console.warn('Driving behavior prediction API error:', response.statusText);
      return null;
    }

    const data = await response.json();
    const result = data;
    console.log('ML RESPONSE:', result);
    return result;
  } catch (error) {
    console.log(
      "ML FETCH ERROR:",
      error
    );
    return null;
  }
};
