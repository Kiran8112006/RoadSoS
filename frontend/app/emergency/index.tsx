import {
  View,
  Text,
  TouchableOpacity,
  Vibration,
} from 'react-native';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import {
  Audio,
} from 'expo-av';

import {
  triggerEmergency,
} from '@/src/services/emergency.service';

import {
  auth,
} from '@/src/services/firebase/firebase.config';

import {
  getCurrentAccurateLocation,
} from '@/src/services/location.service';

import {
  showAlertSentNotification,
} from '@/src/services/localNotification.service';

import {
  markSafeAndResumeProtection,
  stopProtectionManager,
} from '@/src/services/protectionManager.service';

import {
  clearSuspiciousEvent,
} from '@/src/services/eventMemory.service';

import {
  useRideStore,
} from '@/src/store/ride.store';

export default function EmergencyScreen() {

  const [seconds, setSeconds] =
    useState(60);

  const [sound, setSound] =
    useState<Audio.Sound | null>(
      null
    );

  const params =
    useLocalSearchParams();

  const hasSentEmergency =
    useRef(false);

  const {
    setProtectionActive,
  } = useRideStore();

  /*
    LOAD ALARM
  */

  useEffect(() => {

    let loadedSound:
      Audio.Sound;

    const loadAlarm =
      async () => {

        const result =
          await Audio.Sound.createAsync(

            require(
              '../../assets/sounds/alarm.mp3'
            ),

            {
              shouldPlay: true,

              isLooping: true,

              volume: 1.0,
            }

          );

        loadedSound =
          result.sound;

        setSound(
          result.sound
        );

      };

    loadAlarm();

    return () => {

      loadedSound?.unloadAsync();

    };

  }, []);

  const stopScreenAlarm =
  useCallback(async () => {

    Vibration.cancel();

    try {

      if (sound) {

        await sound.stopAsync();

        await sound.unloadAsync();

      }

    }

    catch {

      console.log(
        'Sound already unloaded'
      );

    }

  }, [
    sound
  ]);

  const getParamNumber =
  (value: string | string[] | undefined) => {

    const rawValue =
      Array.isArray(value)
        ? value[0]
        : value;

    if (
      rawValue == null
    ) {
      return null;
    }

    const parsed =
      Number(rawValue);

    return Number.isFinite(parsed)
      ? parsed
      : null;

  };

  const sendEmergencyNow =
  useCallback(async () => {

    if (
      hasSentEmergency.current
    ) {
      return;
    }

    hasSentEmergency.current =
      true;

    await stopScreenAlarm();

    const paramLatitude =
      getParamNumber(
        params.latitude
      );

    const paramLongitude =
      getParamNumber(
        params.longitude
      );

    const emergencyLocation =
      paramLatitude != null &&
      paramLongitude != null
        ? {
          coords: {
            latitude:
              paramLatitude,
            longitude:
              paramLongitude,
          },
        }
        : await getCurrentAccurateLocation();

    if (
      !emergencyLocation?.coords?.latitude ||
      !emergencyLocation?.coords?.longitude
    ) {

      console.log(
        'EMERGENCY LOCATION NOT AVAILABLE'
      );

      hasSentEmergency.current =
        false;

      return;

    }

    const response =
      await triggerEmergency(

        emergencyLocation.coords.latitude,

        emergencyLocation.coords.longitude,

        auth.currentUser?.uid || ''

      );

    if (
      response?.success
    ) {

      await showAlertSentNotification();

    }

    await stopProtectionManager();

    clearSuspiciousEvent();

    setProtectionActive(
      false
    );

    router.replace(
      '/protection' as any
    );

  }, [
    params.latitude,
    params.longitude,
    setProtectionActive,
    stopScreenAlarm,
  ]);

  /*
    COUNTDOWN
  */

  useEffect(() => {

    if (seconds <= 0) {

      sendEmergencyNow();

      return;

    }

    Vibration.vibrate(
      [500, 500],
      false
    );

    const interval =
      setInterval(() => {

        setSeconds(
          prev => prev - 1
        );

      }, 1000);

    return () =>
      clearInterval(
        interval
      );

  }, [

    seconds,

    sendEmergencyNow

  ]);

  /*
    SAFE BUTTON
  */

  const handleSafe =
    async () => {

      await stopScreenAlarm();

      await markSafeAndResumeProtection();

      clearSuspiciousEvent();

      setProtectionActive(
        true
      );

      router.replace(
        '/protection' as any
      );

    };

  const handleStopProtection =
    async () => {

      await stopScreenAlarm();

      await stopProtectionManager();

      clearSuspiciousEvent();

      setProtectionActive(
        false
      );

      router.replace(
        '/protection' as any
      );

    };

  return (

    <View
      style={{
        flex: 1,

        justifyContent:
          'center',

        alignItems:
          'center',

        backgroundColor:
          '#ff4444',
      }}
    >

      <Text
        style={{
          color: 'white',

          fontSize: 36,

          fontWeight:
            'bold',
        }}
      >
        CRASH DETECTED
      </Text>

      <Text
        style={{
          color: 'white',

          fontSize: 72,

          fontWeight:
            'bold',

          marginTop: 20,
        }}
      >
        {seconds}
      </Text>

      <TouchableOpacity
        onPress={
          handleSafe
        }
        style={{
          marginTop: 40,

          backgroundColor:
            'white',

          padding: 20,

          borderRadius:
            20,
        }}
      >

        <Text
          style={{
            fontWeight:
              'bold',

            fontSize: 18,
          }}
        >
          I AM SAFE
        </Text>

      </TouchableOpacity>

      <TouchableOpacity
        onPress={
          sendEmergencyNow
        }
        style={{
          marginTop: 16,

          backgroundColor:
            '#111111',

          padding: 20,

          borderRadius:
            20,
        }}
      >

        <Text
          style={{
            color:
              'white',

            fontWeight:
              'bold',

            fontSize: 18,
          }}
        >
          GET HELP
        </Text>

      </TouchableOpacity>

      <TouchableOpacity
        onPress={
          handleStopProtection
        }
        style={{
          marginTop: 16,

          borderColor:
            'white',

          borderWidth: 2,

          padding: 18,

          borderRadius:
            20,
        }}
      >

        <Text
          style={{
            color:
              'white',

            fontWeight:
              'bold',

            fontSize: 18,
          }}
        >
          STOP PROTECTION
        </Text>

      </TouchableOpacity>

    </View>

  );

}
