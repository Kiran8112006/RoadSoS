import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';

import {
  signOut,
} from 'firebase/auth';

import nativeAuth from '@react-native-firebase/auth';

import { auth }
from '../src/services/firebase/firebase.config';

import {
  router,
} from 'expo-router';

export default function Home() {

  const logout = async () => {

    await Promise.allSettled([
      signOut(auth),
      nativeAuth().signOut(),
    ]);

    router.replace('/auth/login');

  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0B0F19',
      }}
    >
      <Text
        style={{
          color: '#ffffff',
          fontSize: 28,
          fontWeight: 'bold',
          marginBottom: 30,
        }}
      >
        RoadSOS Home
      </Text>

      <TouchableOpacity
        onPress={logout}
        style={{
          backgroundColor: '#EF4444',
          paddingHorizontal: 30,
          paddingVertical: 14,
          borderRadius: 12,
        }}
      >
        <Text
          style={{
            color: '#ffffff',
            fontWeight: '700',
          }}
        >
          Logout
        </Text>
      </TouchableOpacity>

    </View>
  );
}
