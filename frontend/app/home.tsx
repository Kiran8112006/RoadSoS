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

import { useEffect, useCallback } from 'react';
import { requestNotificationPermissions, showAccidentNotification } from '../src/services/notifications/NotificationService';
import { useLocationBroadcast } from '../hooks/useLocationBroadcast';
import { updateUserLocation } from '../src/modules/reports/services/ReportsRealtimeService';
import { useReportSocket } from '../src/modules/reports/hooks/useReportSocket';
import { AccidentReport } from '../src/modules/reports/types/reports.types';

export default function Home() {
  const handleLogout = async () => {
    await Promise.allSettled([
      signOut(auth),
      nativeAuth().signOut(),
    ]);

    router.replace('/auth/login');
  };

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  const handleLocationUpdate = useCallback((location: { latitude: number; longitude: number }) => {
    updateUserLocation(location);
  }, []);

  useLocationBroadcast(handleLocationUpdate);

  const handleNearbyReport = useCallback((report: AccidentReport) => {
    showAccidentNotification(
      `🚨 ${report.severity.toUpperCase()} Accident Nearby`,
      `${report.title} - ${report.location.address}`,
      { reportId: report.id }
    );
  }, []);

  useReportSocket(handleNearbyReport);

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
