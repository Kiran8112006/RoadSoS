import { AccidentHotspot } from '../types/safety.types';
import { accidentDataService } from './accident-data.service';

/**
 * Calculate risk for a route segment based on accident hotspots and road characteristics
 */
export function calculateRouteRisk(
  routePoints: Array<{ latitude: number; longitude: number }>,
  hotspots: AccidentHotspot[]
): number {
  if (routePoints.length === 0 || hotspots.length === 0) {
    return 0;
  }

  let totalRisk = 0;
  let segmentCount = 0;

  // Calculate risk for each segment of the route
  for (let i = 0; i < routePoints.length - 1; i++) {
    const currentPoint = routePoints[i];
    const nextPoint = routePoints[i + 1];

    // Find closest hotspot to this segment
    let minDistance = Infinity;
    let nearestHotspotRisk = 0;

    hotspots.forEach((hotspot) => {
      const distance = distanceFromPointToSegment(
        hotspot.latitude,
        hotspot.longitude,
        currentPoint.latitude,
        currentPoint.longitude,
        nextPoint.latitude,
        nextPoint.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        // Risk decreases with distance, max 5km consideration
        nearestHotspotRisk = Math.max(0, hotspot.riskScore * (1 - distance / 5));
      }
    });

    totalRisk += nearestHotspotRisk;
    segmentCount++;
  }

  // Average risk across all segments
  return segmentCount > 0 ? Math.min(1, totalRisk / segmentCount) : 0;
}

/**
 * Calculate shortest distance from a point to a line segment
 */
function distanceFromPointToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;

  let param = -1;
  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate combined safety score for a route
 * Lower is better
 * score = distance_km * distanceWeight + risk_score * riskWeight
 */
export function calculateRouteSafetyScore(
  distanceKm: number,
  riskScore: number,
  distanceWeight: number = 0.4,
  riskWeight: number = 0.6
): number {
  // Normalize distance to 0-1 scale (assuming max 50km route)
  const normalizedDistance = Math.min(1, distanceKm / 50);
  
  // Combine scores
  const score = normalizedDistance * distanceWeight + riskScore * riskWeight;
  
  return score;
}

/**
 * Get risk level based on score (0-1)
 */
export function getRiskLevel(riskScore: number): 'low' | 'medium' | 'high' {
  if (riskScore < 0.33) return 'low';
  if (riskScore < 0.67) return 'medium';
  return 'high';
}

/**
 * Assess route using accident data
 */
export async function assessRouteRisk(
  routePoints: Array<{ latitude: number; longitude: number }>
): Promise<{
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  nearbyHotspots: AccidentHotspot[];
}> {
  try {
    await accidentDataService.loadHotspots();
    const hotspots = accidentDataService.getAllHotspots();

    // Get hotspots near the route
    const routeCenter = routePoints[Math.floor(routePoints.length / 2)];
    const nearbyHotspots = accidentDataService.getHotspotsInRadius(
      routeCenter.latitude,
      routeCenter.longitude,
      20
    );

    const riskScore = calculateRouteRisk(routePoints, nearbyHotspots);
    const riskLevel = getRiskLevel(riskScore);

    return {
      riskScore,
      riskLevel,
      nearbyHotspots,
    };
  } catch (error) {
    console.error('Error assessing route risk:', error);
    return {
      riskScore: 0.5, // Default to medium if error
      riskLevel: 'medium',
      nearbyHotspots: [],
    };
  }
}
