import { Linking } from 'react-native';
import * as Location from 'expo-location';
import nativeAuth from '@react-native-firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
} from 'firebase/firestore';
import { auth, app } from './firebase/firebase.config';

type EmergencyContact = {
  name?: string;
  phone?: string;
  number?: string;
  whatsappNumber?: string;
  isPrimary?: boolean;
};

type UserProfile = {
  fullName?: string;
  name?: string;
  displayName?: string;
  email?: string;
  phone?: string;
};

type CurrentLocation = {
  latitude: number;
  longitude: number;
};

export type PoliceStation = {
  name: string;
  phone: string;
  mapsUrl: string;
};

type EmergencyDetails = {
  message: string;
  policeStation: PoliceStation | null;
};

const db = getFirestore(app);
const GOOGLE_PLACES_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ||
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.EXPO_PUBLIC_GOOGLE_CLOUD_SPEECH_API_KEY;
const GOOGLE_PLACES_NEARBY_SEARCH_API =
  'https://places.googleapis.com/v1/places:searchNearby';

const phoneFields = [
  'whatsappNumber',
  'emergencyNumber',
  'emergencyPhone',
  'phone',
  'number',
];

const normalizePhoneNumber = (phone: string) =>
  phone.replace(/[^\d+]/g, '').replace(/^\+/, '');

const normalizeDialPhoneNumber = (phone: string) =>
  phone.replace(/[^\d+]/g, '');

const getCurrentUid = () =>
  auth.currentUser?.uid || nativeAuth().currentUser?.uid || '';

const firstStringField = (data: Record<string, unknown>, fields: string[]) => {
  for (const field of fields) {
    const value = data[field];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
};

const getDivisionEmergencyNumber = async (division: string) => {
  const divisionId = division.trim();
  if (!divisionId) {
    return '';
  }

  const collectionNames = [
    'divisions',
    'emergencyNumbers',
    'divisionEmergencyNumbers',
  ];

  for (const collectionName of collectionNames) {
    const snapshot = await getDoc(doc(db, collectionName, divisionId));
    if (!snapshot.exists()) {
      continue;
    }

    const phone = firstStringField(snapshot.data(), phoneFields);
    if (phone) {
      return phone;
    }
  }

  return '';
};

const getPrimaryEmergencyContactNumber = async (uid: string) => {
  const snapshot = await getDocs(
    collection(db, 'users', uid, 'emergencyContacts'),
  );

  const contacts = snapshot.docs.map(docSnapshot => ({
    ...(docSnapshot.data() as EmergencyContact),
  }));

  const primaryContact =
    contacts.find(contact => contact.isPrimary) || contacts[0];

  return primaryContact?.whatsappNumber ||
    primaryContact?.phone ||
    primaryContact?.number ||
    '';
};

const getEmergencyNumberForUser = async () => {
  const uid = getCurrentUid();
  if (!uid) {
    throw new Error('No signed-in user found');
  }

  const userSnapshot = await getDoc(doc(db, 'users', uid));
  if (!userSnapshot.exists()) {
    throw new Error('User profile not found');
  }

  const user = userSnapshot.data();
  const division =
    firstStringField(user, ['division', 'divisionId', 'divisionName']);

  const divisionNumber = await getDivisionEmergencyNumber(division);
  if (divisionNumber) {
    return divisionNumber;
  }

  const contactNumber = await getPrimaryEmergencyContactNumber(uid);
  if (contactNumber) {
    return contactNumber;
  }

  throw new Error('No emergency WhatsApp number found');
};

const getCurrentLocation = async (): Promise<CurrentLocation> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission not granted');
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  const { latitude, longitude } = location.coords;

  return { latitude, longitude };
};

const getUserProfile = async () => {
  const uid = getCurrentUid();
  if (!uid) {
    throw new Error('No signed-in user found');
  }

  const userSnapshot = await getDoc(doc(db, 'users', uid));
  if (!userSnapshot.exists()) {
    throw new Error('User profile not found');
  }

  return userSnapshot.data() as UserProfile;
};

const getDisplayName = (user: UserProfile) =>
  user.fullName ||
  user.name ||
  user.displayName ||
  user.email ||
  'this person';

const getMapsUrl = ({ latitude, longitude }: CurrentLocation) =>
  `https://maps.google.com/?q=${latitude},${longitude}`;

const isRegularPoliceStation = (placeName: string) => {
  const normalizedName = placeName.toLowerCase();
  const excludedTerms = [
    'railway',
    'rail road',
    'railroad',
    'train',
    'metro',
    'subway',
    'rpf',
    'grp',
    'government railway police',
    'railway protection force',
  ];

  return !excludedTerms.some(term => normalizedName.includes(term));
};

