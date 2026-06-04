import {
  Alert,
  Linking,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';

import MapView, { Marker } from 'react-native-maps';
import { useState, useEffect } from 'react';

import {
  AccidentReport,
} from '../types/reports.types';

import {
  formatReportDistance,
} from '../utils/reportDistance';

import {
  formatTimeAgo,
} from '../utils/timeFormat';

import {
  ReportStatusBadge,
} from './ReportStatusBadge';

import {
  findNearbyHospitals,
  findNearbyPoliceStations,
  Place,
} from '../../maps/services/PlacesService';

import {
  getTravelModes,
  TravelMode,
} from '../../maps/services/PlacesService';

type Props = {
  report: AccidentReport;
  onStatusUpdate: (status: string) => void;
};

export function ReportDetailsHeader({
  report,
  onStatusUpdate,
}: Props) {
  const [nearestHospital, setNearestHospital] = useState<Place | null>(null);
  const [nearestPolice, setNearestPolice] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [travelTime, setTravelTime] = useState<string | null>(null);
  const [loadingTravel, setLoadingTravel] = useState(false);

  useEffect(() => {
    async function fetchNearbyPlaces() {
      try {
        const [hospitals, police] = await Promise.all([
          findNearbyHospitals(report.location.latitude, report.location.longitude, 5000),
          findNearbyPoliceStations(report.location.latitude, report.location.longitude, 5000),
        ]);

        if (hospitals.length > 0) setNearestHospital(hospitals[0]);
        if (police.length > 0) setNearestPolice(police[0]);
      } catch (error) {
        console.error('Error fetching nearby places:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchNearbyPlaces();
  }, [report.location.latitude, report.location.longitude]);

  const loadTravelTime = async (userLat: number, userLng: number) => {
    setLoadingTravel(true);
    try {
      const modes = await getTravelModes(
        userLat,
        userLng,
        report.location.latitude,
        report.location.longitude
      );
      const driving = modes.find((m) => m.mode === 'driving');
      if (driving) {
        setTravelTime(driving.duration);
      }
    } catch (error) {
      console.error('Error getting travel time:', error);
    } finally {
      setLoadingTravel(false);
    }
  };

  const openInMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${report.location.latitude},${report.location.longitude}`;
    Linking.openURL(url);
  };

  const callEmergency = (number: string, name: string) => {
    Alert.alert(
      `Call ${name}?`,
      `Calling ${number}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL(`tel:${number}`) },
      ]
    );
  };

  const handleStatusChange = () => {
    const statusOptions = [
      { label: 'Ambulance Arrived', value: 'ambulanceArrived' },
      { label: 'Victim Rescued', value: 'victimRescued' },
      { label: 'Road Cleared', value: 'roadCleared' },
      { label: 'Resolved', value: 'resolved' },
    ];

    Alert.alert(
      'Update Status',
      'Select the current status',
      [
        ...statusOptions.map((option) => ({
          text: option.label,
          onPress: () => onStatusUpdate(option.value),
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <View
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <ReportStatusBadge
          severity={report.severity}
          status={report.status}
        />
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: '600' }}>
            {formatTimeAgo(report.createdAt)}
          </Text>
          {report.updatedAt && report.updatedAt !== report.createdAt && (
            <Text style={{ color: '#9CA3AF', fontSize: 10, marginTop: 2 }}>
              Updated {formatTimeAgo(report.updatedAt)}
            </Text>
          )}
        </View>
      </View>

      <Text
        style={{
          color: '#111827',
          fontSize: 26,
          fontWeight: '900',
          marginBottom: 8,
        }}
      >
        {report.title}
      </Text>

      <Text
        style={{
          color: '#4B5563',
          fontSize: 16,
          lineHeight: 24,
          marginBottom: 16,
        }}
      >
        {report.description}
      </Text>

      <MapView
        style={{
          width: '100%',
          height: 200,
          borderRadius: 12,
          marginBottom: 12,
        }}
        initialRegion={{
          latitude: report.location.latitude,
          longitude: report.location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker
          coordinate={{
            latitude: report.location.latitude,
            longitude: report.location.longitude,
          }}
          title={report.title}
          description={report.location.address}
          pinColor="red"
        />
      </MapView>

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
        <TouchableOpacity
          onPress={openInMaps}
          style={{
            flex: 1,
            backgroundColor: '#3B82F6',
            borderRadius: 10,
            paddingVertical: 14,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 15 }}>
            Get Directions
          </Text>
        </TouchableOpacity>

        {!['resolved', 'roadCleared'].includes(report.status) && (
          <TouchableOpacity
            onPress={handleStatusChange}
            style={{
              backgroundColor: '#10B981',
              borderRadius: 10,
              paddingVertical: 14,
              paddingHorizontal: 20,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 15 }}>
              Update Status
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View
        style={{
          backgroundColor: '#F9FAFB',
          borderRadius: 10,
          padding: 14,
          marginBottom: 20,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Text
            style={{
              color: '#DC2626',
              fontWeight: '700',
              fontSize: 15,
            }}
          >
            {formatReportDistance(report.distanceMeters)}
          </Text>
          {travelTime && (
            <Text style={{ color: '#6B7280', fontSize: 14, marginLeft: 8 }}>
              • {travelTime} drive
            </Text>
          )}
          {loadingTravel && (
            <ActivityIndicator size="small" color="#6B7280" style={{ marginLeft: 8 }} />
          )}
        </View>
        <Text
          style={{
            color: '#6B7280',
            fontSize: 14,
            lineHeight: 20,
          }}
        >
          {report.location.address}
        </Text>
      </View>

      {report.actionUsers?.canHelp && report.actionUsers.canHelp.length > 0 && (
        <View
          style={{
            backgroundColor: '#ECFDF5',
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            borderLeftWidth: 4,
            borderLeftColor: '#10B981',
          }}
        >
          <Text
            style={{
              color: '#065F46',
              fontWeight: '700',
              fontSize: 16,
              marginBottom: 12,
            }}
          >
            {report.actionUsers.canHelp.length} {report.actionUsers.canHelp.length === 1 ? 'Person' : 'People'} On The Way
          </Text>
          {report.actionUsers.canHelp.slice(0, 5).map((user, idx) => (
            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#10B981',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 14 }}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={{ color: '#047857', fontSize: 15, fontWeight: '600' }}>
                {user.name}
              </Text>
            </View>
          ))}
          {report.actionUsers.canHelp.length > 5 && (
            <Text style={{ color: '#059669', fontSize: 13, marginTop: 8 }}>
              +{report.actionUsers.canHelp.length - 5} more on the way
            </Text>
          )}
        </View>
      )}

      <View
        style={{
          padding: 16,
          backgroundColor: '#FEF2F2',
          borderRadius: 12,
          borderLeftWidth: 4,
          borderLeftColor: '#DC2626',
        }}
      >
        <Text
          style={{
            color: '#991B1B',
            fontWeight: '700',
            marginBottom: 14,
            fontSize: 16,
          }}
        >
          Emergency Contacts Nearby
        </Text>

        {loading ? (
          <ActivityIndicator size="small" color="#DC2626" />
        ) : (
          <View style={{ gap: 12 }}>
            {nearestPolice && nearestPolice.phoneNumber && (
              <TouchableOpacity
                onPress={() => callEmergency(nearestPolice.phoneNumber!, nearestPolice.name)}
                style={{
                  backgroundColor: '#ffffff',
                  padding: 14,
                  borderRadius: 10,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ backgroundColor: '#3B82F6', width: 6, height: 6, borderRadius: 3, marginRight: 8 }} />
                  <Text style={{ color: '#111827', fontWeight: '700', fontSize: 15 }}>
                    {nearestPolice.name}
                  </Text>
                </View>
                <Text style={{ color: '#6B7280', fontSize: 13, marginBottom: 8, lineHeight: 18 }} numberOfLines={2}>
                  {nearestPolice.address}
                </Text>
                <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: 14 }}>
                  {nearestPolice.phoneNumber}
                </Text>
              </TouchableOpacity>
            )}

            {nearestHospital && nearestHospital.phoneNumber && (
              <TouchableOpacity
                onPress={() => callEmergency(nearestHospital.phoneNumber!, nearestHospital.name)}
                style={{
                  backgroundColor: '#ffffff',
                  padding: 14,
                  borderRadius: 10,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ backgroundColor: '#EF4444', width: 6, height: 6, borderRadius: 3, marginRight: 8 }} />
                  <Text style={{ color: '#111827', fontWeight: '700', fontSize: 15 }}>
                    {nearestHospital.name}
                  </Text>
                </View>
                <Text style={{ color: '#6B7280', fontSize: 13, marginBottom: 8, lineHeight: 18 }} numberOfLines={2}>
                  {nearestHospital.address}
                </Text>
                <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: 14 }}>
                  {nearestHospital.phoneNumber}
                </Text>
              </TouchableOpacity>
            )}

            {(!nearestPolice?.phoneNumber && !nearestHospital?.phoneNumber) && (
              <View>
                <Text style={{ color: '#991B1B', fontSize: 13, marginBottom: 12 }}>
                  No emergency contacts with phone numbers found nearby.
                </Text>
                <TouchableOpacity
                  onPress={() => callEmergency('999', 'Emergency Services')}
                  style={{
                    backgroundColor: '#DC2626',
                    padding: 14,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 15 }}>
                    Call 999 (Emergency)
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
