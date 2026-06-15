import {
  Stack,
  router,
} from 'expo-router';

import {
  useEffect,
} from 'react';

import {
  AuthProvider,
} from '../src/context/AuthContext';

import {
  initializeFCMHandlers,
  handleInitialNotification,
} from '../src/services/fcmHandler.service';

import {
  createEmergencyChannel,
} from '../src/services/fcm.service';

import {
  subscribeToNativeCrashConfirmed,
} from '../src/services/protectionManager.service';

export default function RootLayout() {

  useEffect(() => {

    console.log(
      'API URL:',
      process.env.EXPO_PUBLIC_API_URL
    );

    createEmergencyChannel();

    const unsubscribe =
      initializeFCMHandlers();

    handleInitialNotification();

    const unsubscribeNativeCrash =
      subscribeToNativeCrashConfirmed(
        (event) => {

          router.push({
            pathname: '/emergency',
            params: {
              nativeCrash: 'true',
              latitude:
                event.latitude?.toString(),
              longitude:
                event.longitude?.toString(),
              confidence:
                event.confidence?.toString(),
            },
          });

        }
      );

    return () => {

      unsubscribe();

      unsubscribeNativeCrash();

    };

  }, []);

  return (
    <AuthProvider>

      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />

    </AuthProvider>
  );
}