const getNearestPoliceStation = async (
  location: CurrentLocation,
): Promise<PoliceStation | null> => {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('Google Places API key is missing');
    return null;
  }

  try {
    const response = await fetch(GOOGLE_PLACES_NEARBY_SEARCH_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': [
          'places.displayName',
          'places.nationalPhoneNumber',
          'places.internationalPhoneNumber',
          'places.googleMapsUri',
          'places.location',
          'places.primaryType',
          'places.types',
        ].join(','),
      },
      body: JSON.stringify({
        includedTypes: ['police'],
        excludedTypes: [
          'train_station',
          'subway_station',
          'transit_station',
        ],
        maxResultCount: 10,
        rankPreference: 'DISTANCE',
        locationRestriction: {
          circle: {
            center: {
              latitude: location.latitude,
              longitude: location.longitude,
            },
            radius: 5000,
          },
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.warn('Google Places API error:', data);
      return null;
    }

    const places = Array.isArray(data?.places) ? data.places : [];
    const regularPoliceStations = places.filter((candidate: any) =>
      isRegularPoliceStation(candidate?.displayName?.text || ''),
    );
    const place =
      regularPoliceStations.find((candidate: any) =>
        Boolean(
          candidate?.internationalPhoneNumber ||
            candidate?.nationalPhoneNumber,
        ),
      ) || regularPoliceStations[0];

    if (!place) {
      return null;
    }

    const policeLocation = place.location;
    const mapsUrl =
      place.googleMapsUri ||
      (policeLocation
        ? getMapsUrl({
            latitude: policeLocation.latitude,
            longitude: policeLocation.longitude,
          })
        : '');

    return {
      name: place.displayName?.text || 'Nearest police station',
      phone:
        place.internationalPhoneNumber ||
        place.nationalPhoneNumber ||
        '',
      mapsUrl,
    };
  } catch (error) {
    console.warn('Failed to find nearest police station:', error);
    return null;
  }
};

const getEmergencyDetails = async (): Promise<EmergencyDetails> => {
  const [user, location] = await Promise.all([
    getUserProfile(),
    getCurrentLocation(),
  ]);

  const policeStation = await getNearestPoliceStation(location);
  const userName = getDisplayName(user);
  const mapsUrl = getMapsUrl(location);

  const policeDetails = policeStation
    ? [
        '',
        `Nearest police station: ${policeStation.name}`,
        policeStation.phone
          ? `Police station phone: ${policeStation.phone}`
          : 'Police station phone: not available from Google Maps',
        policeStation.mapsUrl
          ? `Police station map: ${policeStation.mapsUrl}`
          : '',
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  return {
    message: [
      `The person ${userName} is in trouble.`,
      'That person might need your help, please contact them ASAP.',
      `Their live location is: ${mapsUrl}`,
      policeDetails,
    ]
      .filter(Boolean)
      .join('\n'),
    policeStation,
  };
};

const openFirstAvailableUrl = async (urls: string[]) => {
  let lastError: unknown = null;

  for (const url of urls) {
    try {
      await Linking.openURL(url);
      return;
    } catch (error) {
      lastError = error;
      console.warn('Could not open emergency message URL:', url, error);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('WhatsApp could not be opened');
};

export const sendEmergencyWhatsAppMessage = async () => {
  const [phone, emergencyDetails] = await Promise.all([
    getEmergencyNumberForUser(),
    getEmergencyDetails(),
  ]);

  const normalizedPhone = normalizePhoneNumber(phone);
  const encodedMessage = encodeURIComponent(emergencyDetails.message);

  await openFirstAvailableUrl([
    `whatsapp://send?phone=${normalizedPhone}&text=${encodedMessage}`,
    `https://wa.me/${normalizedPhone}?text=${encodedMessage}`,
    `https://api.whatsapp.com/send?phone=${normalizedPhone}&text=${encodedMessage}`,
  ]);

  return emergencyDetails.policeStation;
};

export const callPoliceStation = async (policeStation: PoliceStation | null) => {
  if (policeStation?.phone) {
    await Linking.openURL(`tel:${normalizeDialPhoneNumber(policeStation.phone)}`);
    return;
  }

  if (policeStation?.mapsUrl) {
    await Linking.openURL(policeStation.mapsUrl);
    return;
  }

  throw new Error('Nearest police station phone number not available');
};

export const callNearestPoliceStation = async () => {
  const emergencyDetails = await getEmergencyDetails();
  await callPoliceStation(emergencyDetails.policeStation);

  return emergencyDetails.policeStation;
};
