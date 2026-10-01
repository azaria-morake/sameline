import { Platform } from 'react-native';
import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { revenueCat } from '../services/revenuecat';

export interface UserProfile {
  id: string;
  display_name: string;
  phone: string | null;
  avatar_url: string | null;
  is_organizer_pro: boolean;
  is_team_pro: boolean;
  pro_expires_at: string | null;
  team_pro_expires_at: string | null;
  team_id?: string;
  team_name?: string;
  roleTitle?: string;
}

export interface DemoAccount {
  id: string;
  display_name: string;
  phone: string;
  avatar_url: string;
  roleTitle: string;
  is_organizer_pro: boolean;
  is_team_pro: boolean;
  team_id?: string;
  team_name?: string;
  bio?: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'demo-captain-sipho',
    display_name: 'Sipho Zulu',
    phone: '+27 82 456 7890',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    roleTitle: 'Team Captain (Pro)',
    is_organizer_pro: false,
    is_team_pro: true,
    team_id: 'dk-xi',
    team_name: 'DK XI',
    bio: 'Captain of DK XI in Katlehong. Unlocked Team Pro Community Bank.',
  },
  {
    id: 'demo-supporter-thabo',
    display_name: 'Thabo Mokoena',
    phone: '+27 71 888 4321',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    roleTitle: 'Community Supporter',
    is_organizer_pro: false,
    is_team_pro: false,
    bio: 'Kasi football enthusiast & supporter. Has tokens to back teams.',
  },
  {
    id: 'demo-organizer-jabu',
    display_name: 'Jabu Sithole',
    phone: '+27 83 999 1122',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    roleTitle: 'Tournament Organizer (Pro)',
    is_organizer_pro: true,
    is_team_pro: false,
    bio: 'Host of Katlehong Top 8 and East Rand soccer tournaments.',
  },
];

