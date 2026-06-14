import messaging
from '@react-native-firebase/messaging';

import notifee, {
  AndroidImportance,
} from '@notifee/react-native';

export const createEmergencyChannel =
async () => {

  const channelId =
    await notifee.createChannel({
      id: 'emergency_alarm_v2',
      name: 'Emergency Alerts',
      importance: AndroidImportance.HIGH,
      sound: 'alarm',
      vibration: true,
    });

  console.log(
    'CHANNEL CREATED:',
    channelId
  );

};

export const getFCMToken =
async () => {

  try {

    await createEmergencyChannel();

    const authStatus =
      await messaging()
        .requestPermission();

    console.log(
      'AUTH STATUS:',
      authStatus
    );

    const token =
      await messaging()
        .getToken();

    console.log(
      'FCM TOKEN:',
      token
    );

    return token;

  }

  catch(error) {

    console.log(
      'FCM ERROR:',
      error
    );

    throw error;

  }

};

export const testEmergencyAlarmNotification =
async () => {

  await createEmergencyChannel();

  await notifee.displayNotification({

    title:
      'TEST ALARM',

    body:
      'Testing emergency sound',

    android: {

      channelId:
        'emergency_alarm_v2',

      sound:
        'alarm',

    },

  });

};
