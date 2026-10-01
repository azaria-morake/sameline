export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TournamentStatus = 'draft' | 'open' | 'closed' | 'live' | 'completed';
export type TournamentTeamStatus = 'pending' | 'approved' | 'rejected' | 'paid_cash' | 'paid_tokens';
export type FixtureStatus = 'scheduled' | 'live' | 'completed';
export type NeedStatus = 'open' | 'funded' | 'fulfilled';
export type NeedCategory = 'gear' | 'entry_fee' | 'transport' | 'other';
export type TokenTxType = 'purchase' | 'support' | 'spend_entry' | 'refund';
export type FundraisingPostType = 'need_created' | 'support_received' | 'milestone';

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          phone: string | null;
          display_name: string;
          avatar_url: string | null;
          is_organizer_pro: boolean;
          is_team_pro: boolean;
          pro_expires_at: string | null;
          team_pro_expires_at: string | null;
          location: unknown | null;
          created_at: string;
        };
        Insert: {
          id: string;
          phone?: string | null;
          display_name?: string;
          avatar_url?: string | null;
          is_organizer_pro?: boolean;
          is_team_pro?: boolean;
          pro_expires_at?: string | null;
          team_pro_expires_at?: string | null;
          location?: unknown | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          phone?: string | null;
          display_name?: string;
          avatar_url?: string | null;
          is_organizer_pro?: boolean;
          is_team_pro?: boolean;
          pro_expires_at?: string | null;
          team_pro_expires_at?: string | null;
          location?: unknown | null;
          created_at?: string;
        };
        Relationships: [];
      };
      teams: {
        Row: {
          id: string;
          name: string;
          slug: string;
          captain_id: string;
          logo_url: string | null;
          location_text: string;
          location: unknown | null;
          bio: string | null;
          is_team_pro: boolean;
          stats: {
            played: number;
            wins: number;
            finals: number;
            titles: number;
          };
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          captain_id: string;
          logo_url?: string | null;
          location_text?: string;
          location?: unknown | null;
          bio?: string | null;
          is_team_pro?: boolean;
          stats?: {
            played?: number;
            wins?: number;
            finals?: number;
            titles?: number;
          };
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          captain_id?: string;
          logo_url?: string | null;
          location_text?: string;
          location?: unknown | null;
          bio?: string | null;
          is_team_pro?: boolean;
          stats?: {
            played?: number;
            wins?: number;
            finals?: number;
            titles?: number;
          };
          created_at?: string;
        };
        Relationships: [];
      };
      token_wallets: {
        Row: {
          id: string;
          user_id: string | null;
          team_id: string | null;
          balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          team_id?: string | null;
          balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          team_id?: string | null;
          balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      team_needs: {
        Row: {
          id: string;
          team_id: string;
          title: string;
          description: string | null;
          target_tokens: number;
          current_tokens: number;
          status: NeedStatus;
          category: NeedCategory;
          tournament_id: string | null;
          supporters_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          title: string;
          description?: string | null;
          target_tokens: number;
          current_tokens?: number;
          status?: NeedStatus;
          category?: NeedCategory;
          tournament_id?: string | null;
          supporters_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          title?: string;
          description?: string | null;
          target_tokens?: number;
          current_tokens?: number;
          status?: NeedStatus;
          category?: NeedCategory;
          tournament_id?: string | null;
          supporters_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      token_transactions: {
        Row: {
          id: string;
          from_user_id: string | null;
          from_team_id: string | null;
          to_team_id: string | null;
          to_need_id: string | null;
          amount: number;
          type: TokenTxType;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          from_user_id?: string | null;
          from_team_id?: string | null;
          to_team_id?: string | null;
          to_need_id?: string | null;
          amount: number;
          type: TokenTxType;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          from_user_id?: string | null;
          from_team_id?: string | null;
          to_team_id?: string | null;
          to_need_id?: string | null;
          amount?: number;
          type?: TokenTxType;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      fundraising_posts: {
        Row: {
          id: string;
          team_id: string;
          need_id: string | null;
          type: FundraisingPostType;
          message: string;
          tokens_amount: number;
          supporter_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          need_id?: string | null;
          type?: FundraisingPostType;
          message: string;
          tokens_amount?: number;
          supporter_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          need_id?: string | null;
          type?: FundraisingPostType;
          message?: string;
          tokens_amount?: number;
          supporter_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      tournaments: {
        Row: {
          id: string;
          organizer_id: string;
          title: string;
          description: string | null;
          location_text: string;
          location: unknown;
          start_date: string;
          end_date: string | null;
          entry_fee: number;
          max_teams: number;
          team_count: number;
          status: TournamentStatus;
          prize_pool_text: string | null;
          contact_whatsapp: string;
          is_featured: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          organizer_id: string;
          title: string;
          description?: string | null;
          location_text: string;
          location: unknown;
          start_date: string;
          end_date?: string | null;
          entry_fee?: number;
          max_teams?: number;
          team_count?: number;
          status?: TournamentStatus;
          prize_pool_text?: string | null;
          contact_whatsapp: string;
          is_featured?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          organizer_id?: string;
          title?: string;
          description?: string | null;
          location_text?: string;
          location?: unknown;
          start_date?: string;
          end_date?: string | null;
          entry_fee?: number;
          max_teams?: number;
          team_count?: number;
          status?: TournamentStatus;
          prize_pool_text?: string | null;
          contact_whatsapp?: string;
          is_featured?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      tournament_teams: {
        Row: {
          id: string;
          tournament_id: string;
          team_id: string;
          status: TournamentTeamStatus;
          requested_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          team_id: string;
          status?: TournamentTeamStatus;
          requested_at?: string;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          team_id?: string;
          status?: TournamentTeamStatus;
          requested_at?: string;
        };
        Relationships: [];
      };
      fixtures: {
        Row: {
          id: string;
          tournament_id: string;
          round: string;
          team_a_id: string | null;
          team_b_id: string | null;
          team_a_score: number | null;
          team_b_score: number | null;
          status: FixtureStatus;
          pitch_number: number | null;
          kickoff_time: string | null;
          winner_team_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          round?: string;
          team_a_id?: string | null;
          team_b_id?: string | null;
          team_a_score?: number | null;
          team_b_score?: number | null;
          status?: FixtureStatus;
          pitch_number?: number | null;
          kickoff_time?: string | null;
          winner_team_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          round?: string;
          team_a_id?: string | null;
          team_b_id?: string | null;
          team_a_score?: number | null;
          team_b_score?: number | null;
          status?: FixtureStatus;
          pitch_number?: number | null;
          kickoff_time?: string | null;
          winner_team_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      players: {
        Row: {
          id: string;
          team_id: string;
          user_id: string | null;
          name: string;
          position: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id?: string | null;
          name: string;
          position?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string | null;
          name?: string;
          position?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      nearby_tournaments: {
        Args: {
          lat: number;
          lng: number;
          radius_m?: number;
          filter_status?: string | null;
        };
        Returns: {
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
          status: TournamentStatus;
          prize_pool_text: string | null;
          contact_whatsapp: string;
          is_featured: boolean;
          distance_m: number;
          organizer_name: string;
          organizer_avatar: string | null;
        }[];
      };
      is_organizer_pro: {
        Args: { user_id: string };
        Returns: boolean;
      };
      is_team_pro: {
        Args: { team_id: string };
        Returns: boolean;
      };
      delete_user: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
    Enums: {
      tournament_status: TournamentStatus;
      tournament_team_status: TournamentTeamStatus;
      fixture_status: FixtureStatus;
      need_status: NeedStatus;
      need_category: NeedCategory;
      token_tx_type: TokenTxType;
      fundraising_post_type: FundraisingPostType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
