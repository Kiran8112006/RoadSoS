const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export interface Place {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  rating?: number;
  distance?: number;
  type: 'hospital' | 'police';
  phoneNumber?: string;
  openNow?: boolean;
  openingHours?: string[];
}

export interface TravelMode {
  mode: 'driving' | 'walking' | 'transit' | 'bicycling';
  distance: string;
  duration: string;
}

export const findNearbyHospitals = async (
  latitude: number,
  longitude: number,
  radius: number = 5000
): Promise<Place[]> => {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error('findNearbyHospitals: API Key is missing');
    return [];
  }

  try {
    const url = `https://places.googleapis.com/v1/places:searchNearby`;

    const requestBody = {
      includedTypes: ['hospital'],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: {
            latitude: latitude,
            longitude: longitude,
          },
          radius: radius,
        },
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask':
          'places.displayName,places.location,places.formattedAddress,places.rating,places.id,places.nationalPhoneNumber,places.currentOpeningHours,places.regularOpeningHours',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (response.ok && data.places) {
      return data.places.map((place: any) => ({
        id: place.id,
        name: place.displayName?.text || 'Unknown Hospital',
        latitude: place.location.latitude,
        longitude: place.location.longitude,
        address: place.formattedAddress || 'Address not available',
        rating: place.rating,
        phoneNumber: place.nationalPhoneNumber || null,
        openNow: place.currentOpeningHours?.openNow ?? null,
        openingHours: place.regularOpeningHours?.weekdayDescriptions || [],
        type: 'hospital' as const,
      }));
    }

    console.error('Google Places hospital error:', data);
    return [];
  } catch (error) {
    console.error('Error finding hospitals:', error);
    return [];
  }
};

export const findNearbyPoliceStations = async (
  latitude: number,
  longitude: number,
  radius: number = 5000
): Promise<Place[]> => {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error('findNearbyPoliceStations: API Key is missing');
    return [];
  }

  try {
    const url = `https://places.googleapis.com/v1/places:searchNearby`;

    const requestBody = {
      includedTypes: ['police'],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: {
            latitude: latitude,
            longitude: longitude,
          },
          radius: radius,
        },
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask':
          'places.displayName,places.location,places.formattedAddress,places.rating,places.id,places.nationalPhoneNumber,places.currentOpeningHours',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (response.ok && data.places) {
      return data.places.map((place: any) => ({
        id: place.id,
        name: place.displayName?.text || 'Unknown Police Station',
        latitude: place.location.latitude,
        longitude: place.location.longitude,
        address: place.formattedAddress || 'Address not available',
        rating: place.rating,
        phoneNumber: place.nationalPhoneNumber || null,
        openNow: place.currentOpeningHours?.openNow ?? null,
        type: 'police' as const,
      }));
    }

    console.error('Google Places police error:', data);
    return [];
  } catch (error) {
    console.error('Error finding police stations:', error);
    return [];
  }
};

const TRAVEL_MODE_MAP: Record<string, string> = {
  driving: 'driving',
  walking: 'walking',
  transit: 'transit',
  bicycling: 'bicycling',
};

export const getTravelModes = async (
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<TravelMode[]> => {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error('getTravelModes: API Key is missing');
    return [];
  }

  const modes: ('driving' | 'walking' | 'transit' | 'bicycling')[] = [
    'driving',
    'walking',
    'transit',
    'bicycling',
  ];
  const results: TravelMode[] = [];

  await Promise.all(
    modes.map(async (mode) => {
      try {
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&mode=${TRAVEL_MODE_MAP[mode]}&key=${GOOGLE_MAPS_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        console.log(`${mode} response:`, data.status);

        if (data.status === 'OK' && data.routes.length > 0) {
          const leg = data.routes[0].legs[0];
          results.push({
            mode,
            distance: leg.distance.text,
            duration: leg.duration.text,
          });
        }
      } catch (error) {
        console.error(`Error getting ${mode} directions:`, error);
      }
    })
  );

  return results;
};
