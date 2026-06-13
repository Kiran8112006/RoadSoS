import { AccidentHotspot, OSMHospital, OSMRoadData } from '../types/safety.types';

const OVERPASS_API_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

async function queryOverpass(query: string) {
  for (const apiUrl of OVERPASS_API_URLS) {
    try {
      const response = await fetch(`${apiUrl}?data=${encodeURIComponent(query.trim())}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'RoadSoS student project',
        },
      });

      if (!response.ok) {
        const message = await response.text();
        console.error('OSM API error:', response.status, response.statusText, message);
        continue;
      }

      return response.json();
    } catch (error) {
      console.error('OSM API request failed:', error);
    }
  }

  return null;
}

/**
 * Query Overpass API (free OSM data) for hospitals/healthcare facilities
 */
export async function getHospitalsFromOSM(
  latitude: number,
  longitude: number,
  radiusKm: number = 10
): Promise<OSMHospital[]> {
  try {
    // Convert radius to degrees (1 degree ≈ 111 km)
    const radiusDegrees = radiusKm / 111;
    
    // Bbox format: [bbox:south,west,north,east]
    const south = latitude - radiusDegrees;
    const west = longitude - radiusDegrees;
    const north = latitude + radiusDegrees;
    const east = longitude + radiusDegrees;
    
    // Overpass QL query to find hospitals and clinics
    // [out:json] specifies JSON output format
    const query = `
      [out:json][timeout:20][bbox:${south},${west},${north},${east}];
      (
        node[amenity=hospital];
        node[amenity=clinic];
        node[healthcare=hospital];
        node[healthcare=clinic];
      );
      out center;
    `;

    console.log('Querying Overpass API for hospitals...');
    const data = await queryOverpass(query);
    if (!data) return [];
    const hospitals: OSMHospital[] = [];

    if (data.elements && Array.isArray(data.elements)) {
      data.elements.forEach((element: any) => {
        // Get coordinates from center (for ways) or directly (for nodes)
        const lat = element.center?.lat || element.lat;
        const lon = element.center?.lon || element.lon;

        if (lat && lon && element.tags) {
          const type = element.tags.amenity === 'hospital' || element.tags.healthcare === 'hospital' 
            ? 'hospital' 
            : 'clinic';

          hospitals.push({
            id: `osm_${element.id}`,
            lat,
            lng: lon,
            name: element.tags.name || `${type} (OSM)`,
            type: type as 'hospital' | 'clinic' | 'health_center',
          });
        }
      });
    }

    console.log(`Found ${hospitals.length} hospitals from OSM`);
    return hospitals.slice(0, 20); // Return top 20 closest
  } catch (error) {
    console.error('Error fetching hospitals from OSM:', error);
    return [];
  }
}

/**
 * Query Overpass API for road metadata in a bounding box
 * Returns road segments with highway type, speed limits, etc.
 */
export async function getRoadDataFromOSM(
  minLat: number,
  minLng: number,
  maxLat: number,
  maxLng: number
): Promise<OSMRoadData[]> {
  try {
    // Overpass QL query for main roads
    const query = `
      [out:json][timeout:25][bbox:${minLat},${minLng},${maxLat},${maxLng}];
      (
        way["highway"~"primary|secondary|tertiary|residential|motorway|trunk"];
      );
      out geom;
    `;

    const data = await queryOverpass(query);
    if (!data) return [];
    const roads: OSMRoadData[] = [];

    if (data.elements) {
      data.elements.forEach((element: any) => {
        if (element.geometry && element.geometry.length > 0) {
          const firstPoint = element.geometry[0];
          roads.push({
            id: `osm_road_${element.id}`,
            lat: firstPoint.lat,
            lng: firstPoint.lon,
            highway: element.tags?.highway || 'unknown',
            maxSpeed: parseInt(element.tags?.maxspeed) || undefined,
            lanes: parseInt(element.tags?.lanes) || undefined,
            surface: element.tags?.surface || 'asphalt',
            name: element.tags?.name || 'Unnamed Road',
          });
        }
      });
    }

    return roads.slice(0, 100); // Return top 100
  } catch (error) {
    console.error('Error fetching road data from OSM:', error);
    return [];
  }
}

interface OSMRiskCandidate {
  latitude: number;
  longitude: number;
  riskScore: number;
  description: string;
  count: number;
}

const HIGHWAY_RISK: Record<string, number> = {
  motorway: 0.85,
  trunk: 0.8,
  primary: 0.72,
  secondary: 0.62,
  tertiary: 0.52,
  unclassified: 0.42,
  residential: 0.32,
  service: 0.24,
};

/**
 * Predict accident-prone areas from OSM road attributes around a location.
 * This is not crash-history data. It derives risk from road class, junction
 * density, traffic signals/crossings, speed, lanes, surface, bridges, and tunnels.
 */
export async function getPredictedAccidentHotspotsFromOSM(
  latitude: number,
  longitude: number,
  radiusKm: number = 8
): Promise<AccidentHotspot[]> {
  try {
    const radiusMeters = Math.round(radiusKm * 1000);
    const query = `
      [out:json][timeout:25];
      (
        way(around:${radiusMeters},${latitude},${longitude})["highway"~"motorway|trunk|primary|secondary|tertiary|unclassified|residential|service"];
        node(around:${radiusMeters},${latitude},${longitude})["highway"="traffic_signals"];
        node(around:${radiusMeters},${latitude},${longitude})["highway"="crossing"];
        node(around:${radiusMeters},${latitude},${longitude})["junction"];
      );
      out geom;
    `;

    console.log('Querying OSM for accident risk prediction...');
    const data = await queryOverpass(query);
    if (!data?.elements || !Array.isArray(data.elements)) return [];

    const candidates = new Map<string, OSMRiskCandidate>();

    const addCandidate = (
      lat: number,
      lng: number,
      riskScore: number,
      description: string
    ) => {
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
      const existing = candidates.get(key);
      if (existing) {
        existing.riskScore = Math.min(1, Math.max(existing.riskScore, riskScore) + 0.06);
        existing.count += 1;
        if (!existing.description.includes(description)) {
          existing.description = `${existing.description}; ${description}`;
        }
        return;
      }

      candidates.set(key, {
        latitude: lat,
        longitude: lng,
        riskScore: Math.min(1, riskScore),
        description,
        count: 1,
      });
    };

    data.elements.forEach((element: any) => {
      const tags = element.tags || {};

      if (element.type === 'way' && Array.isArray(element.geometry) && element.geometry.length > 0) {
        const highway = tags.highway || 'road';
        const highwayRisk = HIGHWAY_RISK[highway] ?? 0.35;
        const maxSpeed = parseInt(String(tags.maxspeed || ''), 10);
        const lanes = parseInt(String(tags.lanes || ''), 10);
        const isUnpaved = tags.surface && !['asphalt', 'concrete', 'paved'].includes(tags.surface);
        const isComplexJunction = Boolean(tags.junction);

        let riskScore = highwayRisk;
        const factors = [highway];

        if (Number.isFinite(maxSpeed) && maxSpeed >= 60) {
          riskScore += 0.1;
          factors.push(`${maxSpeed} km/h`);
        }

        if (Number.isFinite(lanes) && lanes >= 4) {
          riskScore += 0.08;
          factors.push(`${lanes} lanes`);
        }

        if (isUnpaved) {
          riskScore += 0.08;
          factors.push(`${tags.surface} surface`);
        }

        if (isComplexJunction) {
          riskScore += 0.1;
          factors.push(`${tags.junction} junction`);
        }

        if (tags.bridge || tags.tunnel) {
          riskScore += 0.05;
          factors.push(tags.bridge ? 'bridge' : 'tunnel');
        }

        const geometry = element.geometry;
        const sampleIndexes = [
          0,
          Math.floor(geometry.length / 2),
          geometry.length - 1,
        ];

        sampleIndexes.forEach((index) => {
          const point = geometry[index];
          if (point) {
            addCandidate(
              point.lat,
              point.lon,
              riskScore,
              `OSM risk prediction: ${factors.join(', ')}`
            );
          }
        });
      }

      if (element.type === 'node') {
        const lat = element.lat;
        const lng = element.lon;

        if (tags.highway === 'traffic_signals') {
          addCandidate(lat, lng, 0.58, 'OSM risk prediction: signalized intersection');
        } else if (tags.highway === 'crossing') {
          addCandidate(lat, lng, 0.54, 'OSM risk prediction: pedestrian crossing');
        } else if (tags.junction) {
          addCandidate(lat, lng, 0.62, `OSM risk prediction: ${tags.junction} junction`);
        }
      }
    });

    return Array.from(candidates.values())
      .filter((candidate) => candidate.riskScore >= 0.45)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 40)
      .map((candidate) => ({
        latitude: candidate.latitude,
        longitude: candidate.longitude,
        riskScore: Math.min(1, candidate.riskScore),
        severity:
          candidate.riskScore >= 0.75
            ? 'high'
            : candidate.riskScore >= 0.6
              ? 'medium'
              : 'low',
        count: candidate.count,
        description: candidate.description,
        source: 'osm_prediction',
      }));
  } catch (error) {
    console.error('Error predicting accident hotspots from OSM:', error);
    return [];
  }
}

/**
 * Get road characteristics for risk assessment
 * Returns whether a road is likely high-risk based on OSM attributes
 */
export function assessRoadCharacteristics(road: OSMRoadData): {
  isHighwayType: boolean;
  isUnpaved: boolean;
  hasSpeedRestriction: boolean;
} {
  const highRiskHighways = ['motorway', 'trunk', 'primary'];
  const isHighwayType = highRiskHighways.includes(road.highway);
  const isUnpaved = Boolean(road.surface && !['asphalt', 'concrete'].includes(road.surface));
  const hasSpeedRestriction = road.maxSpeed ? road.maxSpeed > 60 : false;

  return {
    isHighwayType,
    isUnpaved,
    hasSpeedRestriction,
  };
}

/**
 * Calculate distance in km between two coordinates
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
