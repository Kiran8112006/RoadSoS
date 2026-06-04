import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';

type LocationCallback = (location: { latitude: number; longitude: number }) => void;

export function useLocationBroadcast(onLocationUpdate: LocationCallback) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isActive = true;

    async function startTracking() {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted' || !isActive) {
        return;
      }

      const sendLocation = async () => {
        if (!isActive) return;

        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          onLocationUpdate({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        } catch (error) {
          console.error('Location broadcast error:', error);
        }
      };

      await sendLocation();
      intervalRef.current = setInterval(sendLocation, 30000);
    }

    startTracking();

    return () => {
      isActive = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [onLocationUpdate]);
}
