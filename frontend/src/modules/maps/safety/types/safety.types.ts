// Accident hotspot data type
export interface AccidentHotspot {
  latitude: number;
  longitude: number;
  riskScore: number; // 0-1, where 1 is highest risk
  severity?: 'low' | 'medium' | 'high';
  count?: number; // Number of accidents in this area
  description?: string;
  source?: 'static' | 'osm_prediction';
}

// Road segment risk assessment
export interface RoadSegmentRisk {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  riskScore: number;
  factors: {
    accidentDensity: number;
    highwayType: string;
    maxSpeed?: number;
    isUnpaved: boolean;
    hasCurves: boolean;
    isIntersection: boolean;
  };
}

// Hospital location with safety route
export interface SafeHospitalRoute {
  hospital: {
    name: string;
    latitude: number;
    longitude: number;
    distance: number; // in km
  };
  route: {
    polyline: Array<{ latitude: number; longitude: number }>;
    distance: number; // in km
    duration: number; // in seconds
    accumulatedRisk: number; // 0-1
    safetyScore: number; // combined score
  };
  rank: number; // 1 = safest + shortest
}

// OSM road data
export interface OSMRoadData {
  id: string;
  lat: number;
  lng: number;
  highway: string; // primary, secondary, residential, etc.
  maxSpeed?: number;
  lanes?: number;
  surface?: string; // asphalt, concrete, gravel, etc.
  name?: string;
}

// OSM hospital/healthcare data
export interface OSMHospital {
  id: string;
  lat: number;
  lng: number;
  name: string;
  type: 'hospital' | 'clinic' | 'health_center';
}

// Safety route params
export interface SafeRouteParams {
  origin: {
    latitude: number;
    longitude: number;
  };
  destination?: {
    latitude: number;
    longitude: number;
  } | 'nearest_hospital'; // If 'nearest_hospital', auto-find
  radiusKm?: number; // Search radius for hospitals, default 10km
  weightRisk?: number; // α in cost = distance * α + risk * β, default 0.5
  weightDistance?: number; // β, default 0.5
}

// Response from safe route computation
export interface SafeRouteResponse {
  routes: SafeHospitalRoute[];
  selectedRoute: SafeHospitalRoute;
  computedAt: Date;
}
