import React, { useState, useEffect, useRef } from 'react';
import { router } from 'expo-router';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
  Linking,
  SafeAreaView,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as Location from 'expo-location';
import {
  findNearbyHospitals,
  findNearbyPoliceStations,
  getTravelModes,
  Place,
  TravelMode,
} from '../services/PlacesService';
import { calculateDistance } from '../services/GoogleMapsService';
import AccidentHeatmap from './AccidentHeatmap';
import HospitalList from './HospitalList';
import { AccidentHotspot, useAccidentHotspots } from '../safety';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

const TRAVEL_MODE_LABELS: Record<string, string> = {
  driving: 'Drive',
  walking: 'Walk',
  transit: 'Transit',
  bicycling: 'Bicycle',
};

const getRiskLabel = (riskScore: number): 'Low' | 'Medium' | 'High' => {
  if (riskScore >= 0.7) return 'High';
  if (riskScore >= 0.4) return 'Medium';
  return 'Low';
};

const getRiskColor = (riskScore: number) => {
  if (riskScore >= 0.7) return '#EF4444';
  if (riskScore >= 0.4) return '#F59E0B';
  return '#22C55E';
};

const getHotspotTitle = (hotspot: AccidentHotspot) => {
  const label = getRiskLabel(hotspot.riskScore);
  return `${label} risk zone`;
};

const formatHotspotReason = (description?: string) => {
  if (!description) {
    return 'OSM predicted hotspot based on nearby road layout and traffic features.';
  }

  return description.replace(/^OSM risk prediction:\s*/i, '');
};

const getCurrentAreaRiskScore = (
  location: LocationCoords | null,
  hotspots: AccidentHotspot[]
) => {
  if (!location || hotspots.length === 0) return 0;

  const nearby = hotspots
    .map((hotspot) => ({
      hotspot,
      distance: calculateDistance(
        location.latitude,
        location.longitude,
        hotspot.latitude,
        hotspot.longitude
      ),
    }))
    .filter(({ distance }) => distance <= 2);

  if (nearby.length === 0) return 0;

  const weightedRisk = nearby.reduce((total, { hotspot, distance }) => {
    const weight = Math.max(0.2, 1 - distance / 2);
    return total + hotspot.riskScore * weight;
  }, 0);

  const totalWeight = nearby.reduce((total, { distance }) => {
    return total + Math.max(0.2, 1 - distance / 2);
  }, 0);

  return totalWeight > 0 ? Math.min(1, weightedRisk / totalWeight) : 0;
};

