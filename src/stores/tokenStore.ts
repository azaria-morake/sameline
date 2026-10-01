import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_BUNDLES, TokenBundle } from '../services/revenuecat';
import { NeedCategory, NeedStatus, TokenTxType, FundraisingPostType } from '../types/supabase';

export interface TeamNeed {
  id: string;
  team_id: string;
  title: string;
  description: string;
  target_tokens: number;
  current_tokens: number;
  status: NeedStatus;
  category: NeedCategory;
  tournament_id?: string | null;
  supporters_count: number;
  created_at: string;
}

export interface FundraisingPost {
  id: string;
  team_id: string;
  need_id?: string | null;
  need_title?: string;
  type: FundraisingPostType;
  message: string;
  tokens_amount: number;
  supporter_name: string;
  created_at: string;
}

export interface TokenTransaction {
  id: string;
  from_user_id?: string | null;
  from_team_id?: string | null;
  to_team_id?: string | null;
  to_need_id?: string | null;
  amount: number;
  type: TokenTxType;
  description: string;
  created_at: string;
}

interface TokenStoreState {
  // Wallets
  userWallets: Record<string, number>; // userId -> token balance
  teamWallets: Record<string, number>; // teamId -> token balance
  
  // Needs and timelines
  teamNeeds: TeamNeed[];
  fundraisingPosts: FundraisingPost[];
  transactions: TokenTransaction[];

  // Actions
  getUserBalance: (userId: string) => number;
  getTeamBalance: (teamId: string) => number;
  
  buyTokens: (userId: string, bundle: TokenBundle) => Promise<boolean>;
  
  supportNeed: (
    userId: string,
    supporterName: string,
    needId: string,
    tokens: number
  ) => { success: boolean; error?: string };

  createNeed: (
    teamId: string,
    data: {
      title: string;
      description?: string;
      target_tokens: number;
      category: NeedCategory;
      tournament_id?: string;
    }
  ) => { success: boolean; need?: TeamNeed; error?: string };

  markNeedFulfilled: (needId: string) => void;

  payTournamentEntryWithTokens: (
    teamId: string,
    tournamentId: string,
    tournamentTitle: string,
    entryFeeTokens: number
  ) => { success: boolean; error?: string };

  resetToDemoDefaults: () => void;
}

