export interface Location {
  latitude: number;
  longitude: number;
}

export interface Place {
  id: string;
  name: string;
  location: Location;
  address: string;
  rating?: number;
  phoneNumber?: string;
}

export interface Hospital extends Place {
  type: 'hospital';
  emergencyServices: boolean;
}

export interface PoliceStation extends Place {
  type: 'police';
}
