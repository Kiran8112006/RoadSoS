import {
  Audio,
} from 'expo-av';

import {
  Vibration,
} from 'react-native';

let alarm: Audio.Sound | null =
  null;

const alarmVibrationPattern = [
  0,
  800,
  300,
  800,
];

export const startAlarm =
async () => {

  try {

    if (alarm) {
      return;
    }

    Vibration.vibrate(
      alarmVibrationPattern,
      true
    );

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    });

    const { sound } =
      await Audio.Sound.createAsync(
        require('../../assets/sounds/alarm.mp3'),
        {
          shouldPlay: true,
          isLooping: true,
          volume: 1,
        }
      );

    alarm =
      sound;

  }

  catch (error) {

    Vibration.cancel();

    console.log(
      'START ALARM ERROR:',
      error
    );

  }

};

export const stopAlarm =
async () => {

  try {

    Vibration.cancel();

    if (!alarm) {
      return;
    }

    await alarm.stopAsync();

    await alarm.unloadAsync();

    alarm =
      null;

  }

  catch (error) {

    console.log(
      'STOP ALARM ERROR:',
      error
    );

  }

};

export const playEmergencyAlarm =
  startAlarm;

export const stopEmergencyAlarm =
  stopAlarm;
