import { create } from 'zustand';

export type FilterId = 'all' | 'this_weekend' | 'open' | 'under_R500' | 'top8';

interface FilterState {
  activeFilter: FilterId;
  maxFee: number | null;
  selectedStatus: string | null;
  setActiveFilter: (filter: FilterId) => void;
  setMaxFee: (fee: number | null) => void;
  setSelectedStatus: (status: string | null) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  activeFilter: 'all',
  maxFee: null,
  selectedStatus: null,

  setActiveFilter: (activeFilter) => set({ activeFilter }),
  setMaxFee: (maxFee) => set({ maxFee }),
  setSelectedStatus: (selectedStatus) => set({ selectedStatus }),
  resetFilters: () => set({ activeFilter: 'all', maxFee: null, selectedStatus: null }),
}));
