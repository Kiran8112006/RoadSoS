import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';

import {
  signOut,
} from 'firebase/auth';

import nativeAuth
from '@react-native-firebase/auth';

import {
  auth,
} from '../src/services/firebase/firebase.config';

import {
  router,
} from 'expo-router';

import Navbar
from '../src/components/ui/Navbar';

export default function Home() {

  const handleLogout =
    async () => {

      await Promise.allSettled([
        signOut(auth),
        nativeAuth().signOut(),
      ]);

      router.replace(
        '/auth/login'
      );

    };

  return (

    <View
      style={{
        flex: 1,

        justifyContent: 'center',

        alignItems: 'center',

        backgroundColor: 'white',

        padding: 24,
      }}
    >

      <Text
        style={{
          fontSize: 34,

          fontWeight: 'bold',
        }}
      >
        RoadSoS
      </Text>

      <Text
        style={{
          marginTop: 10,

          fontSize: 16,

          color: 'gray',
        }}
      >
        RoadSoS
      </Text>

      <TouchableOpacity
        onPress={handleLogout}
        style={{
          marginTop: 30,

          backgroundColor: '#ff3b30',

          paddingVertical: 14,

          paddingHorizontal: 30,

          borderRadius: 14,
        }}
      >

        <Text
          style={{
            color: 'white',

            fontWeight: 'bold',

            fontSize: 16,
          }}
        >
          Logout
        </Text>

      </TouchableOpacity>

      <Navbar />

    </View>

  );

}