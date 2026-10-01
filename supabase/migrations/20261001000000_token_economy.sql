-- Migration: Token Economy & Team Pro (Community Bank)
-- Migration timestamp: 20261001000000_token_economy.sql

-- 1. Extend enums and user/team attributes
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_team_pro BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS team_pro_expires_at TIMESTAMPTZ;

ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS is_team_pro BOOLEAN NOT NULL DEFAULT false;

-- Add paid_tokens to tournament_team_status if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'tournament_team_status' AND e.enumlabel = 'paid_tokens'
  ) THEN
    ALTER TYPE tournament_team_status ADD VALUE 'paid_tokens';
  END IF;
END$$;

-- 2. Token Wallets Table
CREATE TABLE IF NOT EXISTS public.token_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  balance INT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_wallet_owner CHECK (
    (user_id IS NOT NULL AND team_id IS NULL) OR
    (user_id IS NULL AND team_id IS NOT NULL)
  ),
  CONSTRAINT uq_user_wallet UNIQUE (user_id),
  CONSTRAINT uq_team_wallet UNIQUE (team_id)
);

-- 3. Team Needs Table (ONLY Team Pro teams can create)
CREATE TYPE need_status AS ENUM ('open', 'funded', 'fulfilled');
CREATE TYPE need_category AS ENUM ('gear', 'entry_fee', 'transport', 'other');

CREATE TABLE IF NOT EXISTS public.team_needs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_tokens INT NOT NULL CHECK (target_tokens > 0),
  current_tokens INT NOT NULL DEFAULT 0 CHECK (current_tokens >= 0),
  status need_status NOT NULL DEFAULT 'open',
  category need_category NOT NULL DEFAULT 'gear',
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE SET NULL,
  supporters_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Token Transactions Table
CREATE TYPE token_tx_type AS ENUM ('purchase', 'support', 'spend_entry', 'refund');

CREATE TABLE IF NOT EXISTS public.token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  from_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  to_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  to_need_id UUID REFERENCES public.team_needs(id) ON DELETE SET NULL,
  amount INT NOT NULL CHECK (amount > 0),
  type token_tx_type NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Fundraising Timeline Posts
CREATE TYPE fundraising_post_type AS ENUM ('need_created', 'support_received', 'milestone');

CREATE TABLE IF NOT EXISTS public.fundraising_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  need_id UUID REFERENCES public.team_needs(id) ON DELETE SET NULL,
  type fundraising_post_type NOT NULL DEFAULT 'support_received',
  message TEXT NOT NULL,
  tokens_amount INT DEFAULT 0,
  supporter_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_token_wallets_user ON public.token_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_token_wallets_team ON public.token_wallets(team_id);
CREATE INDEX IF NOT EXISTS idx_team_needs_team ON public.team_needs(team_id);
CREATE INDEX IF NOT EXISTS idx_team_needs_status ON public.team_needs(status);
CREATE INDEX IF NOT EXISTS idx_token_tx_user ON public.token_transactions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_token_tx_team ON public.token_transactions(to_team_id);
CREATE INDEX IF NOT EXISTS idx_fundraising_posts_team ON public.fundraising_posts(team_id);

-- Helper function: is_team_pro
CREATE OR REPLACE FUNCTION public.is_team_pro(team_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_team_pro FROM public.teams WHERE id = team_id),
    false
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- RLS Policies
ALTER TABLE public.token_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fundraising_posts ENABLE ROW LEVEL SECURITY;

-- token_wallets: anyone can see team balances, users can see their own balance
CREATE POLICY "Team wallets viewable by all" ON public.token_wallets
  FOR SELECT USING (team_id IS NOT NULL OR auth.uid() = user_id);

CREATE POLICY "Users can update own wallet" ON public.token_wallets
  FOR UPDATE USING (auth.uid() = user_id);

-- team_needs: viewable by all
CREATE POLICY "Team needs are viewable by everyone" ON public.team_needs
  FOR SELECT USING (true);

-- Only captain of Team Pro team can create needs
CREATE POLICY "Captains of Team Pro can create needs" ON public.team_needs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = team_id 
        AND captain_id = auth.uid()
        AND (is_team_pro = true OR (SELECT is_team_pro FROM public.users WHERE id = auth.uid()) = true)
    )
  );

CREATE POLICY "Captains can update own needs" ON public.team_needs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = team_id AND captain_id = auth.uid()
    )
  );

-- token_transactions: visible to participants
CREATE POLICY "Token transactions visible to participants" ON public.token_transactions
  FOR SELECT USING (
    auth.uid() = from_user_id OR
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE captain_id = auth.uid() AND (id = from_team_id OR id = to_team_id)
    )
  );

CREATE POLICY "Users can insert transactions" ON public.token_transactions
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- fundraising_posts: viewable by all
CREATE POLICY "Fundraising posts are viewable by everyone" ON public.fundraising_posts
  FOR SELECT USING (true);

CREATE POLICY "Captains or system can insert posts" ON public.fundraising_posts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = team_id AND captain_id = auth.uid()
    ) OR auth.uid() IS NOT NULL
  );
