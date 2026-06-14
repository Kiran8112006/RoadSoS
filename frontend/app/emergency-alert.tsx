import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  ScrollView,
} from 'react-native';

import {
  useEffect,
  useState,
} from 'react';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  useLocalSearchParams,
} from 'expo-router';

import {
  downloadMedicalReport,
} from '../src/services/pdf.service';

import {
  startAlarm,
  stopAlarm,
} from '../src/services/alarm.service';

import {
  acknowledgeEmergencyAlert,
} from '../src/services/alert.service';

import {
  calculateDistance,
} from '../src/utils/distance';

import {
  User,
  Phone,
  Droplets,
  TriangleAlert,
  Pill,
  ClipboardList,
  HeartPulse,
  Navigation,
  ShieldPlus,
  PhoneForwarded,
} from 'lucide-react-native';

const actionButton = {
  backgroundColor: '#DC2626',
  borderRadius: 16,
  paddingVertical: 18,
  marginBottom: 14,
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
  shadowColor: '#DC2626',
  shadowOpacity: 0.35,
  shadowRadius: 12,
  elevation: 8,
};

const actionContent = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
};

const actionText = {
  color: '#FFFFFF',
  fontSize: 18,
  fontWeight: '700' as const,
  marginLeft: 10,
};

const getParam =
(value: string | string[] | undefined) => {

  if (Array.isArray(value)) {
    return value[0] || '';
  }

  return value || '';

};

const rawApiUrl =
  process.env.EXPO_PUBLIC_API_URL || '';

const API_BASE_URL =
  rawApiUrl
    .replace(/\/+$/, '')
    .replace(/\/api$/, '');

