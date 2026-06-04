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

import * as Location from 'expo-location';

import {
  createAccidentReport,
} from '../services/ReportsService';

import {
  AccidentReport,
  AccidentReportSeverity,
} from '../types/reports.types';

type Props = {
  onReportCreated?: (report: AccidentReport) => void;
};

const severityOptions: AccidentReportSeverity[] = [
  'low',
  'medium',
  'high',
  'critical',
];

export function ReportComposer({
  onReportCreated,
}: Props) {
  const [expanded, setExpanded] =
    useState(false);

  const [title, setTitle] =
    useState('');

  const [description, setDescription] =
    useState('');

  const [address, setAddress] =
    useState('');

  const [severity, setSeverity] =
    useState<AccidentReportSeverity>('medium');

  const [submitting, setSubmitting] =
    useState(false);

  async function handleSubmit() {
    if (!title.trim() || !description.trim()) {
      Alert.alert(
        'Missing details',
        'Please add a title and short description.'
      );
      return;
    }

    setSubmitting(true);

    try {
      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        Alert.alert(
          'Location needed',
          'Please allow location access to report where the accident happened.'
        );
        return;
      }

      const currentLocation =
        await Location.getCurrentPositionAsync({});

      const report =
        await createAccidentReport({
          title: title.trim(),
          description: description.trim(),
          severity,
          location: {
            latitude:
              currentLocation.coords.latitude,
            longitude:
              currentLocation.coords.longitude,
            address:
              address.trim() ||
              'Current reported location',
          },
        });

      setTitle('');
      setDescription('');
      setAddress('');
      setSeverity('medium');
      setExpanded(false);

      onReportCreated?.(report);

      Alert.alert(
        'Report sent',
        'Nearby RoadSoS users can now see this alert.'
      );
    } catch (error: any) {
      Alert.alert(
        'Report failed',
        error?.message ||
          'Unable to create accident report.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View
      style={{
        backgroundColor: '#FEE2E2',
        borderRadius: 16,
        marginBottom: 18,
        padding: 16,
      }}
    >
      <Text
        style={{
          color: '#7F1D1D',
          fontSize: 20,
          fontWeight: '800',
        }}
      >
        Saw an accident nearby?
      </Text>

      <Text
        style={{
          color: '#991B1B',
          lineHeight: 20,
          marginTop: 6,
        }}
      >
        Send a community alert so nearby RoadSoS users can respond quickly.
      </Text>

      {!expanded ? (
        <TouchableOpacity
          onPress={() => setExpanded(true)}
          style={{
            alignItems: 'center',
            backgroundColor: '#DC2626',
            borderRadius: 12,
            marginTop: 14,
            paddingVertical: 14,
          }}
        >
          <Text
            style={{
              color: '#ffffff',
              fontSize: 16,
              fontWeight: '800',
            }}
          >
            Report Accident
          </Text>
        </TouchableOpacity>
      ) : (
        <View
          style={{
            gap: 12,
            marginTop: 14,
          }}
        >
          <ReportInput
            placeholder="What happened?"
            value={title}
            onChangeText={setTitle}
          />

          <ReportInput
            multiline
            placeholder="Add important details"
            value={description}
            onChangeText={setDescription}
          />

          <ReportInput
            placeholder="Location note or landmark"
            value={address}
            onChangeText={setAddress}
          />

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            {severityOptions.map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => setSeverity(option)}
                style={{
                  backgroundColor:
                    severity === option
                      ? '#7F1D1D'
                      : '#ffffff',
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Text
                  style={{
                    color:
                      severity === option
                        ? '#ffffff'
                        : '#7F1D1D',
                    fontWeight: '800',
                    textTransform: 'capitalize',
                  }}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            disabled={submitting}
            onPress={handleSubmit}
            style={{
              alignItems: 'center',
              backgroundColor:
                submitting
                  ? '#9CA3AF'
                  : '#DC2626',
              borderRadius: 12,
              paddingVertical: 14,
            }}
          >
            <Text
              style={{
                color: '#ffffff',
                fontSize: 16,
                fontWeight: '800',
              }}
            >
              {submitting
                ? 'Sending...'
                : 'Send Alert'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function ReportInput({
  multiline = false,
  ...props
}: {
  multiline?: boolean;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <TextInput
      {...props}
      multiline={multiline}
      placeholderTextColor="#9CA3AF"
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 12,
        color: '#111827',
        minHeight: multiline ? 92 : undefined,
        padding: 12,
        textAlignVertical:
          multiline
            ? 'top'
            : 'center',
      }}
    />
  );
}