interface AuthState {
  user: UserProfile | null;
  session: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  isOrganizerPro: boolean;
  isTeamPro: boolean;
  activeDemoAccountId: string;
  setUser: (user: UserProfile | null) => void;
  setSession: (session: any | null) => void;
  setIsGuest: (isGuest: boolean) => void;
  setIsOrganizerPro: (isPro: boolean) => void;
  setIsTeamPro: (isPro: boolean) => void;
  switchDemoAccount: (accountId: string) => void;
  syncUserProfile: (sessionUser: any) => Promise<UserProfile>;
  initializeAuth: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: {
    id: DEMO_ACCOUNTS[0].id,
    display_name: DEMO_ACCOUNTS[0].display_name,
    phone: DEMO_ACCOUNTS[0].phone,
    avatar_url: DEMO_ACCOUNTS[0].avatar_url,
    is_organizer_pro: DEMO_ACCOUNTS[0].is_organizer_pro,
    is_team_pro: DEMO_ACCOUNTS[0].is_team_pro,
    pro_expires_at: null,
    team_pro_expires_at: null,
    team_id: DEMO_ACCOUNTS[0].team_id,
    team_name: DEMO_ACCOUNTS[0].team_name,
    roleTitle: DEMO_ACCOUNTS[0].roleTitle,
  },
  session: null,
  isLoading: false,
  isAuthenticated: true, // Default to true with demo dummy account for instant access
  isGuest: false,
  isOrganizerPro: DEMO_ACCOUNTS[0].is_organizer_pro,
  isTeamPro: DEMO_ACCOUNTS[0].is_team_pro,
  activeDemoAccountId: DEMO_ACCOUNTS[0].id,

  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user,
      isOrganizerPro: !!user?.is_organizer_pro,
      isTeamPro: !!user?.is_team_pro,
      isGuest: user ? false : get().isGuest,
    });
  },

  setSession: (session) => {
    set({
      session,
      isAuthenticated: !!session,
      isGuest: session ? false : get().isGuest,
    });
  },

  setIsGuest: (isGuest) => {
    set({ isGuest });
  },

  setIsOrganizerPro: (isOrganizerPro) => {
    set((state) => ({
      isOrganizerPro,
      user: state.user ? { ...state.user, is_organizer_pro: isOrganizerPro } : null,
    }));
  },

  setIsTeamPro: (isTeamPro) => {
    set((state) => ({
      isTeamPro,
      user: state.user ? { ...state.user, is_team_pro: isTeamPro } : null,
    }));
  },

  switchDemoAccount: (accountId: string) => {
    const acc = DEMO_ACCOUNTS.find((a) => a.id === accountId) || DEMO_ACCOUNTS[0];
    const profile: UserProfile = {
      id: acc.id,
      display_name: acc.display_name,
      phone: acc.phone,
      avatar_url: acc.avatar_url,
      is_organizer_pro: acc.is_organizer_pro,
      is_team_pro: acc.is_team_pro,
      pro_expires_at: null,
      team_pro_expires_at: null,
      team_id: acc.team_id,
      team_name: acc.team_name,
      roleTitle: acc.roleTitle,
    };

    set({
      user: profile,
      isAuthenticated: true,
      isGuest: false,
      isOrganizerPro: acc.is_organizer_pro,
      isTeamPro: acc.is_team_pro,
      activeDemoAccountId: acc.id,
    });

    console.log(`👤 Switched to Demo Account: ${acc.display_name} (${acc.roleTitle})`);
  },

  syncUserProfile: async (sessionUser: any) => {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', sessionUser.id)
        .single();

      if (profile) {
        const userProfile: UserProfile = {
          id: profile.id,
          display_name: profile.display_name,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
          is_organizer_pro: !!profile.is_organizer_pro,
          is_team_pro: !!(profile as any).is_team_pro,
          pro_expires_at: profile.pro_expires_at,
          team_pro_expires_at: (profile as any).team_pro_expires_at || null,
        };
        set({
          user: userProfile,
          isOrganizerPro: userProfile.is_organizer_pro,
          isTeamPro: userProfile.is_team_pro,
        });
        return userProfile;
      }
    } catch (err) {
      console.warn('Profile fetch warning (row may not exist yet):', err);
    }

    const fallbackProfile: UserProfile = {
      id: sessionUser.id,
      display_name:
        sessionUser.user_metadata?.full_name ||
        sessionUser.user_metadata?.display_name ||
        sessionUser.email?.split('@')[0] ||
        'Football Captain',
      phone: sessionUser.user_metadata?.phone || sessionUser.phone || null,
      avatar_url:
        sessionUser.user_metadata?.avatar_url ||
        sessionUser.user_metadata?.picture ||
        null,
      is_organizer_pro: false,
      is_team_pro: false,
      pro_expires_at: null,
      team_pro_expires_at: null,
    };

    try {
      await supabase.from('users').upsert({
        id: fallbackProfile.id,
        display_name: fallbackProfile.display_name,
        phone: fallbackProfile.phone,
        avatar_url: fallbackProfile.avatar_url,
        is_organizer_pro: false,
        is_team_pro: false,
        pro_expires_at: null,
        team_pro_expires_at: null,
      });
    } catch (upsertErr) {
      console.warn('Profile upsert warning:', upsertErr);
    }

    set({
      user: fallbackProfile,
      isOrganizerPro: false,
      isTeamPro: false,
    });
    return fallbackProfile;
  },

  initializeAuth: async () => {
    try {
      set({ isLoading: true });

      // Handle OAuth redirect params on Web if present (?code=... or #access_token=...)
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        try {
          const url = new URL(window.location.href);
          const code = url.searchParams.get('code');
          if (code) {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (!error && data?.session) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          } else if (window.location.hash) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const access_token = hashParams.get('access_token');
            const refresh_token = hashParams.get('refresh_token');
            if (access_token && refresh_token) {
              await supabase.auth.setSession({ access_token, refresh_token });
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }
        } catch (oauthErr) {
          console.warn('OAuth URL parse error:', oauthErr);
        }
      }

      // Check existing session
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        set({ session, isAuthenticated: true, isGuest: false });
        await get().syncUserProfile(session.user);
        await revenueCat.logIn(session.user.id);
      } else {
        // Stick to demo account if no explicit session
        const defaultDemo = DEMO_ACCOUNTS[0];
        set({
          user: {
            id: defaultDemo.id,
            display_name: defaultDemo.display_name,
            phone: defaultDemo.phone,
            avatar_url: defaultDemo.avatar_url,
            is_organizer_pro: defaultDemo.is_organizer_pro,
            is_team_pro: defaultDemo.is_team_pro,
            pro_expires_at: null,
            team_pro_expires_at: null,
            team_id: defaultDemo.team_id,
            team_name: defaultDemo.team_name,
            roleTitle: defaultDemo.roleTitle,
          },
          isAuthenticated: true,
          isGuest: false,
          isOrganizerPro: defaultDemo.is_organizer_pro,
          isTeamPro: defaultDemo.is_team_pro,
        });
      }

      // Ensure persistent Supabase auth listener is registered
      if (!(get() as any)._hasAuthListener) {
        set({ _hasAuthListener: true } as any);
        supabase.auth.onAuthStateChange(async (event, currentSession) => {
          if (currentSession?.user) {
            set({ session: currentSession, isAuthenticated: true, isGuest: false });
            await get().syncUserProfile(currentSession.user);
            await revenueCat.logIn(currentSession.user.id);
          } else if (event === 'SIGNED_OUT') {
            // Revert to demo mode
            get().switchDemoAccount(DEMO_ACCOUNTS[0].id);
          }
        });
      }
    } catch (error) {
      console.warn('initializeAuth error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
      await revenueCat.logOut();
      // Switch back to demo supporter account
      get().switchDemoAccount(DEMO_ACCOUNTS[1].id);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  },
}));
