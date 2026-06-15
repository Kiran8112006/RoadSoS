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

import {
  getUserProfile,
} from '../src/services/api/profile.api';

export default function Index() {

  const {
    user,
    loading,
  } = useAuth();

  useEffect(() => {

    if (loading) return;

    if (user) {

      let active = true;

      const routeByProfile =
        async () => {

          try {

            const profile =
              await getUserProfile();

            if (!active) return;

            router.replace(
              profile?.profileCompleted === true
                ? '/home'
                : '/auth/complete-profile'
            );

          } catch (error: any) {

            if (!active) return;

            if (error.response?.status === 404) {

              router.replace(
                '/auth/complete-profile'
              );

              return;

            }

            console.log(
              'PROFILE ROUTE ERROR:',
              error
            );

            router.replace('/auth/login');

          }

        };

      routeByProfile();

      return () => {
        active = false;
      };

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
