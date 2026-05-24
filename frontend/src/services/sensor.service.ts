import {
  Accelerometer,
  Gyroscope,
} from 'expo-sensors';

let accelSubscription: any;
let gyroSubscription: any;

export const startSensors =
(
  onAccelerometerData: any,
  onGyroscopeData: any
) => {

  Accelerometer.setUpdateInterval(
    500
  );

  Gyroscope.setUpdateInterval(
    500
  );

  accelSubscription =
    Accelerometer.addListener(
      (data) => {

        onAccelerometerData(
          data
        );

      }
    );

  gyroSubscription =
    Gyroscope.addListener(
      (data) => {

        onGyroscopeData(
          data
        );

      }
    );

};

export const stopSensors = () => {

  accelSubscription?.remove();

  gyroSubscription?.remove();

};