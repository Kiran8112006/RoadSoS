import {
  Text,
  View,
} from 'react-native';

import {
  AccidentReportSeverity,
  AccidentReportStatus,
} from '../types/reports.types';

import {
  getReportSeverityColor,
  getReportSeverityLabel,
  getReportStatusLabel,
} from '../utils/reportStatus';

type Props = {
  severity: AccidentReportSeverity;
  status: AccidentReportStatus;
};

export function ReportStatusBadge({
  severity,
  status,
}: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 8,
      }}
    >
      <Text
        style={{
          backgroundColor:
            getReportSeverityColor(severity),
          borderRadius: 999,
          color: '#ffffff',
          fontSize: 12,
          fontWeight: '700',
          paddingHorizontal: 10,
          paddingVertical: 5,
        }}
      >
        {getReportSeverityLabel(severity)}
      </Text>

      <Text
        style={{
          backgroundColor: '#E5E7EB',
          borderRadius: 999,
          color: '#111827',
          fontSize: 12,
          fontWeight: '700',
          paddingHorizontal: 10,
          paddingVertical: 5,
        }}
      >
        {getReportStatusLabel(status)}
      </Text>
    </View>
  );
}