const RoadSoSMap: React.FC = () => {
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
  const [hospitals, setHospitals] = useState<Place[]>([]);
  const [policeStations, setPoliceStations] = useState<Place[]>([]);
  const [nearestHospital, setNearestHospital] = useState<Place | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [travelModes, setTravelModes] = useState<TravelMode[]>([]);
  const [showRoute, setShowRoute] = useState(false);
  const [routeDestination, setRouteDestination] = useState<LocationCoords | null>(null);
  const [selectedTravelMode, setSelectedTravelMode] = useState<string>('driving');
  const [nearestHospitalInfo, setNearestHospitalInfo] = useState<TravelMode | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [selectedHotspot, setSelectedHotspot] = useState<AccidentHotspot | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [activeFilter, setActiveFilter] = useState<'hospital' | 'police'>('hospital');
  const [loading, setLoading] = useState(true);
  
  const { getHotspotsInRadius, loadOSMPredictedHotspots } = useAccidentHotspots();

  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<MapView>(null);
  const snapPoints = ['12%', '45%', '85%'];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (currentLocation) {
      loadNearbyPlaces();
      loadOSMPredictedHotspots(
        currentLocation.latitude,
        currentLocation.longitude,
        8
      );
    }
  }, [currentLocation]);

  useEffect(() => {
    if (hospitals.length > 0 && currentLocation) {
      handleNearestHospital();
    }
  }, [hospitals, currentLocation]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      setLoading(false);
    } catch (error) {
      console.error('Error getting location:', error);
      setLoading(false);
    }
  };

  const loadNearbyPlaces = async () => {
    if (!currentLocation) return;

    if (!process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY) {
      console.error('MAPS_ERROR: EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is not defined in .env');
      Alert.alert('Configuration Error', 'Google Maps API Key is missing.');
      setLoading(false);
      return;
    }

    try {
      const [hospitalResults, policeResults] = await Promise.all([
        findNearbyHospitals(currentLocation.latitude, currentLocation.longitude),
        findNearbyPoliceStations(currentLocation.latitude, currentLocation.longitude),
      ]);

      console.log(`Successfully loaded ${hospitalResults.length} hospitals and ${policeResults.length} police stations`);
      setHospitals(hospitalResults);
      setPoliceStations(policeResults);
    } catch (error) {
      console.error('MAPS_ERROR: Failed to load nearby places', error);
      Alert.alert('Network Error', 'Failed to fetch nearby emergency services.');
    }
  };

  const handleNearestHospital = async () => {
    if (!currentLocation || hospitals.length === 0) return;

    console.log('Finding nearest hospital from', hospitals.length, 'hospitals');

    let nearest = hospitals[0];
    let shortestDistance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      nearest.latitude,
      nearest.longitude
    );

    hospitals.forEach((hospital) => {
      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        hospital.latitude,
        hospital.longitude
      );

      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearest = hospital;
      }
    });

    console.log('Nearest hospital:', nearest.name, 'Distance:', shortestDistance);

    setNearestHospital(nearest);
    setRouteDestination({
      latitude: nearest.latitude,
      longitude: nearest.longitude,
    });
    setShowRoute(true);
    setSelectedTravelMode('driving');

    const modes = await getTravelModes(
      currentLocation.latitude,
      currentLocation.longitude,
      nearest.latitude,
      nearest.longitude
    );

    console.log('Travel modes:', modes);

    const drivingMode = modes.find((m) => m.mode === 'driving');
    if (drivingMode) {
      setNearestHospitalInfo(drivingMode);
    }
  };

  const handleMarkerPress = async (place: Place) => {
    setSelectedHotspot(null);
    setSelectedPlace(place);
    setTravelModes([]);
    bottomSheetRef.current?.expand();

    if (currentLocation) {
      const modes = await getTravelModes(
        currentLocation.latitude,
        currentLocation.longitude,
        place.latitude,
        place.longitude
      );
      setTravelModes(modes);
    }
  };

  const handleGetDirections = (mode: string) => {
    if (!selectedPlace) return;
    setSelectedTravelMode(mode);
    setRouteDestination({
      latitude: selectedPlace.latitude,
      longitude: selectedPlace.longitude,
    });
    setShowRoute(true);
    bottomSheetRef.current?.snapToIndex(0);
    setViewMode('map');
  };

  const handleHotspotPress = (hotspot: AccidentHotspot) => {
    setSelectedPlace(null);
    setTravelModes([]);
    setSelectedHotspot(hotspot);
    bottomSheetRef.current?.expand();
  };

  const handleSOS = () => {
    if (!nearestHospital) {
      Alert.alert('No Hospital Found', 'Could not find a nearby hospital');
      return;
    }

    Alert.alert(
      'SOS - Emergency',
      `Calling ${nearestHospital.name}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          style: 'destructive',
          onPress: () => {
            if (nearestHospital.phoneNumber) {
              Linking.openURL(`tel:${nearestHospital.phoneNumber}`);
            } else {
              openInGoogleMaps(
                nearestHospital.latitude,
                nearestHospital.longitude,
                nearestHospital.name
              );
            }
          },
        },
      ]
    );
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const openInGoogleMaps = (destLat: number, destLng: number, name: string) => {
    const url = `google.navigation:q=${destLat},${destLng}&mode=d`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(
          `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&destination_place_name=${encodeURIComponent(name)}&travelmode=driving`
        );
      }
    });
  };

  const handleSelectPlaceFromList = async (place: Place) => {
    setViewMode('map');
    await handleMarkerPress(place);
  };

  const visibleHotspots = currentLocation
    ? getHotspotsInRadius(currentLocation.latitude, currentLocation.longitude, 40)
    : [];
  const currentAreaRiskScore = getCurrentAreaRiskScore(currentLocation, visibleHotspots);
  const currentAreaRiskLabel = getRiskLabel(currentAreaRiskScore);

  return (
    <SafeAreaView style={styles.container}>
      {viewMode === 'map' ? (
        <>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={currentLocation ? {
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            } : undefined}
            showsUserLocation={true}
            showsMyLocationButton={false}
            zoomEnabled={true}
            zoomControlEnabled={true}
            scrollEnabled={true}
            pitchEnabled={true}
            rotateEnabled={true}
            showsTraffic={true}
          >
            {/* Accident Heatmap */}
            {currentLocation && showHeatmap && (
              <AccidentHeatmap
                hotspots={visibleHotspots}
                onHotspotPress={handleHotspotPress}
              />
            )}

            {/* Current Location Marker */}
            {currentLocation && (
              <Marker
                coordinate={currentLocation}
                title="You are here"
                pinColor="red"
              />
            )}

            {/* Hospital Markers */}
            {hospitals.map((hospital) => (
              <Marker
                key={hospital.id}
                coordinate={{
                  latitude: hospital.latitude,
                  longitude: hospital.longitude,
                }}
                title={hospital.name}
                description={hospital.address}
                pinColor={nearestHospital?.id === hospital.id ? 'tomato' : 'blue'}
                onPress={() => handleMarkerPress(hospital)}
              />
            ))}

            {/* Police Station Markers */}
            {policeStations.map((police) => (
              <Marker
                key={police.id}
                coordinate={{
                  latitude: police.latitude,
                  longitude: police.longitude,
                }}
                title={police.name}
                description={police.address}
                pinColor="green"
                onPress={() => handleMarkerPress(police)}
              />
            ))}

            {/* Route Line */}
            {showRoute && currentLocation && routeDestination && (
              <MapViewDirections
                origin={currentLocation}
                destination={routeDestination}
                apikey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY!}
                strokeWidth={5}
                strokeColor="#4285F4"
                mode={selectedTravelMode.toUpperCase() as any}
                optimizeWaypoints={true}
                onError={(errorMessage) => {
                  console.error('Route error:', errorMessage);
                }}
              />
            )}
          </MapView>

          {/* Top Bar */}
          <View style={styles.topBar}>
            <View style={styles.topBarRow}>
              <TouchableOpacity
                style={styles.backArrow}
                onPress={() => router.back()}
              >
                <Text style={styles.backArrowText}>←</Text>
              </TouchableOpacity>

              {nearestHospital && nearestHospitalInfo && (
                <TouchableOpacity
                  style={styles.nearestInfo}
                  activeOpacity={0.78}
                  onPress={() => handleMarkerPress(nearestHospital)}
                >
                  <Text style={styles.nearestLabel}>NEAREST HOSPITAL</Text>
                  <Text style={styles.nearestName} numberOfLines={1}>
                    {nearestHospital.name}
                  </Text>
                  <Text style={styles.nearestDetails}>
                    {nearestHospitalInfo.distance}  •  {nearestHospitalInfo.duration} by car
                  </Text>
                </TouchableOpacity>
              )}

              <View style={styles.topRiskInfo}>
                <Text style={styles.topRiskLabel}>CURRENT AREA RISK</Text>
                <Text style={[styles.topRiskValue, { color: getRiskColor(currentAreaRiskScore) }]}>
                  {currentAreaRiskLabel}
                </Text>
              </View>
            </View>

            <View style={styles.topBarActions}>
              {/* List View Toggle */}
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setViewMode('list')}
              >
                <Text style={styles.iconButtonText}>List</Text>
              </TouchableOpacity>

              {/* Heatmap Toggle */}
              <TouchableOpacity
                style={[styles.iconButton, showHeatmap && styles.iconButtonActive]}
                onPress={() => setShowHeatmap(!showHeatmap)}
              >
                <Text style={[styles.iconButtonText, showHeatmap && styles.iconButtonTextActive]}>
                  Zones
                </Text>
              </TouchableOpacity>

              {/* Hide/Show Route */}
              <TouchableOpacity
                style={[styles.iconButton, showRoute && styles.iconButtonActive]}
                onPress={() => setShowRoute(!showRoute)}
              >
                <Text style={[styles.iconButtonText, showRoute && styles.iconButtonTextActive]}>
                  Route
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* SOS Button */}
          <TouchableOpacity
            style={styles.sosButton}
            onPress={handleSOS}
            activeOpacity={0.8}
          >
            <Text style={styles.sosText}>SOS</Text>
          </TouchableOpacity>

          {/* Bottom Sheet */}
          {(selectedPlace || selectedHotspot) && (
          <BottomSheet
            ref={bottomSheetRef}
            index={1}
            snapPoints={snapPoints}
            enablePanDownToClose={false}
            backgroundStyle={styles.bottomSheetBackground}
            handleIndicatorStyle={styles.handleIndicator}
            android_keyboardInputMode="adjustResize"
          >
            <BottomSheetScrollView contentContainerStyle={styles.bottomSheetContent}>
              {selectedHotspot && (
                <>
                  <Text style={styles.sheetPlaceName}>{getHotspotTitle(selectedHotspot)}</Text>

                  <View style={styles.sheetMetaRow}>
                    <Text style={[
                      styles.sheetRiskBadge,
                      { color: getRiskColor(selectedHotspot.riskScore) }
                    ]}>
                      Risk score {Math.round(selectedHotspot.riskScore * 100)}%
                    </Text>
                    {selectedHotspot.source === 'osm_prediction' && (
                      <Text style={styles.sheetPlaceType}>OSM predicted hotspot</Text>
                    )}
                  </View>

                  <View style={styles.sheetSection}>
                    <Text style={styles.sheetSectionTitle}>Why this area is risky</Text>
                    <Text style={styles.sheetAddress}>
                      {formatHotspotReason(selectedHotspot.description)}
                    </Text>
                    <Text style={styles.sheetAddress}>
                      Examples include road class, intersections, lane count, signals, speed, or surface data found in OpenStreetMap.
                    </Text>
                  </View>
                </>
              )}

              {selectedPlace && (
                <>
                  <Text style={styles.sheetPlaceName}>{selectedPlace.name}</Text>

                  <View style={styles.sheetMetaRow}>
                    <Text style={styles.sheetPlaceType}>
                      {selectedPlace.type === 'hospital' ? 'Hospital' : 'Police Station'}
                    </Text>
                    {selectedPlace.rating && (
                      <Text style={styles.sheetRating}>{selectedPlace.rating} ★</Text>
                    )}
                    {selectedPlace.openNow !== null && selectedPlace.openNow !== undefined && (
                      <Text style={[
                        styles.sheetOpenStatus,
                        { color: selectedPlace.openNow ? '#22C55E' : '#EF4444' }
                      ]}>
                        {selectedPlace.openNow ? 'Open' : 'Closed'}
                      </Text>
                    )}
                  </View>

                  <Text style={styles.sheetAddress}>{selectedPlace.address}</Text>

                  <View style={styles.sheetButtonRow}>
                    {selectedPlace.phoneNumber && (
                      <TouchableOpacity
                        style={styles.sheetCallButton}
                        onPress={() => handleCall(selectedPlace.phoneNumber!)}
                      >
                        <Text style={styles.sheetCallButtonText}>Call</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.sheetGoogleButton}
                      onPress={() => openInGoogleMaps(
                        selectedPlace.latitude,
                        selectedPlace.longitude,
                        selectedPlace.name
                      )}
                    >
                      <Text style={styles.sheetGoogleButtonText}>Open in Google Maps</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Opening Hours */}
                  {selectedPlace.openingHours && selectedPlace.openingHours.length > 0 && (
                    <View style={styles.sheetSection}>
                      <Text style={styles.sheetSectionTitle}>Opening Hours</Text>
                      {selectedPlace.openingHours.map((hour, index) => (
                        <Text key={index} style={styles.sheetHourText}>{hour}</Text>
                      ))}
                    </View>
                  )}

                  {/* Travel Modes */}
                  <View style={styles.sheetSection}>
                    <Text style={styles.sheetSectionTitle}>Directions</Text>
                    {travelModes.length === 0 ? (
                      <Text style={styles.sheetLoadingText}>Loading...</Text>
                    ) : (
                      travelModes.map((mode) => (
                        <TouchableOpacity
                          key={mode.mode}
                          style={styles.travelModeRow}
                          onPress={() => handleGetDirections(mode.mode)}
                        >
                          <Text style={styles.travelModeLabel}>
                            {TRAVEL_MODE_LABELS[mode.mode]}
                          </Text>
                          <Text style={styles.travelModeDetails}>
                            {mode.distance}  •  {mode.duration}
                          </Text>
                          <Text style={styles.travelModeArrow}>›</Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                </>
              )}
            </BottomSheetScrollView>
          </BottomSheet>
          )}
        </>
      ) : (
        <>
          {/* List View Header */}
          <View style={styles.listHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setViewMode('map')}
            >
              <Text style={styles.backButtonText}>← Map</Text>
            </TouchableOpacity>
            <Text style={styles.listHeaderTitle}>Nearby Places</Text>
          </View>

          {currentLocation && (
            <HospitalList
              hospitals={hospitals}
              policeStations={policeStations}
              currentLocation={currentLocation}
              onSelectPlace={handleSelectPlaceFromList}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  map: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(11, 15, 25, 0.92)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2D3748',
    elevation: 6,
  },
  nearestInfo: {
    flex: 1,
  },
  nearestLabel: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  nearestName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  nearestDetails: {
    color: '#718096',
    fontSize: 12,
  },
  topRiskInfo: {
    minWidth: 86,
    alignItems: 'flex-end',
    paddingLeft: 8,
  },
  topRiskLabel: {
    color: '#A0AEC0',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 3,
    textAlign: 'right',
  },
  topRiskValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  topBarActions: {
    flexDirection: 'row',
    gap: 8,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  backArrow: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#1A202C',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  backArrowText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  iconButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#1A202C',
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  iconButtonActive: {
    backgroundColor: '#2D3748',
    borderColor: '#4285F4',
  },
  iconButtonText: {
    color: '#A0AEC0',
    fontSize: 12,
    fontWeight: '600',
  },
  iconButtonTextActive: {
    color: '#4285F4',
  },
  sosButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  sosText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  bottomSheetBackground: {
    backgroundColor: '#0B0F19',
    borderTopWidth: 1,
    borderTopColor: '#2D3748',
  },
  handleIndicator: {
    backgroundColor: '#4A5568',
    width: 40,
  },
  bottomSheetContent: {
    padding: 20,
  },
  sheetPlaceName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  sheetMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  sheetPlaceType: {
    color: '#718096',
    fontSize: 13,
  },
  sheetRiskBadge: {
    fontSize: 13,
    fontWeight: '800',
  },
  sheetRating: {
    color: '#F6C90E',
    fontSize: 13,
    fontWeight: '600',
  },
  sheetOpenStatus: {
    fontSize: 13,
    fontWeight: '600',
  },
  sheetAddress: {
    color: '#718096',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  sheetButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  sheetCallButton: {
    flex: 1,
    backgroundColor: '#22C55E',
    padding: 13,
    borderRadius: 8,
    alignItems: 'center',
  },
  sheetCallButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  sheetGoogleButton: {
    flex: 2,
    backgroundColor: '#1A202C',
    padding: 13,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  sheetGoogleButtonText: {
    color: '#4285F4',
    fontWeight: '700',
    fontSize: 14,
  },
  sheetSection: {
    marginBottom: 20,
  },
  sheetSectionTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  sheetHourText: {
    color: '#718096',
    fontSize: 13,
    marginBottom: 4,
    lineHeight: 20,
  },
  sheetLoadingText: {
    color: '#718096',
    fontSize: 13,
  },
  travelModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A202C',
  },
  travelModeLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    width: 70,
  },
  travelModeDetails: {
    color: '#718096',
    fontSize: 13,
    flex: 1,
  },
  travelModeArrow: {
    color: '#4285F4',
    fontSize: 20,
    fontWeight: '300',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1A202C',
  },
  backButton: {
    marginRight: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#1A202C',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  backButtonText: {
    color: '#4285F4',
    fontSize: 15,
    fontWeight: '700',
  },
  listHeaderTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
});

export default RoadSoSMap;
