import {
  useState,
} from 'react';

import {
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  addReportReply,
} from '../services/ReportsService';

import {
  AccidentReport,
} from '../types/reports.types';

type Props = {
  reportId: string;
  onReportUpdated?: (report: AccidentReport) => void;
};

export function ReportReplyBox({
  reportId,
  onReportUpdated,
}: Props) {
  const [message, setMessage] =
    useState('');

  const [submitting, setSubmitting] =
    useState(false);

  async function handleSubmit() {
    if (!message.trim()) {
      Alert.alert(
        'Missing update',
        'Please type a short update first.'
      );
      return;
    }

    setSubmitting(true);

    try {
      const report =
        await addReportReply(
          reportId,
          message.trim()
        );

      setMessage('');
      onReportUpdated?.(report);
    } catch (error: any) {
      Alert.alert(
        'Update failed',
        error?.message ||
          'Unable to add update.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View
      style={{
        gap: 10,
        marginTop: 18,
      }}
    >
      <TextInput
        multiline
        onChangeText={setMessage}
        placeholder="Add an update or reply"
        placeholderTextColor="#9CA3AF"
        value={message}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 14,
          color: '#111827',
          minHeight: 92,
          padding: 14,
          textAlignVertical: 'top',
        }}
      />

      <TouchableOpacity
        disabled={submitting}
        onPress={handleSubmit}
        style={{
          alignItems: 'center',
          backgroundColor:
            submitting
              ? '#6B7280'
              : '#2563EB',
          borderRadius: 12,
          paddingVertical: 12,
        }}
      >
        <Text
          style={{
            color: '#ffffff',
            fontWeight: '800',
          }}
        >
          {submitting
            ? 'Posting...'
            : 'Post Update'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