// Initial Demo Team Needs for DK XI
const DEFAULT_NEEDS: TeamNeed[] = [
  {
    id: 'need-1',
    team_id: 'dk-xi',
    title: 'Match Balls (2x FIFA Pro)',
    description: 'High quality match day balls for Katlehong league games and upcoming Top 8.',
    target_tokens: 50,
    current_tokens: 35,
    status: 'open',
    category: 'gear',
    supporters_count: 3,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'need-2',
    team_id: 'dk-xi',
    title: 'Katlehong Top 8 Cash Cup Entry',
    description: 'Entry fee for Katlehong Top 8 Cash Cup. Help DK XI qualify for the R25k prize!',
    target_tokens: 500,
    current_tokens: 280,
    status: 'open',
    category: 'entry_fee',
    tournament_id: 'katlehong-top-8',
    supporters_count: 7,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'need-3',
    team_id: 'dk-xi',
    title: 'Training Bibs & Cones',
    description: 'Complete training set for youth and senior practice sessions at Huntersfield Stadium.',
    target_tokens: 100,
    current_tokens: 100,
    status: 'funded',
    category: 'gear',
    supporters_count: 5,
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
];

const DEFAULT_POSTS: FundraisingPost[] = [
  {
    id: 'post-1',
    team_id: 'dk-xi',
    need_id: 'need-1',
    need_title: 'Match Balls (2x FIFA Pro)',
    type: 'support_received',
    message: 'Thabo Mokoena sent 20 tokens to Match Balls',
    tokens_amount: 20,
    supporter_name: 'Thabo Mokoena',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45m ago
  },
  {
    id: 'post-2',
    team_id: 'dk-xi',
    need_id: 'need-2',
    need_title: 'Katlehong Top 8 Cash Cup Entry',
    type: 'support_received',
    message: 'Gogo Gladys sent 50 tokens to Katlehong Top 8 Cash Cup Entry',
    tokens_amount: 50,
    supporter_name: 'Gogo Gladys',
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3h ago
  },
  {
    id: 'post-3',
    team_id: 'dk-xi',
    need_id: 'need-3',
    need_title: 'Training Bibs & Cones',
    type: 'milestone',
    message: '🎯 Milestone Reached! Training Bibs & Cones is 100% funded! Thank you kasi supporters!',
    tokens_amount: 100,
    supporter_name: 'SameLine Community',
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  },
  {
    id: 'post-4',
    team_id: 'dk-xi',
    need_id: 'need-1',
    need_title: 'Match Balls (2x FIFA Pro)',
    type: 'support_received',
    message: 'Kagiso Zulu sent 15 tokens to Match Balls',
    tokens_amount: 15,
    supporter_name: 'Kagiso Zulu',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

export const useTokenStore = create<TokenStoreState>()(
  persist(
    (set, get) => ({
      userWallets: {
        'demo-captain-sipho': 60,
        'demo-supporter-thabo': 220,
        'demo-organizer-jabu': 0,
      },
      teamWallets: {
        'dk-xi': 520, // 520 tokens ready in bank
        'vosloorus-fc': 150,
      },
      teamNeeds: DEFAULT_NEEDS,
      fundraisingPosts: DEFAULT_POSTS,
      transactions: [
        {
          id: 'tx-init-1',
          from_user_id: 'demo-supporter-thabo',
          to_team_id: 'dk-xi',
          to_need_id: 'need-1',
          amount: 20,
          type: 'support',
          description: 'Contribution to Match Balls',
          created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        },
        {
          id: 'tx-init-2',
          from_user_id: 'demo-supporter-thabo',
          amount: 150,
          type: 'purchase',
          description: 'Bought 150 Tokens bundle (R69)',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        },
      ],

      getUserBalance: (userId: string) => {
        return get().userWallets[userId] ?? 100; // default initial demo balance
      },

      getTeamBalance: (teamId: string) => {
        return get().teamWallets[teamId] ?? 0;
      },

      buyTokens: async (userId: string, bundle: TokenBundle) => {
        const current = get().userWallets[userId] ?? 0;
        const newBalance = current + bundle.tokens;

        const newTx: TokenTransaction = {
          id: `tx-${Date.now()}`,
          from_user_id: userId,
          amount: bundle.tokens,
          type: 'purchase',
          description: `Purchased ${bundle.label} (R${bundle.priceZar})`,
          created_at: new Date().toISOString(),
        };

        set((state) => ({
          userWallets: {
            ...state.userWallets,
            [userId]: newBalance,
          },
          transactions: [newTx, ...state.transactions],
        }));

        return true;
      },

      supportNeed: (userId: string, supporterName: string, needId: string, tokens: number) => {
        const userBalance = get().userWallets[userId] ?? 0;
        if (userBalance < tokens) {
          return { success: false, error: `Insufficient tokens. You have ${userBalance} tokens.` };
        }

        const need = get().teamNeeds.find((n) => n.id === needId);
        if (!need) {
          return { success: false, error: 'Need not found' };
        }

        const teamId = need.team_id;
        const currentTeamBalance = get().teamWallets[teamId] ?? 0;

        const updatedCurrent = need.current_tokens + tokens;
        const isFundedNow = updatedCurrent >= need.target_tokens;
        const newStatus: NeedStatus = isFundedNow ? 'funded' : need.status;

        const updatedNeeds = get().teamNeeds.map((n) => {
          if (n.id === needId) {
            return {
              ...n,
              current_tokens: updatedCurrent,
              status: newStatus,
              supporters_count: n.supporters_count + 1,
            };
          }
          return n;
        });

        // Add support post
        const newPost: FundraisingPost = {
          id: `post-${Date.now()}`,
          team_id: teamId,
          need_id: needId,
          need_title: need.title,
          type: 'support_received',
          message: `${supporterName} sent ${tokens} tokens to ${need.title}`,
          tokens_amount: tokens,
          supporter_name: supporterName,
          created_at: new Date().toISOString(),
        };

        const additionalPosts: FundraisingPost[] = [newPost];

        if (isFundedNow && need.status !== 'funded') {
          additionalPosts.unshift({
            id: `post-milestone-${Date.now()}`,
            team_id: teamId,
            need_id: needId,
            need_title: need.title,
            type: 'milestone',
            message: `🎉 Goal Reached! "${need.title}" is now 100% funded (${updatedCurrent}/${need.target_tokens} tokens)!`,
            tokens_amount: need.target_tokens,
            supporter_name: 'Community Goal',
            created_at: new Date(Date.now() + 500).toISOString(),
          });
        }

        const newTx: TokenTransaction = {
          id: `tx-${Date.now()}`,
          from_user_id: userId,
          to_team_id: teamId,
          to_need_id: needId,
          amount: tokens,
          type: 'support',
          description: `Supported ${need.title} with ${tokens} tokens`,
          created_at: new Date().toISOString(),
        };

        set((state) => ({
          userWallets: {
            ...state.userWallets,
            [userId]: userBalance - tokens,
          },
          teamWallets: {
            ...state.teamWallets,
            [teamId]: currentTeamBalance + tokens,
          },
          teamNeeds: updatedNeeds,
          fundraisingPosts: [...additionalPosts, ...state.fundraisingPosts],
          transactions: [newTx, ...state.transactions],
        }));

        return { success: true };
      },

      createNeed: (teamId, data) => {
        const newNeed: TeamNeed = {
          id: `need-${Date.now()}`,
          team_id: teamId,
          title: data.title,
          description: data.description || '',
          target_tokens: data.target_tokens,
          current_tokens: 0,
          status: 'open',
          category: data.category,
          tournament_id: data.tournament_id || null,
          supporters_count: 0,
          created_at: new Date().toISOString(),
        };

        const post: FundraisingPost = {
          id: `post-created-${Date.now()}`,
          team_id: teamId,
          need_id: newNeed.id,
          need_title: newNeed.title,
          type: 'need_created',
          message: `Team created a new need: "${newNeed.title}" (${newNeed.target_tokens} tokens target)`,
          tokens_amount: newNeed.target_tokens,
          supporter_name: 'Team Captain',
          created_at: new Date().toISOString(),
        };

        set((state) => ({
          teamNeeds: [newNeed, ...state.teamNeeds],
          fundraisingPosts: [post, ...state.fundraisingPosts],
        }));

        return { success: true, need: newNeed };
      },

      markNeedFulfilled: (needId: string) => {
        set((state) => ({
          teamNeeds: state.teamNeeds.map((n) =>
            n.id === needId ? { ...n, status: 'fulfilled' as NeedStatus } : n
          ),
        }));
      },

      payTournamentEntryWithTokens: (teamId, tournamentId, tournamentTitle, entryFeeTokens) => {
        const teamBalance = get().teamWallets[teamId] ?? 0;
        if (teamBalance < entryFeeTokens) {
          return {
            success: false,
            error: `Team wallet has ${teamBalance} tokens, but entry fee requires ${entryFeeTokens} tokens.`,
          };
        }

        const newTx: TokenTransaction = {
          id: `tx-entry-${Date.now()}`,
          from_team_id: teamId,
          amount: entryFeeTokens,
          type: 'spend_entry',
          description: `Entry fee paid for ${tournamentTitle} (${entryFeeTokens} tokens)`,
          created_at: new Date().toISOString(),
        };

        const post: FundraisingPost = {
          id: `post-entry-${Date.now()}`,
          team_id: teamId,
          type: 'milestone',
          message: `🏆 Team used ${entryFeeTokens} tokens to enter ${tournamentTitle}! Powered by community supporters.`,
          tokens_amount: entryFeeTokens,
          supporter_name: 'Team Bank',
          created_at: new Date().toISOString(),
        };

        set((state) => ({
          teamWallets: {
            ...state.teamWallets,
            [teamId]: teamBalance - entryFeeTokens,
          },
          fundraisingPosts: [post, ...state.fundraisingPosts],
          transactions: [newTx, ...state.transactions],
        }));

        return { success: true };
      },

      resetToDemoDefaults: () => {
        set({
          userWallets: {
            'demo-captain-sipho': 60,
            'demo-supporter-thabo': 220,
            'demo-organizer-jabu': 0,
          },
          teamWallets: {
            'dk-xi': 520,
            'vosloorus-fc': 150,
          },
          teamNeeds: DEFAULT_NEEDS,
          fundraisingPosts: DEFAULT_POSTS,
        });
      },
    }),
    {
      name: 'sameline-token-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
