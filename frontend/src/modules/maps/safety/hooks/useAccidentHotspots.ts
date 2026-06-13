import { useState, useCallback } from 'react';
import { AccidentHotspot } from '../types/safety.types';
import { accidentDataService } from '../services/accident-data.service';

interface UseAccidentHotspotsReturn {
  hotspots: AccidentHotspot[];
  loading: boolean;
  error: Error | null;
  loadOSMPredictedHotspots: (lat: number, lng: number, radius: number) => Promise<void>;
  getHotspotsInRadius: (lat: number, lng: number, radius: number) => AccidentHotspot[];
  getHotspotsByCity: (city: string) => AccidentHotspot[];
  refreshHotspots: () => Promise<void>;
}

/**
 * Hook to load and manage accident hotspots
 * Loads data on mount and provides methods to query hotspots
 */
export function useAccidentHotspots(): UseAccidentHotspotsReturn {
  const [hotspots, setHotspots] = useState<AccidentHotspot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getHotspotsInRadius = useCallback(
    (lat: number, lng: number, radius: number): AccidentHotspot[] => {
      return accidentDataService.getHotspotsInRadius(lat, lng, radius);
    },
    []
  );

  const getHotspotsByCity = useCallback(
    (city: string): AccidentHotspot[] => {
      return accidentDataService.getHotspotsByCity(city);
    },
    []
  );

  const loadOSMPredictedHotspots = useCallback(
    async (lat: number, lng: number, radius: number): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const data = await accidentDataService.loadOSMPredictedHotspots(lat, lng, radius);
        setHotspots(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const refreshHotspots = useCallback(async () => {
    setLoading(true);
    try {
      const data = await accidentDataService.loadHotspots();
      setHotspots(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    hotspots,
    loading,
    error,
    loadOSMPredictedHotspots,
    getHotspotsInRadius,
    getHotspotsByCity,
    refreshHotspots,
  };
}
