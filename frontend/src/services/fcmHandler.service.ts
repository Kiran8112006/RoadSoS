import messaging
from '@react-native-firebase/messaging';

import {
  navigateToEmergencyAlert,
} from './fcmNavigation.service';

import {
  startAlarm,
} from './alarm.service';

export const
initializeFCMHandlers =
() => {

  //
  // APP OPEN
  //
  const unsubscribeForeground =
    messaging()
      .onMessage(
        async remoteMessage => {

          console.log(
            'FOREGROUND FCM:',
            remoteMessage
          );

          if (
            remoteMessage.data
          ) {

            await startAlarm();

            navigateToEmergencyAlert(
              remoteMessage.data
            );

          }

        }
      );

  //
  // APP IN BACKGROUND
  //
  const unsubscribeOpened =
    messaging()
      .onNotificationOpenedApp(
        remoteMessage => {

          console.log(
            'BACKGROUND NOTIFICATION TAP'
          );

          if (
            remoteMessage?.data
          ) {

            navigateToEmergencyAlert(
              remoteMessage.data
            );

          }

        }
      );

  return () => {

    unsubscribeForeground();
    unsubscribeOpened();

  };

};

export const
handleInitialNotification =
async () => {

  const remoteMessage =
    await messaging()
      .getInitialNotification();

  if (
    remoteMessage?.data
  ) {

    console.log(
      'APP OPENED FROM KILLED STATE'
    );

    setTimeout(() => {

      navigateToEmergencyAlert(
        remoteMessage.data
      );

    }, 1500);

  }

};
