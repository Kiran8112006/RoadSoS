import {
  ActivityIndicator,
  View,
} from 'react-native';

import {
  router,
} from 'expo-router';

import {
  useEffect,
} from 'react';

import {
  useAuth,
} from '../src/context/AuthContext';

export default function Index() {

  const {
    user,
    loading,
  } = useAuth();

  useEffect(() => {

    if (loading) return;

    if (user) {

      router.replace('/home');

    } else {

      router.replace('/auth/login');

    }

  }, [user, loading]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0B0F19',
      }}
    >
      <ActivityIndicator
        size="large"
        color="#ffffff"
      />
    </View>
  );
}