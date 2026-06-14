import {
  Audio,
} from 'expo-av';

import {
  Vibration,
} from 'react-native';

let alarmSound: Audio.Sound | null =
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

    if (alarmSound) {
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

    alarmSound =
      sound;

  } catch (error) {

    Vibration.cancel();

    console.log(
      'ALARM PLAY ERROR:',
      error
    );

  }

};

export const stopAlarm =
async () => {

  try {

    Vibration.cancel();

    if (!alarmSound) {
      return;
    }

    await alarmSound.stopAsync();
    await alarmSound.unloadAsync();

    alarmSound =
      null;

  } catch (error) {

    console.log(
      'ALARM STOP ERROR:',
      error
    );

  }

};

export const playEmergencyAlarm =
  startAlarm;

export const stopEmergencyAlarm =
  stopAlarm;
