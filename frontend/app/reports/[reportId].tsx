import {
  useCallback,
  useMemo,
} from 'react';

import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import {
  ReportActionBar,
  ReportDetailsHeader,
  ReportReplyBox,
  useNearbyReports,
} from '../../src/modules/reports';

import {
  useReportSocket,
} from '../../src/modules/reports/hooks/useReportSocket';

import {
  updateReportStatus,
} from '../../src/modules/reports/services/ReportsService';

import { formatTimeAgo } from '../../src/modules/reports/utils/timeFormat';

export default function ReportDetailsPage() {
  const {
    reportId,
  } = useLocalSearchParams<{
    reportId: string;
  }>();

  const {
    reports,
    loading,
    upsertReport,
  } = useNearbyReports();

  const report =
    useMemo(
      () =>
        reports.find(
          (item) => item.id === reportId
        ),
      [reportId, reports]
    );

  const handleRealtimeReport =
    useCallback(upsertReport, [
      upsertReport,
    ]);

  useReportSocket(handleRealtimeReport);

  const handleStatusUpdate = async (status: string) => {
    if (!report) return;

    try {
      console.log('Updating status to:', status, 'for report:', report.id);
      const updatedReport = await updateReportStatus(report.id, status);
      console.log('Status updated, new report:', updatedReport);
      
      // If victim rescued or road cleared, show success and go back
      if (['victimRescued', 'roadCleared'].includes(status)) {
        Alert.alert(
          '✅ Incident Resolved',
          'This accident has been marked as resolved. Thank you for helping!',
          [
            {
              text: 'OK',
              onPress: () => {
                router.back();
              },
            },
          ]
        );
      } else {
        upsertReport(updatedReport);
        Alert.alert('Status Updated', 'Report status has been updated successfully.');
      }
    } catch (error: any) {
      console.error('Status update error:', error);
      Alert.alert('Error', error?.response?.data?.message || error?.message || 'Failed to update status. Please try again.');
    }
  };

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
          paddingBottom: 40,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            alignSelf: 'flex-start',
            backgroundColor: '#1F2937',
            borderRadius: 12,
            marginBottom: 16,
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
            ← Back
          </Text>
        </TouchableOpacity>

        {loading ? (
          <Text
            style={{
              color: '#ffffff',
            }}
          >
            Loading report...
          </Text>
        ) : report ? (
          <>
            <ReportDetailsHeader report={report} onStatusUpdate={handleStatusUpdate} />
            <ReportActionBar
              report={report}
              onReportUpdated={upsertReport}
            />

            <ReportReplyBox
              reportId={report.id}
              onReportUpdated={upsertReport}
            />

            <View
              style={{
                marginTop: 24,
              }}
            >
              <Text
                style={{
                  color: '#ffffff',
                  fontSize: 20,
                  fontWeight: '800',
                  marginBottom: 14,
                }}
              >
                💬 Community Updates
              </Text>

              {report.replies.length === 0 ? (
                <View
                  style={{
                    backgroundColor: '#111827',
                    borderRadius: 12,
                    padding: 20,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: '#9CA3AF',
                      fontSize: 14,
                    }}
                  >
                    No updates yet. Be the first to comment!
                  </Text>
                </View>
              ) : (
                report.replies.map((reply) => (
                  <View
                    key={reply.id}
                    style={{
                      backgroundColor: '#111827',
                      borderRadius: 14,
                      marginBottom: 12,
                      padding: 16,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 3,
                      elevation: 2,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: '#3B82F6',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 10,
                          }}
                        >
                          <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 14 }}>
                            {reply.authorName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text
                          style={{
                            color: '#ffffff',
                            fontWeight: '800',
                            fontSize: 15,
                          }}
                        >
                          {reply.authorName}
                        </Text>
                      </View>
                      <Text style={{ color: '#9CA3AF', fontSize: 11 }}>
                        {formatTimeAgo(reply.createdAt)}
                      </Text>
                    </View>

                    <Text
                      style={{
                        color: '#D1D5DB',
                        lineHeight: 22,
                        fontSize: 14,
                      }}
                    >
                      {reply.message}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </>
        ) : (
          <Text
            style={{
              color: '#ffffff',
            }}
          >
            Report not found.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
