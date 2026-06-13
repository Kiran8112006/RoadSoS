import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { Place } from '../services/PlacesService';
import { calculateDistance } from '../services/GoogleMapsService';

interface Props {
  hospitals: Place[];
  policeStations: Place[];
  currentLocation: { latitude: number; longitude: number };
  onSelectPlace: (place: Place) => void;
  activeFilter: 'hospital' | 'police';
  onFilterChange: (filter: 'hospital' | 'police') => void;
}

export default function HospitalList({
  hospitals,
  policeStations,
  currentLocation,
  onSelectPlace,
  activeFilter,
  onFilterChange,
}: Props) {

  const places = activeFilter === 'hospital' ? hospitals : policeStations;

  const sortedPlaces = [...places].sort((a, b) => {
    const distA = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      a.latitude,
      a.longitude
    );
    const distB = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      b.latitude,
      b.longitude
    );
    return distA - distB;
  });

  const getDistance = (place: Place) => {
    const dist = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      place.latitude,
      place.longitude
    );
    return dist < 1
      ? `${(dist * 1000).toFixed(0)} m`
      : `${dist.toFixed(1)} km`;
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const renderItem = ({ item, index }: { item: Place; index: number }) => {
    const isNearest = index === 0;

    return (
      <TouchableOpacity
        style={[styles.card, isNearest && styles.nearestCard]}
        onPress={() => onSelectPlace(item)}
        activeOpacity={0.8}
      >
        {isNearest && (
          <View style={styles.nearestBadge}>
            <Text style={styles.nearestBadgeText}>NEAREST</Text>
          </View>
        )}

        <View style={styles.cardHeader}>
          <Text style={[styles.placeName, isNearest && styles.nearestName]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.distance}>{getDistance(item)}</Text>
        </View>

        <Text style={styles.address} numberOfLines={2}>{item.address}</Text>

        <View style={styles.cardFooter}>
          <View style={styles.statusRow}>
            {item.rating && (
              <Text style={styles.rating}>{item.rating} ★</Text>
            )}
            {item.openNow !== null && item.openNow !== undefined && (
              <Text style={[
                styles.openStatus,
                { color: item.openNow ? '#22C55E' : '#EF4444' }
              ]}>
                {item.openNow ? 'Open' : 'Closed'}
              </Text>
            )}
          </View>

          {item.phoneNumber && (
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => handleCall(item.phoneNumber!)}
            >
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter Toggle */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterButton, activeFilter === 'hospital' && styles.filterActive]}
          onPress={() => onFilterChange('hospital')}
        >
          <Text style={[styles.filterText, activeFilter === 'hospital' && styles.filterTextActive]}>
            Hospitals
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, activeFilter === 'police' && styles.filterActive]}
          onPress={() => onFilterChange('police')}
        >
          <Text style={[styles.filterText, activeFilter === 'police' && styles.filterTextActive]}>
            Police Stations
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={sortedPlaces}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No places found nearby</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  filterRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#1A202C',
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  filterActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  filterText: {
    color: '#A0AEC0',
    fontWeight: '600',
    fontSize: 14,
  },
  filterTextActive: {
    color: '#ffffff',
  },
  list: {
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  card: {
    backgroundColor: '#1A202C',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2D3748',
    marginBottom: 12,
  },
  nearestCard: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  nearestBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8,
  },
  nearestBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  placeName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  nearestName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  distance: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  address: {
    color: '#718096',
    fontSize: 12,
    marginBottom: 10,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rating: {
    color: '#F6C90E',
    fontSize: 13,
    fontWeight: '600',
  },
  openStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  callButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 6,
  },
  callButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyText: {
    color: '#718096',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
});
