import { SafeHospitalRoute, SafeRouteParams, SafeRouteResponse } from '../types/safety.types';
import { accidentDataService } from './accident-data.service';
import { calculateRouteRisk, calculateRouteSafetyScore } from './risk-calculator.service';
import { calculateDistance } from '../../services/GoogleMapsService';
import { findNearbyHospitals } from '../../services/PlacesService';

interface CandidateHospital {
  id: string;
  lat: number;
  lng: number;
  name: string;
}

/**
 * Compute safest and shortest route to the nearest hospital
 * Considers both distance and accident risk
 */
export async function getSafeRoute(
  params: SafeRouteParams
): Promise<SafeRouteResponse> {
  try {
    const {
      origin,
      destination,
      radiusKm = 10,
      weightRisk = 0.6,
      weightDistance = 0.4,
    } = params;

    // Load accident data
    await accidentDataService.loadHotspots();

    // Get candidate hospitals
    let hospitals: CandidateHospital[] = [];

    if (destination === 'nearest_hospital') {
      const googleHospitals = await findNearbyHospitals(
        origin.latitude,
        origin.longitude,
        radiusKm * 1000
      );

      hospitals = googleHospitals.map((hospital) => ({
        id: hospital.id,
        lat: hospital.latitude,
        lng: hospital.longitude,
        name: hospital.name,
      }));

      // Sort by distance
      hospitals.sort((a, b) => {
        const distA = calculateDistance(
          origin.latitude,
          origin.longitude,
          a.lat,
          a.lng
        );
        const distB = calculateDistance(
          origin.latitude,
          origin.longitude,
          b.lat,
          b.lng
        );
        return distA - distB;
      });

      // Take top 3-5 candidates
      hospitals = hospitals.slice(0, 5);
    } else if (destination) {
      // Use provided destination as single hospital
      hospitals = [
        {
          id: 'provided_dest',
          lat: destination.latitude,
          lng: destination.longitude,
          name: 'Emergency Hospital',
        },
      ];
    }

    if (hospitals.length === 0) {
      throw new Error('No hospitals found in the area');
    }

    // Compute routes and scores for each hospital
    const routes: SafeHospitalRoute[] = [];
    const hotspots = accidentDataService.getAllHotspots();

    for (const hospital of hospitals) {
      // For now, use mock route (in production, call Google Directions API)
      const mockRoute = generateMockRoute(origin, {
        latitude: hospital.lat,
        longitude: hospital.lng,
      });

      const distanceKm = calculateDistance(
        origin.latitude,
        origin.longitude,
        hospital.lat,
        hospital.lng
      );

      const accidentRisk = calculateRouteRisk(mockRoute, hotspots);
      const safetyScore = calculateRouteSafetyScore(
        distanceKm,
        accidentRisk,
        weightDistance,
        weightRisk
      );

      routes.push({
        hospital: {
          name: hospital.name,
          latitude: hospital.lat,
          longitude: hospital.lng,
          distance: distanceKm,
        },
        route: {
          polyline: mockRoute,
          distance: distanceKm,
          duration: Math.round(distanceKm * 3 * 60), // Assume 20 km/h average
          accumulatedRisk: accidentRisk,
          safetyScore,
        },
        rank: 0,
      });
    }

    // Sort by safety score (lower is better)
    routes.sort((a, b) => a.route.safetyScore - b.route.safetyScore);

    // Assign ranks
    routes.forEach((route, index) => {
      route.rank = index + 1;
    });

    const selectedRoute = routes[0];

    return {
      routes,
      selectedRoute,
      computedAt: new Date(),
    };
  } catch (error) {
    console.error('Error computing safe route:', error);
    throw error;
  }
}

/**
 * Generate mock route (straight line with waypoints)
 * In production, replace with actual Google Directions API call
 */
function generateMockRoute(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
): Array<{ latitude: number; longitude: number }> {
  const points = [];
  const steps = 20; // Number of waypoints

  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    points.push({
      latitude: origin.latitude + (destination.latitude - origin.latitude) * ratio,
      longitude:
        origin.longitude + (destination.longitude - origin.longitude) * ratio,
    });
  }

  return points;
}

/**
 * Compare multiple routes and return ranked list
 */
export async function compareHospitalRoutes(
  params: SafeRouteParams
): Promise<SafeHospitalRoute[]> {
  const response = await getSafeRoute(params);
  return response.routes;
}

/**
 * Get route details with full risk assessment
 */
export async function getDetailedRouteInfo(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
) {
  const response = await getSafeRoute({
    origin,
    destination,
  });

  const selected = response.selectedRoute;

  return {
    hospital: selected.hospital,
    distance: selected.route.distance,
    duration: selected.route.duration,
    riskScore: selected.route.accumulatedRisk,
    safetyScore: selected.route.safetyScore,
    recommendation: selected.route.accumulatedRisk < 0.5 
      ? '✓ Safe route' 
      : '⚠ Be cautious - accident-prone area',
    allRoutes: response.routes,
  };
}
