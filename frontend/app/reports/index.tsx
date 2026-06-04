import {
  useCallback,
  useEffect,
} from 'react';

import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  router,
} from 'expo-router';

import {
  NearbyReportsList,
  ReportComposer,
  useNearbyReports,
} from '../../src/modules/reports';

import {
  useReportSocket,
} from '../../src/modules/reports/hooks/useReportSocket';

import {
  subscribeToResolvedReports,
} from '../../src/modules/reports/services/ReportsRealtimeService';

export default function ReportsPage() {
  const {
    reports,
    loading,
    upsertReport,
    removeReport,
  } = useNearbyReports();

  const handleRealtimeReport =
    useCallback(upsertReport, [
      upsertReport,
    ]);

  useReportSocket(handleRealtimeReport);

  useEffect(() => {
    const unsubscribe = subscribeToResolvedReports((data) => {
      console.log('Report resolved:', data.id);
      removeReport(data.id);
    });
    return unsubscribe;
  }, [removeReport]);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#0B0F19',
      }}
    >
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingTop: 40,
          paddingBottom: 40,
        }}
      >
        <View
          style={{
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <View>
            <Text
              style={{
                color: '#ffffff',
                fontSize: 30,
                fontWeight: '900',
              }}
            >
              Community Reports
            </Text>

            <Text
              style={{
                color: '#9CA3AF',
                marginTop: 4,
              }}
            >
              Nearby accident alerts and help updates
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              backgroundColor: '#1F2937',
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
            }}
          >
            <Text
              style={{
                color: '#ffffff',
                fontWeight: '700',
              }}
            >
              Back
            </Text>
          </TouchableOpacity>
        </View>

        <ReportComposer
          onReportCreated={upsertReport}
        />

        <Text
          style={{
            color: '#ffffff',
            fontSize: 20,
            fontWeight: '800',
            marginBottom: 12,
          }}
        >
          Nearby alerts
        </Text>

        <NearbyReportsList
          loading={loading}
          reports={reports}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
