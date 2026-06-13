import { AccidentHotspot } from '../types/safety.types';
import accidentHotspacsJson from '../data/accident-hotspots.json';
import { getPredictedAccidentHotspotsFromOSM } from './osm.service';

class AccidentDataService {
  private hotspots: AccidentHotspot[] = [];
  private isLoaded = false;

  /**
   * Load accident hotspots from JSON file or API
   */
  async loadHotspots(): Promise<AccidentHotspot[]> {
    if (this.isLoaded) {
      return this.hotspots;
    }

    try {
      // Load from imported JSON
      const data = accidentHotspacsJson as any;
      this.hotspots = (data.hotspots || []).map((hotspot: AccidentHotspot) => ({
        ...hotspot,
        source: 'static' as const,
      }));
      this.isLoaded = true;
      console.log(`Loaded ${this.hotspots.length} accident hotspots`);
      return this.hotspots;
    } catch (error) {
      console.error('Error loading accident hotspots:', error);
      return [];
    }
  }

  /**
   * Predict nearby accident-prone areas using OSM road data.
   */
  async loadOSMPredictedHotspots(
    latitude: number,
    longitude: number,
    radiusKm: number = 8
  ): Promise<AccidentHotspot[]> {
    try {
      const hotspots = await getPredictedAccidentHotspotsFromOSM(
        latitude,
        longitude,
        radiusKm
      );

      if (hotspots.length > 0) {
        this.hotspots = hotspots;
        this.isLoaded = true;
      }

      return this.hotspots;
    } catch (error) {
      console.error('Error loading OSM predicted hotspots:', error);
      return this.hotspots;
    }
  }

  /**
   * Get hotspots within a radius
   */
  getHotspotsInRadius(
    latitude: number,
    longitude: number,
    radiusKm: number = 50
  ): AccidentHotspot[] {
    return this.hotspots.filter((hotspot) => {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        hotspot.latitude,
        hotspot.longitude
      );
      return distance <= radiusKm;
    });
  }

  /**
   * Get hotspots for a specific city/area
   */
  getHotspotsByCity(city: string): AccidentHotspot[] {
    return this.hotspots.filter(
      (h: any) => h.city?.toLowerCase().includes(city.toLowerCase())
    );
  }

  /**
   * Get all hotspots
   */
  getAllHotspots(): AccidentHotspot[] {
    return this.hotspots;
  }

  /**
   * Calculate risk score based on proximity to hotspots
   * Returns 0-1 risk score
   */
  calculateProximityRisk(
    latitude: number,
    longitude: number,
    maxDistanceKm: number = 5
  ): number {
    const nearbyHotspots = this.getHotspotsInRadius(latitude, longitude, maxDistanceKm);

    if (nearbyHotspots.length === 0) {
      return 0;
    }

    // Weight by distance: closer hotspots have higher weight
    let totalRisk = 0;
    let totalWeight = 0;

    nearbyHotspots.forEach((hotspot) => {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        hotspot.latitude,
        hotspot.longitude
      );

      // Weight inversely proportional to distance
      const weight = Math.max(0, 1 - distance / maxDistanceKm);
      totalRisk += hotspot.riskScore * weight;
      totalWeight += weight;
    });

    const proximityRisk = totalWeight > 0 ? totalRisk / totalWeight : 0;
    return Math.min(1, proximityRisk); // Clamp to 0-1
  }

  /**
   * Calculate distance in km between two coordinates
   */
  private calculateDistance(
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
}

// Export singleton instance
export const accidentDataService = new AccidentDataService();
