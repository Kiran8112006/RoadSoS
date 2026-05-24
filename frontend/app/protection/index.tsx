import {
  View,
  Text,
} from 'react-native';

import {
  useEffect,
  useState,
} from 'react';

import ProtectionButton
from '../../src/components/safety/ProtectionButton';

import VehicleSelector
from '../../src/components/safety/VehicleSelector';

import SensorDebug
from '../../src/components/safety/SensorDebug';

import {
  useRideStore,
} from '../../src/store/ride.store';

import {
  startSensors,
  stopSensors,
} from '../../src/services/sensor.service';

import GpsDebug
from '../../src/components/safety/GpsDebug';

import {
  startLocationTracking,
  stopLocationTracking,
} from '../../src/services/location.service';

import {
  calculateCrashRisk,
} from '../../src/services/crashDetection.service';

import RiskDebug
from '../../src/components/safety/RiskDebug';

import Navbar
from '../../src/components/ui/Navbar';

export default function ProtectionScreen() {

  const {
    isProtectionActive,
  } = useRideStore();

  const [accel, setAccel] =
    useState<any>(null);

  const [gyro, setGyro] =
    useState<any>(null);

  const [location, setLocation] =
    useState<any>(null);

  const [riskScore, setRiskScore] =
    useState(0);

  useEffect(() => {

    startSensors(
      setAccel,
      setGyro
    );
    startLocationTracking(
      setLocation
    );

    return () => {

      stopSensors();
      stopLocationTracking();

    };

  }, []);
  useEffect(() => {

  const speed =
    (
      location?.coords?.speed || 0
    ) * 3.6;

  const risk =
    calculateCrashRisk(

      speed,

      accel,

      gyro

    );

      setRiskScore(
        risk
      );

    }, [

      accel,

      gyro,

      location

    ]);

  return (

    <View
      style={{
        flex: 1,

        padding: 24,

        justifyContent: 'center',

        backgroundColor: 'white',
      }}
    >

      <Text
        style={{
          fontSize: 32,

          fontWeight: 'bold',

          textAlign: 'center',
        }}
      >
        RoadSoS Protection
      </Text>

      <Text
        style={{
          marginTop: 12,

          textAlign: 'center',

          color: 'gray',

          fontSize: 16,
        }}
      >
        {
          isProtectionActive
            ? 'Protection Active'
            : 'Protection Inactive'
        }
      </Text>

      <VehicleSelector />

      <ProtectionButton />

      <SensorDebug
        accel={accel}
        gyro={gyro}
      />

      <GpsDebug
        location={location}
      />

      <RiskDebug
        risk={riskScore}
      />

    </View>

  );
}