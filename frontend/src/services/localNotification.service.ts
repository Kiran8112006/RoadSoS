import notifee, {
  AndroidImportance,
} from '@notifee/react-native';

const createDefaultChannel =
async () => {

  await notifee.createChannel({
    id: 'default',
    name: 'Default',
    importance: AndroidImportance.HIGH,
  });

};

export const showAlertSentNotification =
async () => {

  await createDefaultChannel();

  await notifee.displayNotification({

    title:
      'RoadSoS Alert Sent',

    body:
      'Emergency contacts have been notified.',

    android: {

      channelId:
        'default',

      pressAction: {
        id: 'default',
      },

    },

  });

};
