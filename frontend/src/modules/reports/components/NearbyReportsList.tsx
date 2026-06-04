import {
  ActivityIndicator,
  Text,
  View,
} from 'react-native';

import {
  router,
} from 'expo-router';

import {
  AccidentReport,
} from '../types/reports.types';

import {
  ReportAlertCard,
} from './ReportAlertCard';

type Props = {
  reports: AccidentReport[];
  loading: boolean;
};

export function NearbyReportsList({
  reports,
  loading,
}: Props) {

  if (loading) {
    return (
      <ActivityIndicator
        color="#ffffff"
        size="large"
      />
    );
  }

  if (reports.length === 0) {
    return (
      <View
        style={{
          backgroundColor: '#111827',
          borderRadius: 16,
          padding: 18,
        }}
      >
        <Text
          style={{
            color: '#ffffff',
            fontSize: 16,
            fontWeight: '700',
          }}
        >
          No nearby accident reports
        </Text>

        <Text
          style={{
            color: '#9CA3AF',
            marginTop: 6,
          }}
        >
          New community alerts will appear here.
        </Text>
      </View>
    );
  }

  return (
    <View>
      {reports.map((report) => (
        <ReportAlertCard
          key={report.id}
          report={report}
          onPress={() =>
            router.push(`/reports/${report.id}` as any)
          }
        />
      ))}
    </View>
  );
}
