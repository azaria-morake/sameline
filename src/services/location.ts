import * as Location from 'expo-location';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface TownshipPreset {
  id: string;
  name: string;
  region: string;
  coords: Coordinates;
}

// Major townships in Gauteng pilot
export const TOWNSHIP_PRESETS: TownshipPreset[] = [
  { id: 'katlehong', name: 'Katlehong', region: 'Ekurhuleni', coords: { latitude: -26.3312, longitude: 28.1518 } },
  { id: 'vosloorus', name: 'Vosloorus', region: 'Ekurhuleni', coords: { latitude: -26.3533, longitude: 28.1969 } },
  { id: 'thokoza', name: 'Thokoza', region: 'Ekurhuleni', coords: { latitude: -26.3503, longitude: 28.1402 } },
  { id: 'soweto', name: 'Soweto', region: 'Johannesburg', coords: { latitude: -26.2485, longitude: 27.8540 } },
  { id: 'daveyton', name: 'Daveyton', region: 'Ekurhuleni', coords: { latitude: -26.1438, longitude: 28.4312 } },
  { id: 'tembisa', name: 'Tembisa', region: 'Ekurhuleni', coords: { latitude: -26.0084, longitude: 28.2259 } },
  { id: 'alexandra', name: 'Alexandra', region: 'Johannesburg', coords: { latitude: -26.1042, longitude: 28.0934 } },
  { id: 'mamelodi', name: 'Mamelodi', region: 'Tshwane', coords: { latitude: -25.7069, longitude: 28.3776 } },
];

export const DEFAULT_TOWNSHIP = TOWNSHIP_PRESETS[0]; // Katlehong

class LocationService {
  async requestPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === Location.PermissionStatus.GRANTED;
    } catch (error) {
      console.warn('Error requesting location permission:', error);
      return false;
    }
  }

  async checkPermission(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === Location.PermissionStatus.GRANTED;
    } catch {
      return false;
    }
  }

  async getCurrentCoords(): Promise<Coordinates | null> {
    try {
      const hasPerm = await this.checkPermission();
      if (!hasPerm) return null;

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch (error) {
      console.warn('Failed to get current coordinates:', error);
      return null;
    }
  }

  async reverseGeocodeTownship(coords: Coordinates): Promise<string> {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      if (results && results.length > 0) {
        const place = results[0];
        return place.district || place.subregion || place.city || place.name || 'Katlehong';
      }
    } catch (error) {
      console.warn('Reverse geocode error:', error);
    }
    return 'Katlehong';
  }

  /**
   * Calculate distance between two points in kilometers
   */
  calculateDistanceKm(from: Coordinates, to: Coordinates): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
    const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((from.latitude * Math.PI) / 180) *
        Math.cos((to.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
  }

  formatDistance(metersOrKm: number, isMeters = false): string {
    const km = isMeters ? metersOrKm / 1000 : metersOrKm;
    if (km < 10) {
      return `${km.toFixed(1)}km away`;
    }
    return `${Math.round(km)}km away`;
  }
}

export const locationService = new LocationService();
