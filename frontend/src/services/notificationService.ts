import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';

export const showEmergencyConfirmation = () => {
  return new Promise<boolean>((resolve) => {
    Alert.alert(
      '🚨 Emergency Detected',
      'Are you in trouble?',
      [
        {
          text: 'No',
          onPress: () => {
            console.log('User is safe - false alarm');
            resolve(false);
          },
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: () => {
            console.log('Emergency confirmed - triggering alert');
            resolve(true);
          },
          style: 'destructive',
        },
      ],
      { cancelable: false }
    );
  });
};

export const setupNotifications = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    console.error('Notification permission denied');
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
};
