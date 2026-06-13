import BackgroundService from 'react-native-background-actions';
import * as Location from 'expo-location';

const sleep = (time: number) =>
  new Promise(resolve => setTimeout(resolve, time));

const LOCATION_UPDATE_INTERVAL_MS = 60000;

const veryIntensiveTask = async () => {
  while (BackgroundService.isRunning()) {
    console.log('RoadSOS running in background');
    
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      console.log('Current location:', location.coords);
      
      await BackgroundService.updateNotification({
        taskDesc: `Monitoring - Lat: ${location.coords.latitude.toFixed(4)}`,
      });
    } catch (error) {
      console.error('Location error:', error);
    }
    
    await sleep(LOCATION_UPDATE_INTERVAL_MS);
  }
};

const options = {
  taskName: 'RoadSOS',
  taskTitle: 'RoadSOS Protection Active',
  taskDesc: 'Monitoring emergency triggers',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  color: '#ff0000',
  linkingURI: 'roadsos://',
  parameters: {},
  progressBar: {
    max: 100,
    value: 0,
    indeterminate: true,
  },
  foregroundServiceType: ['location' as const],
};

export const startBackgroundService = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.error('Location permission not granted');
      return;
    }
    
    if (BackgroundService.isRunning()) {
      console.log('Background service already running');
      return;
    }
    
    await BackgroundService.start(veryIntensiveTask, options);
    console.log('Background service started');
  } catch (error) {
    console.error('Failed to start background service:', error);
  }
};

export const stopBackgroundService = async () => {
  try {
    if (BackgroundService.isRunning()) {
      await BackgroundService.stop();
      console.log('Background service stopped');
    }
  } catch (error) {
    console.error('Failed to stop background service:', error);
  }
};
