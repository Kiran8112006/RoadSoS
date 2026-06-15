import {
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';

import * as Location
from 'expo-location';

import notifee
from '@notifee/react-native';

export type NativeCrashEvent = {
  latitude?: number;
  longitude?: number;
  confidence?: number;
  reason?: string;
};

type RoadSosProtectionModule = {
  startProtection: () => Promise<boolean>;
  stopProtection: () => Promise<boolean>;
  markSafeAndResume: () => Promise<boolean>;
};

const nativeProtectionModule =
  NativeModules.RoadSosProtection as
    | RoadSosProtectionModule
    | undefined;

const nativeEventEmitter =
  nativeProtectionModule
    ? new NativeEventEmitter(
      NativeModules.RoadSosProtection
    )
    : null;

export const isNativeProtectionAvailable =
  Platform.OS === 'android' &&
  !!nativeProtectionModule;

const requestProtectionPermissions =
async () => {

  const foreground =
    await Location.requestForegroundPermissionsAsync();

  if (
    foreground.status !== 'granted'
  ) {
    throw new Error(
      'Location permission is required for RoadSoS protection.'
    );
  }

  const background =
    await Location.requestBackgroundPermissionsAsync();

  if (
    background.status !== 'granted'
  ) {
    throw new Error(
      'Background location permission is required for locked-screen protection.'
    );
  }

  await notifee.requestPermission();

};

export const startProtectionManager =
async () => {

  if (
    !isNativeProtectionAvailable ||
    !nativeProtectionModule
  ) {
    return false;
  }

  await requestProtectionPermissions();

  return nativeProtectionModule
    .startProtection();

};

export const stopProtectionManager =
async () => {

  if (
    !isNativeProtectionAvailable ||
    !nativeProtectionModule
  ) {
    return false;
  }

  return nativeProtectionModule
    .stopProtection();

};

export const markSafeAndResumeProtection =
async () => {

  if (
    !isNativeProtectionAvailable ||
    !nativeProtectionModule
  ) {
    return false;
  }

  return nativeProtectionModule
    .markSafeAndResume();

};

export const subscribeToNativeCrashConfirmed =
(
  listener: (
    event: NativeCrashEvent
  ) => void
) => {

  if (
    !nativeEventEmitter
  ) {
    return () => {};
  }

  const subscription =
    nativeEventEmitter.addListener(
      'RoadSosCrashConfirmed',
      listener
    );

  return () => {
    subscription.remove();
  };

};