export default function EmergencyAlert() {

  useEffect(() => {

    startAlarm();

    return () => {

      stopAlarm();

    };

  }, []);

  const params =
    useLocalSearchParams();

  const [
    hospitals,
    setHospitals,
  ] = useState<any[]>([]);

  const alertId =
    getParam(params.alertId);

  const userId =
    getParam(params.userId);

  const victimName =
    getParam(params.victimName);

  const victimPhone =
    getParam(params.victimPhone);

  const bloodGroup =
    getParam(params.bloodGroup);

  const allergies =
    getParam(params.allergies);

  const medicalConditions =
    getParam(params.medicalConditions);

  const medications =
    getParam(params.medications);

  const emergencyNotes =
    getParam(params.emergencyNotes);

  const compatibleDonorsParam =
    getParam(params.compatibleDonors);

  const latitude =
    getParam(params.latitude);

  const longitude =
    getParam(params.longitude);

  const compatibleDonors =
    (() => {

      try {

        const parsed =
          JSON.parse(
            compatibleDonorsParam || '[]'
          );

        return Array.isArray(parsed)
          ? parsed
          : [];

      } catch (error) {

        console.log(
          'COMPATIBLE DONORS PARSE ERROR:',
          error
        );

        return [];

      }

    })();

  const locationLink =
    getParam(params.locationLink);

  const fetchHospitals =
  async () => {

    try {

      if (
        !latitude ||
        !longitude
      ) {
        return;
      }

      console.log(
        'LATITUDE:',
        latitude
      );

      console.log(
        'LONGITUDE:',
        longitude
      );

      console.log(
        `${API_BASE_URL}/api/hospitals/nearby?latitude=${latitude}&longitude=${longitude}`
      );

      const response =
        await fetch(
          `${API_BASE_URL}/api/hospitals/nearby?latitude=${latitude}&longitude=${longitude}`
        );

      const data =
        await response.json();

      if (
        !Array.isArray(data)
      ) {

        console.log(
          'HOSPITAL RESPONSE ERROR:',
          data
        );

        setHospitals([]);

        return;

      }

      const sorted =
        data
          .map(
            (hospital: any) => ({

              ...hospital,

              distance:
                calculateDistance(
                  Number(latitude),
                  Number(longitude),
                  hospital.latitude,
                  hospital.longitude
                ),

            })
          )
          .sort(
            (
              a: any,
              b: any
            ) =>
              Number(a.distance) -
              Number(b.distance)
          )
          .slice(
            0,
            3
          );

      setHospitals(
        sorted
      );

    } catch (error) {

      console.log(
        error
      );

    }

  };

  useEffect(() => {

    fetchHospitals();

  }, [
    latitude,
    longitude,
  ]);

  const handleLocation = () => {

    if (locationLink) {
      Linking.openURL(
        String(locationLink)
      );
    }

  };

  const handleDownloadPdf = () => {

    console.log(
      'DOWNLOAD USER ID:',
      userId
    );

    if (userId) {

      downloadMedicalReport(
        userId
      );

    } else {

      console.log(
        'NO USER ID RECEIVED'
      );

    }

  };

  const handleCall = () => {

    if (victimPhone) {
      Linking.openURL(
        `tel:${victimPhone}`
      );
    }

  };

  const handleDismiss =
  async () => {

    try {

      await acknowledgeEmergencyAlert(
        alertId
      );

    } catch (error) {

      console.log(
        'ALERT ACKNOWLEDGE ERROR:',
        error
      );

    }

    await stopAlarm();

  };

  return (

    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#050B18',
      }}
    >

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 40,
          paddingBottom: 40,
        }}
      >

        <Text
          style={{
            fontSize: 32,
            fontWeight: 'bold',
            color: '#EF4444',
            marginBottom: 20,
          }}
        >
          Emergency Alert
        </Text>

        <View
          style={{
            backgroundColor: '#111827',
            borderRadius: 20,
            padding: 24,
            marginTop: 20,
          }}
        >

          <InfoRow
            Icon={User}
            label="Name"
            value={victimName}
          />

          <InfoRow
            Icon={Droplets}
            label="Blood Group"
            value={bloodGroup}
          />

          <InfoRow
            Icon={Phone}
            label="Phone"
            value={victimPhone}
          />

          <InfoRow
            Icon={TriangleAlert}
            label="Allergies"
            value={allergies}
          />

          <InfoRow
            Icon={HeartPulse}
            label="Medical Conditions"
            value={medicalConditions}
          />

          <InfoRow
            Icon={Pill}
            label="Medications"
            value={medications}
          />

          <InfoRow
            Icon={ClipboardList}
            label="Emergency Notes"
            value={emergencyNotes}
          />

        </View>

        <View
          style={{
            backgroundColor: '#111827',
            borderRadius: 20,
            padding: 24,
            marginTop: 20,
          }}
        >

          <Text
            style={{
              color: '#EF4444',
              fontWeight: 'bold',
              fontSize: 18,
              marginBottom: 14,
            }}
          >
            Compatible Blood Donors
          </Text>

          {compatibleDonors.length > 0 ? (

            compatibleDonors.map(
              (
                donor: any,
                index: number
              ) => (

                <Text
                  key={`${donor.phone || donor.name}-${index}`}
                  style={{
                    color: '#FFFFFF',
                    fontSize: 16,
                    fontWeight: '600',
                    marginBottom: 10,
                  }}
                >
                  ✓ {donor.name || 'Contact'} ({donor.bloodGroup || '-'})
                </Text>

              )
            )

          ) : (

            <Text
              style={{
                color: '#9CA3AF',
                fontSize: 16,
              }}
            >
              No compatible donors found.
            </Text>

          )}

        </View>

        <View
          style={{
            backgroundColor: '#111827',
            borderRadius: 20,
            padding: 24,
            marginTop: 20,
          }}
        >

          <Text
            style={{
              color: '#EF4444',
              fontSize: 18,
              fontWeight: 'bold',
              marginBottom: 16,
            }}
          >
            Nearby Hospitals
          </Text>

          {hospitals.length > 0 &&

            hospitals.map(
              (
                hospital: any,
                index: number
              ) => (

                <View
                  key={`${hospital.name}-${index}`}
                  style={{
                    marginBottom: 20,
                  }}
                >

                  <Text
                    style={{
                      color: 'white',
                      fontSize: 17,
                      fontWeight: '700',
                    }}
                  >
                    {hospital.name}
                  </Text>

                  <Text
                    style={{
                      color: '#9CA3AF',
                      marginTop: 4,
                    }}
                  >
                    {hospital.distance} km away
                  </Text>

                  {compatibleDonors.length > 0 && (

                    <View>

                      <Text
                        style={{
                          color: '#22C55E',
                          fontWeight: '700',
                          marginTop: 8,
                          marginBottom: 6,
                        }}
                      >
                        Compatible Donors Available
                      </Text>

                      {compatibleDonors.map(
                        (
                          donor: any,
                          donorIndex: number
                        ) => (

                          <Text
                            key={`${donor.phone || donor.name}-${donorIndex}`}
                            style={{
                              color: 'white',
                              marginBottom: 4,
                            }}
                          >
                            - {donor.name || 'Contact'} ({donor.bloodGroup || '-'})
                          </Text>

                        )
                      )}

                    </View>

                  )}

                  <View
                    style={{
                      flexDirection: 'row',
                      marginTop: 12,
                    }}
                  >

                    <TouchableOpacity
                      onPress={() =>
                        Linking.openURL(
                          `https://www.google.com/maps/search/?api=1&query=${hospital.latitude},${hospital.longitude}`
                        )
                      }
                      style={{
                        backgroundColor: '#DC2626',
                        padding: 10,
                        borderRadius: 10,
                        marginRight: 10,
                      }}
                    >

                      <Text
                        style={{
                          color: 'white',
                        }}
                      >
                        Navigate
                      </Text>

                    </TouchableOpacity>

                    {hospital.phone && (

                      <TouchableOpacity
                        onPress={() =>
                          Linking.openURL(
                            `tel:${hospital.phone}`
                          )
                        }
                        style={{
                          backgroundColor: '#16A34A',
                          padding: 10,
                          borderRadius: 10,
                        }}
                      >

                        <Text
                          style={{
                            color: 'white',
                          }}
                        >
                          Call
                        </Text>

                      </TouchableOpacity>

                    )}

                  </View>

                </View>

              )
            )

          }

          <TouchableOpacity
            onPress={() =>
              Linking.openURL(
                `https://www.google.com/maps/search/hospitals/@${latitude},${longitude},14z`
              )
            }
            style={{
              backgroundColor: '#DC2626',
              padding: 12,
              borderRadius: 10,
              alignItems: 'center',
              marginTop:
                hospitals.length > 0
                  ? 4
                  : 0,
            }}
          >

            <Text
              style={{
                color: 'white',
                fontWeight: '700',
              }}
            >
              Search Hospitals on Maps
            </Text>

          </TouchableOpacity>

        </View>

        <TouchableOpacity
          onPress={handleLocation}
          style={[
            actionButton,
            {
              marginTop: 30,
            },
          ]}
        >

          <View style={actionContent}>
            <Navigation
              size={24}
              color="#FFFFFF"
              strokeWidth={2.5}
            />

            <Text style={actionText}>
              View Location
            </Text>
          </View>

        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDownloadPdf}
          style={actionButton}
        >

          <View style={actionContent}>
            <ShieldPlus
              size={24}
              color="#FFFFFF"
              strokeWidth={2.5}
            />

            <Text style={actionText}>
              Download Medical Details
            </Text>
          </View>

        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleCall}
          style={actionButton}
        >

          <View style={actionContent}>
            <PhoneForwarded
              size={24}
              color="#FFFFFF"
              strokeWidth={2.5}
            />

            <Text style={actionText}>
              Call
            </Text>
          </View>

        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDismiss}
          style={{
            backgroundColor: '#374151',
            borderRadius: 16,
            paddingVertical: 18,
            marginBottom: 14,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >

          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 18,
              fontWeight: '700',
            }}
          >
            🔕 Dismiss Siren
          </Text>

        </TouchableOpacity>

      </ScrollView>

    </SafeAreaView>

  );

}

function InfoRow({
  Icon,
  label,
  value,
}: any) {

  return (

    <View
      style={{
        marginBottom: 14,
      }}
    >

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 4,
        }}
      >

        <Icon
          size={18}
          color="#EF4444"
        />

        <Text
          style={{
            color: '#9CA3AF',
            marginLeft: 8,
            fontSize: 15,
          }}
        >
          {label}
        </Text>

      </View>

      <Text
        style={{
          color: 'white',
          fontSize: 18,
          fontWeight: '600',
        }}
      >
        {value || '-'}
      </Text>

    </View>

  );

}
