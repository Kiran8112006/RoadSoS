export const detectInactivity = (

  accel: any,

  gyro: any,

  speed: number

) => {

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

  const stillAccel =
    accelForce < 1.2;

  const stillGyro =
    gyroForce < 0.2;

  const stillSpeed =
    speed < 2;

  return (

    stillAccel &&

    stillGyro &&

    stillSpeed

  );

};