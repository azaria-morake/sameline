import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useLocationStore } from '../stores/locationStore';
import { useFilterStore } from '../stores/filterStore';
import { locationService } from '../services/location';

export interface NearbyTournamentItem {
  id: string;
  organizer_id: string;
  title: string;
  description: string | null;
  location_text: string;
  start_date: string;
  end_date: string | null;
  entry_fee: number;
  max_teams: number;
  team_count: number;
  status: 'draft' | 'open' | 'closed' | 'live' | 'completed';
  prize_pool_text: string | null;
  contact_whatsapp: string;
  is_featured: boolean;
  distance_m: number;
  organizer_name: string;
  organizer_avatar: string | null;
  banner_image_url?: string;
}

// Cultural seed tournaments matching reference designs (Katlehong, Vosloorus, Thokoza)
export const SEED_TOURNAMENTS: NearbyTournamentItem[] = [
  {
    id: 'seed-katlehong-top-8',
    organizer_id: 'org-zulu-sports',
    title: 'Katlehong Top 8 Cash Cup',
    description: 'The premier weekend cash showdown in Huntersfield Ground. Winner takes all trophy and new match kit.',
    location_text: 'Katlehong',
    start_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], // Next Sat
    end_date: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
    entry_fee: 500,
    max_teams: 16,
    team_count: 8,
    status: 'open',
    prize_pool_text: 'R10,000 + Kit',
    contact_whatsapp: '+27821234567',
    is_featured: true,
    distance_m: 2300,
    organizer_name: 'Zulu Sports',
    organizer_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
  },
  {
    id: 'seed-vosloorus-street-cup',
    organizer_id: 'org-vusimuzi',
    title: 'Vosloorus Street Cup',
    description: 'Fast-paced street football top 16 tournament. Strictly kasi rules.',
    location_text: 'Vosloorus',
    start_date: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
    entry_fee: 300,
    max_teams: 16,
    team_count: 12,
    status: 'open',
    prize_pool_text: 'R5,000',
    contact_whatsapp: '+27839876543',
    is_featured: false,
    distance_m: 5700,
    organizer_name: 'Vusimuzi FC',
    organizer_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
  },
  {
    id: 'seed-thokoza-community-cup',
    organizer_id: 'org-thokoza-united',
    title: 'Thokoza Community Cup',
    description: 'Annual youth and senior Top 16 tournament in Thokoza Stadium.',
    location_text: 'Thokoza',
    start_date: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 86400000 * 11).toISOString().split('T')[0],
    entry_fee: 400,
    max_teams: 16,
    team_count: 6,
    status: 'open',
    prize_pool_text: 'R7,500',
    contact_whatsapp: '+27845551234',
    is_featured: false,
    distance_m: 8900,
    organizer_name: 'Thokoza United',
    organizer_avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
  },
  {
    id: 'seed-ekurhuleni-champ-league',
    organizer_id: 'org-ekurhuleni',
    title: 'Ekurhuleni Champions League',
    description: 'Top teams from across the East Rand competing for regional bragging rights and R15,000 cash prize.',
    location_text: 'Katlehong',
    start_date: new Date(Date.now() + 86400000 * 17).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 86400000 * 18).toISOString().split('T')[0],
    entry_fee: 650,
    max_teams: 32,
    team_count: 22,
    status: 'open',
    prize_pool_text: 'R15,000',
    contact_whatsapp: '+27711234567',
    is_featured: true,
    distance_m: 4100,
    organizer_name: 'Ekurhuleni Sports Board',
    organizer_avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
  }
];

export function useNearbyTournaments() {
  const queryClient = useQueryClient();
  const { coords, radiusKm, townshipName } = useLocationStore();
  const { activeFilter, maxFee } = useFilterStore();

  const queryKey = ['tournaments', 'nearby', coords.latitude, coords.longitude, radiusKm, activeFilter, maxFee];

  const query = useQuery({
    queryKey,
    staleTime: 1000 * 60 * 2, // 2 minutes
    queryFn: async (): Promise<NearbyTournamentItem[]> => {
      try {
        const { data, error } = await supabase.rpc('nearby_tournaments', {
          lat: coords.latitude,
          lng: coords.longitude,
          radius_m: radiusKm * 1000,
          filter_status: activeFilter === 'open' ? 'open' : null,
        });

        if (error) {
          console.warn('Supabase RPC error, falling back to local dataset:', error.message);
          return filterSeedData(SEED_TOURNAMENTS, activeFilter, maxFee, coords);
        }

        if (data && data.length > 0) {
          return filterSeedData(data as NearbyTournamentItem[], activeFilter, maxFee, coords);
        }

        // Return curated seeds if empty DB during initial setup
        return filterSeedData(SEED_TOURNAMENTS, activeFilter, maxFee, coords);
      } catch (err) {
        console.warn('useNearbyTournaments fetch error, using fallback:', err);
        return filterSeedData(SEED_TOURNAMENTS, activeFilter, maxFee, coords);
      }
    },
  });

  // Subscribe to Realtime postgres_changes on tournaments
  useEffect(() => {
    const channel = supabase
      .channel('tournaments-feed-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tournaments' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tournaments', 'nearby'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    ...query,
    tournaments: query.data || [],
    townshipName,
  };
}

function filterSeedData(
  items: NearbyTournamentItem[],
  filter: string,
  maxFee: number | null,
  coords: { latitude: number; longitude: number }
): NearbyTournamentItem[] {
  let result = [...items];

  // Apply chip filter
  if (filter === 'open') {
    result = result.filter((t) => t.status === 'open');
  } else if (filter === 'under_R500') {
    result = result.filter((t) => t.entry_fee <= 500);
  } else if (filter === 'top8') {
    result = result.filter((t) => t.max_teams === 8 || t.title.toLowerCase().includes('top 8'));
  }

  if (maxFee !== null) {
    result = result.filter((t) => t.entry_fee <= maxFee);
  }

  return result;
}
