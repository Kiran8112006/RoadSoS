export const calculateCrashRisk = (

  speed: number,

  accel: any,

  gyro: any,

) => {

  let risk = 0;

  const TEST_SPEED_LOW_KMH =
    5;

  const TEST_SPEED_HIGH_KMH =
    15;

  const TEST_ACCEL_LOW =
    1.4;

  const TEST_ACCEL_MEDIUM =
    1.8;

  const TEST_ACCEL_HIGH =
    2.4;

  const TEST_GYRO_LOW =
    0.8;

  const TEST_GYRO_HIGH =
    1.4;

  const accelForce = Math.sqrt(

    (accel?.x || 0) ** 2 +

    (accel?.y || 0) ** 2 +

    (accel?.z || 0) ** 2

  );

  const gyroForce = Math.sqrt(

    (gyro?.x || 0) ** 2 +

    (gyro?.y || 0) ** 2 +

    (gyro?.z || 0) ** 2

  );

  /*
    SPEED FACTOR
  */

  if (speed > TEST_SPEED_LOW_KMH) {

    risk += 20;

  }

  if (speed > TEST_SPEED_HIGH_KMH) {

    risk += 20;

  }

  /*
    ACCELEROMETER
  */

  if (accelForce > TEST_ACCEL_LOW) {

    risk += 20;

  }

  if (accelForce > TEST_ACCEL_MEDIUM) {

    risk += 30;

  }

  if (accelForce > TEST_ACCEL_HIGH) {

    risk += 40;

  }

  /*
    GYROSCOPE
  */

  if (gyroForce > TEST_GYRO_LOW) {

    risk += 20;

  }

  if (gyroForce > TEST_GYRO_HIGH) {

    risk += 30;

  }

  return Math.min(
    risk,
    100
  );

};
