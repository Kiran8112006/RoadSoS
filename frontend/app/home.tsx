import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';

import {
  useEffect,
} from 'react';

import {
  signOut,
} from 'firebase/auth';

import nativeAuth
from '@react-native-firebase/auth';

import {
  auth,
  db,
} from '../src/services/firebase/firebase.config';

import {
  doc,
  setDoc,
} from 'firebase/firestore';

import {
  router,
} from 'expo-router';

import Navbar
from '../src/components/ui/Navbar';

import {
  getFCMToken,
} from '../src/services/fcm.service';

export default function Home() {

  useEffect(() => {

    const setupFCM =
      async () => {

        try {

          console.log(
            'STARTING FCM SETUP'
          );

          const token =
            await getFCMToken();

          console.log(
            'TOKEN RECEIVED:',
            token
          );

          console.log(
            'FCM TOKEN:',
            token
          );

          if (
            token &&
            auth.currentUser
          ) {

            await setDoc(

              doc(
                db,
                'users',
                auth.currentUser.uid
              ),

              {
                fcmToken: token,
              },

              {
                merge: true,
              }

            );

            console.log(
              'FCM TOKEN SAVED'
            );

          }

        }

        catch (error) {

          console.log(
            'FCM ERROR:',
            error
          );

        }

      };

    setupFCM();

  }, []);

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
