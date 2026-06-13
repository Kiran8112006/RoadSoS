import {
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  AccidentReport,
} from '../types/reports.types';

import {
  formatReportDistance,
} from '../utils/reportDistance';

import {
  ReportStatusBadge,
} from './ReportStatusBadge';

type Props = {
  report: AccidentReport;
  onPress?: () => void;
};

export function ReportAlertCard({
  report,
  onPress,
}: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 16,
        marginBottom: 14,
        padding: 16,
      }}
    >
      <ReportStatusBadge
        severity={report.severity}
        status={report.status}
      />

      <Text
        style={{
          color: '#111827',
          fontSize: 18,
          fontWeight: '800',
          marginTop: 12,
        }}
      >
        {report.title}
      </Text>

      <Text
        style={{
          color: '#4B5563',
          fontSize: 14,
          lineHeight: 20,
          marginTop: 6,
        }}
      >
        {report.description}
      </Text>

      <View
        style={{
          marginTop: 12,
        }}
      >
        <Text
          style={{
            color: '#111827',
            fontWeight: '700',
          }}
        >
          {formatReportDistance(report.distanceMeters)}
        </Text>

        <Text
          style={{
            color: '#6B7280',
            marginTop: 3,
          }}
        >
          {report.location.address}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
