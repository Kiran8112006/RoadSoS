import {
  Stack,
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

    return unsubscribe;

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
