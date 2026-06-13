import {
  Alert,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';

import { useRef, useEffect, useState } from 'react';

import {
  AccidentReport,
  AccidentReportAction,
} from '../types/reports.types';

import {
  useReportActions,
} from '../hooks/useReportActions';

type Props = {
  report: AccidentReport;
  onReportUpdated?: (report: AccidentReport) => void;
};

const actions: {
  label: string;
  value: AccidentReportAction;
  color: string;
}[] = [
  {
    label: 'I can help',
    value: 'canHelp',
    color: '#10B981',
  },
  {
    label: 'Ambulance called',
    value: 'ambulanceCalled',
    color: '#EF4444',
  },
  {
    label: 'Police informed',
    value: 'policeInformed',
    color: '#3B82F6',
  },
  {
    label: 'False report',
    value: 'falseReport',
    color: '#F59E0B',
  },
];

function ActionButton({
  action,
  count,
  users,
  disabled,
  onPress,
}: {
  action: typeof actions[0];
  count: number;
  users?: Array<{ name: string; timestamp: string }>;
  disabled: boolean;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [showUsers, setShowUsers] = useState(false);

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    animatePress();
    onPress();
  };

  const handleLongPress = () => {
    if (users && users.length > 0) {
      setShowUsers(!showUsers);
    }
  };

  const isDuplicate = action.value === 'ambulanceCalled' && count > 0;

  return (
    <View>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          disabled={disabled || isDuplicate}
          onPress={handlePress}
          onLongPress={handleLongPress}
          style={{
            backgroundColor: isDuplicate ? '#9CA3AF' : '#ffffff',
            borderRadius: 12,
            paddingVertical: 16,
            paddingHorizontal: 18,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 2,
            borderLeftWidth: 4,
            borderLeftColor: count > 0 ? action.color : '#E5E7EB',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: action.color,
                marginRight: 14,
              }}
            />
            <Text
              style={{
                color: isDuplicate ? '#ffffff' : '#111827',
                fontWeight: '700',
                fontSize: 16,
                flex: 1,
              }}
            >
              {action.label}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: count > 0 ? action.color : '#F3F4F6',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
              minWidth: 36,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: count > 0 ? '#ffffff' : '#6B7280', fontWeight: '700', fontSize: 15 }}>
              {count}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {showUsers && users && users.length > 0 && (
        <View
          style={{
            backgroundColor: '#F9FAFB',
            borderRadius: 10,
            padding: 14,
            marginTop: 8,
          }}
        >
          <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '700', marginBottom: 10 }}>
            Who took this action:
          </Text>
          {users.slice(0, 3).map((user, idx) => (
            <Text key={idx} style={{ color: '#374151', fontSize: 14, marginBottom: 6, paddingLeft: 4 }}>
              • {user.name}
            </Text>
          ))}
          {users.length > 3 && (
            <Text style={{ color: '#9CA3AF', fontSize: 13, marginTop: 4, paddingLeft: 4 }}>
              +{users.length - 3} more
            </Text>
          )}
        </View>
      )}

      {isDuplicate && (
        <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 6, marginLeft: 4 }}>
          Ambulance already called - No need to call again
        </Text>
      )}
    </View>
  );
}

export function ReportActionBar({
  report,
  onReportUpdated,
}: Props) {
  const {
    submittingAction,
    takeAction,
  } = useReportActions();

  async function handleAction(
    action: AccidentReportAction
  ) {
    try {
      console.log('Taking action:', action, 'for report:', report.id);
      const updatedReport =
        await takeAction(report.id, action);

      console.log('Updated report received:', updatedReport);
      onReportUpdated?.(updatedReport);

      const actionLabels: Record<AccidentReportAction, string> = {
        canHelp: "You're on the way to help!",
        ambulanceCalled: 'Ambulance has been notified',
        policeInformed: 'Police have been informed',
        falseReport: 'Report flagged as false',
      };

      Alert.alert(
        'Action Recorded',
        actionLabels[action]
      );
    } catch (error: any) {
      console.error('Action error:', error);
      Alert.alert('Error', error?.message || 'Failed to record action. Please try again.');
    }
  }

  return (
    <View
      style={{
        gap: 16,
        marginTop: 24,
      }}
    >
      <Text
        style={{
          color: '#ffffff',
          fontSize: 20,
          fontWeight: '700',
          marginBottom: 8,
        }}
      >
        How can you help?
      </Text>

      {actions.map((action) => (
        <ActionButton
          key={action.value}
          action={action}
          count={report.actions[action.value] || 0}
          users={report.actionUsers?.[action.value]}
          disabled={submittingAction !== null}
          onPress={() => handleAction(action.value)}
        />
      ))}

      <Text style={{ color: '#9CA3AF', fontSize: 13, marginTop: 8 }}>
        Long press to see who helped
      </Text>
    </View>
  );
}
