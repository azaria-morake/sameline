import { create } from 'zustand';
import { Coordinates, DEFAULT_TOWNSHIP, TOWNSHIP_PRESETS, TownshipPreset } from '../services/location';

interface LocationState {
  coords: Coordinates;
  townshipName: string;
  radiusKm: number;
  hasPermission: boolean;
  isLocating: boolean;
  setCoords: (coords: Coordinates) => void;
  setTownship: (name: string, coords?: Coordinates) => void;
  setRadiusKm: (radius: number) => void;
  setHasPermission: (hasPerm: boolean) => void;
  setIsLocating: (isLocating: boolean) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  coords: DEFAULT_TOWNSHIP.coords,
  townshipName: DEFAULT_TOWNSHIP.name,
  radiusKm: 20,
  hasPermission: false,
  isLocating: false,

  setCoords: (coords) => set({ coords }),
  
  setTownship: (name, coords) => {
    if (coords) {
      set({ townshipName: name, coords });
    } else {
      const match = TOWNSHIP_PRESETS.find(
        (t) => t.name.toLowerCase() === name.toLowerCase()
      );
      if (match) {
        set({ townshipName: match.name, coords: match.coords });
      } else {
        set({ townshipName: name });
      }
    }
  },

  setRadiusKm: (radiusKm) => set({ radiusKm }),
  setHasPermission: (hasPermission) => set({ hasPermission }),
  setIsLocating: (isLocating) => set({ isLocating }),
}));
