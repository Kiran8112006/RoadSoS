import * as Location
from 'expo-location';

let subscription: any;

export const startLocationTracking =
async (
  onLocationUpdate: any
) => {

  const permission =
    await Location.requestForegroundPermissionsAsync();

  if (
    permission.status !==
    'granted'
  ) {

    console.log(
      'Location permission denied'
    );

    return;

  }

  subscription =
    await Location.watchPositionAsync(

      {
        accuracy:
          Location.Accuracy.High,

        timeInterval: 3000,

        distanceInterval: 1,
      },

      (location) => {

        onLocationUpdate(
          location
        );

      }
    );

};

export const stopLocationTracking =
() => {

  subscription?.remove();

};