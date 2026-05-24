export const calculateCrashRisk = (

  speed: number,

  accel: any,

  gyro: any,

) => {

  let risk = 0;

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

  if (speed > 60) {

    risk += 20;

  }

  if (speed > 100) {

    risk += 20;

  }

  /*
    ACCELEROMETER FACTOR
  */

  if (accelForce > 1.5) {

    risk += 30;

  }

  if (accelForce > 30) {

    risk += 40;

  }

  /*
    GYROSCOPE FACTOR
  */

  if (gyroForce > 0.5) {

    risk += 20;

  }

  if (gyroForce > 1.5) {

    risk += 30;

  }

  return Math.min(
    risk,
    100
  );

};