import {
  Text,
  ScrollView,
  TouchableOpacity,
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

import GpsDebug
from '../../src/components/safety/GpsDebug';

import RiskDebug
from '../../src/components/safety/RiskDebug';

import DecelerationDebug
from '../../src/components/safety/DecelerationDebug';

import EventDebug
from '../../src/components/safety/EventDebug';

import InactivityDebug
from '../../src/components/safety/InactivityDebug';

import CrashConfirmedDebug
from '../../src/components/safety/CrashConfirmedDebug';

import Navbar
from '../../src/components/ui/Navbar';

import {
  useRideStore,
} from '../../src/store/ride.store';

import {
  startSensors,
  stopSensors,
} from '../../src/services/sensor.service';

import {
  startLocationTracking,
  stopLocationTracking,
} from '../../src/services/location.service';

import {
  calculateCrashRisk,
} from '../../src/services/crashDetection.service';

import {
  calculateDeceleration,
} from '../../src/services/deceleration.service';

import {
  detectInactivity,
} from '@/src/services/inactivity.service';

import {
  confirmCrash,
} from '@/src/services/crashConfirmation.service';

import {

  createSuspiciousEvent,

  getSuspiciousEvent,

} from '../../src/services/eventMemory.service';

import {
  router,
} from 'expo-router';

export default function ProtectionScreen() {

  const {
    isProtectionActive,
  } = useRideStore();

  /*
    SENSOR STATES
  */

  const [accel, setAccel] =
    useState<any>(null);

  const [gyro, setGyro] =
    useState<any>(null);

  const [location, setLocation] =
    useState<any>(null);

  /*
    DETECTION STATES
  */

  const [riskScore,
  setRiskScore] =
    useState(0);

  const [deceleration,
  setDeceleration] =
    useState(0);

  const [event,
  setEvent] =
    useState<any>(null);

  const [isInactive,
  setIsInactive] =
    useState(false);

  const [isCrashConfirmed,
  setIsCrashConfirmed] =
    useState(false);

  /*
    START SERVICES
  */

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

  /*
    MAIN DETECTION ENGINE
  */

  useEffect(() => {

    const speed =
      (
        location?.coords?.speed || 0
      ) * 3.6;

    /*
      CRASH RISK
    */

    const risk =
      calculateCrashRisk(

        speed,

        accel,

        gyro

      );

    const decel =
      calculateDeceleration(
        speed
      );

    setRiskScore(
      risk
    );

    setDeceleration(
      decel
    );

    /*
      CREATE EVENT
    */

    if (risk > 20) {

      createSuspiciousEvent({

        risk,

        decel,

        speed,

      });

    }

    const currentEvent =
      getSuspiciousEvent();

    setEvent(
      currentEvent
    );

    /*
      INACTIVITY
    */

    const inactive =
      detectInactivity(

        accel,

        gyro,

        speed

      );

    setIsInactive(
      inactive
    );

    /*
      CRASH CONFIRMATION
    */

    const crash =
      confirmCrash(

        risk,

        decel,

        !!currentEvent,

        inactive

      );

    setIsCrashConfirmed(
      crash
    );

    console.log({

      risk,

      decel,

      event: !!currentEvent,

      inactive,

      crash,

    });

  }, [

    accel,

    gyro,

    location

  ]);

  useEffect(() => {

  if (isCrashConfirmed) {

    router.push('/emergency' as any);

  }

}, [

  isCrashConfirmed

]);

  return (

    <ScrollView
      contentContainerStyle={{
        padding: 24,

        paddingBottom: 140,

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

      <TouchableOpacity
        onPress={() => {

          createSuspiciousEvent({
            risk: 100,
            decel: 100,
            speed: 80,
          });

          setEvent(
            getSuspiciousEvent()
          );

          setIsInactive(true);

        }}
        style={{
          backgroundColor: 'red',
          padding: 15,
          borderRadius: 10,
          marginTop: 20,
        }}
      >

        <Text
          style={{
            color: 'white',
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          TEST CRASH
        </Text>

      </TouchableOpacity>

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

      <DecelerationDebug
        deceleration={
          deceleration
        }
      />

      <EventDebug
        event={event}
      />

      <InactivityDebug
        inactive={
          isInactive
        }
      />

      <CrashConfirmedDebug
        confirmed={
          isCrashConfirmed
        }
      />

      <Navbar />

    </ScrollView>

  );

}
