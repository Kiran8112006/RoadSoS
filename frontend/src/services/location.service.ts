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
          Location.Accuracy.BestForNavigation,

        timeInterval: 1000,

        distanceInterval: 1,
      },

      (location) => {

        onLocationUpdate(
          location
        );

      }
    );

};

export const getCurrentAccurateLocation =
async () => {

  const permission =
    await Location.requestForegroundPermissionsAsync();

  if (
    permission.status !==
    'granted'
  ) {

    console.log(
      'Location permission denied'
    );

    return null;

  }

  try {

    await Location.enableNetworkProviderAsync();

  } catch (error) {

    console.log(
      'NETWORK LOCATION PROVIDER:',
      error
    );

  }

  let bestLocation: any =
    null;

  return new Promise<any>(
    async (resolve) => {

      let resolved =
        false;

      let liveSubscription: any;

      const finish =
      (location: any) => {

        if (resolved) {
          return;
        }

        resolved =
          true;

        liveSubscription?.remove();

        resolve(
          location
        );

      };

      const timeout =
        setTimeout(
          () => {

            finish(
              bestLocation
            );

          },
          10000
        );

      try {

        const currentLocation =
          await Location.getCurrentPositionAsync({
            accuracy:
              Location.Accuracy.BestForNavigation,
          });

        bestLocation =
          currentLocation;

        if (
          currentLocation.coords.accuracy != null &&
          currentLocation.coords.accuracy <= 50
        ) {

          clearTimeout(
            timeout
          );

          finish(
            currentLocation
          );

          return;

        }

        liveSubscription =
          await Location.watchPositionAsync(
            {
              accuracy:
                Location.Accuracy.BestForNavigation,

              timeInterval:
                1000,

              distanceInterval:
                0,
            },
            (location) => {

              const currentAccuracy =
                location.coords.accuracy ??
                Number.MAX_SAFE_INTEGER;

              const bestAccuracy =
                bestLocation?.coords?.accuracy ??
                Number.MAX_SAFE_INTEGER;

              if (
                currentAccuracy <
                bestAccuracy
              ) {

                bestLocation =
                  location;

              }

              if (
                currentAccuracy <= 50
              ) {

                clearTimeout(
                  timeout
                );

                finish(
                  location
                );

              }

            }
          );

      } catch (error) {

        console.log(
          'ACCURATE LOCATION ERROR:',
          error
        );

        clearTimeout(
          timeout
        );

        finish(
          bestLocation
        );

      }

    }
  );

};

export const stopLocationTracking =
() => {

  subscription?.remove();

};
