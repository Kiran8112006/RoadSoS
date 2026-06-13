import { useEffect, useState, useCallback } from 'react';
import { SafeHospitalRoute, SafeRouteParams, SafeRouteResponse } from '../types/safety.types';
import { getSafeRoute } from '../services/safety-routing.service';

interface UseSafetyRouteReturn {
  routes: SafeHospitalRoute[];
  selectedRoute: SafeHospitalRoute | null;
  loading: boolean;
  error: Error | null;
  computeRoute: (params: SafeRouteParams) => Promise<SafeHospitalRoute | null>;
  clearRoute: () => void;
}

/**
 * Hook to compute and manage safe routes to hospitals
 */
export function useSafetyRoute(): UseSafetyRouteReturn {
  const [routes, setRoutes] = useState<SafeHospitalRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<SafeHospitalRoute | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const computeRoute = useCallback(
    async (params: SafeRouteParams): Promise<SafeHospitalRoute | null> => {
      setLoading(true);
      setError(null);

      try {
        const response: SafeRouteResponse = await getSafeRoute(params);
        setRoutes(response.routes);
        setSelectedRoute(response.selectedRoute);
        return response.selectedRoute;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        console.error('Error computing safe route:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearRoute = useCallback(() => {
    setRoutes([]);
    setSelectedRoute(null);
    setError(null);
  }, []);

  return {
    routes,
    selectedRoute,
    loading,
    error,
    computeRoute,
    clearRoute,
  };
}
