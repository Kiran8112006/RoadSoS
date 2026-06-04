import {
  View,
  Text,
  TouchableOpacity,
  Vibration,
} from 'react-native';

import {
  useState,
  useEffect,
} from 'react';

import {
  router,
} from 'expo-router';

import {
  Audio,
} from 'expo-av';

export default function EmergencyScreen() {

  const [seconds, setSeconds] =
    useState(60);

  const [sound, setSound] =
    useState<Audio.Sound | null>(
      null
    );

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

  /*
    COUNTDOWN
  */

  useEffect(() => {

    if (seconds <= 0) {

      const sendEmergency =
        async () => {

          if (sound) {

            await sound.stopAsync();

            await sound.unloadAsync();

          }

          console.log(
            'EMERGENCY SENT'
          );

        };

      sendEmergency();

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

    sound

  ]);

  /*
    SAFE BUTTON
  */

  const handleSafe =
    async () => {

      Vibration.cancel();

      if (sound) {

        await sound.stopAsync();

        await sound.unloadAsync();

      }

      router.back();

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

    </View>

  );

}