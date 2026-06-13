import nativeAuth from '@react-native-firebase/auth';
import { signOut } from 'firebase/auth';
import { router } from 'expo-router';
import {
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Navbar from '../src/components/ui/Navbar';
import { auth } from '../src/services/firebase/firebase.config';

export default function Home() {
  const handleLogout = async () => {
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
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 24,
        paddingTop: 68,
        paddingBottom: 120,
      }}
    >
      <Text
        style={{
          color: '#0F172A',
          fontSize: 34,
          fontWeight: '800',
        }}
      >
        RoadSOS
      </Text>

      <Text
        style={{
          color: '#64748B',
          fontSize: 16,
          marginTop: 8,
        }}
      >
        Home
      </Text>

      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            color: '#475569',
            fontSize: 18,
            textAlign: 'center',
          }}
        >
          Select Safety to start protection.
        </Text>

        <TouchableOpacity
          onPress={handleLogout}
          style={{
            marginTop: 36,
            backgroundColor: '#111827',
            paddingVertical: 14,
            paddingHorizontal: 30,
            borderRadius: 14,
          }}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: '700',
            }}
          >
            Logout
          </Text>
        </TouchableOpacity>
      </View>

      <Navbar />
    </View>
  );
}
