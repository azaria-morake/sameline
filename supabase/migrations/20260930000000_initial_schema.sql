-- SameLine Initial Schema Migration
-- PostGIS and UUID Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Custom Enums
CREATE TYPE tournament_status AS ENUM ('draft', 'open', 'closed', 'live', 'completed');
CREATE TYPE tournament_team_status AS ENUM ('pending', 'approved', 'rejected', 'paid_cash');
CREATE TYPE fixture_status AS ENUM ('scheduled', 'live', 'completed');

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  is_organizer_pro BOOLEAN NOT NULL DEFAULT false,
  pro_expires_at TIMESTAMPTZ,
  location GEOGRAPHY(Point, 4326),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. TEAMS TABLE
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  captain_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  logo_url TEXT,
  location_text TEXT NOT NULL DEFAULT 'Katlehong',
  location GEOGRAPHY(Point, 4326),
  bio TEXT,
  stats JSONB NOT NULL DEFAULT '{"played": 0, "wins": 0, "finals": 0, "titles": 0}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. TOURNAMENTS TABLE
CREATE TABLE IF NOT EXISTS public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location_text TEXT NOT NULL,
  location GEOGRAPHY(Point, 4326) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  entry_fee INT NOT NULL DEFAULT 0, -- ZAR integer for v1
  max_teams INT NOT NULL DEFAULT 16,
  team_count INT NOT NULL DEFAULT 0,
  status tournament_status NOT NULL DEFAULT 'open',
  prize_pool_text TEXT,
  contact_whatsapp TEXT NOT NULL,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. TOURNAMENT_TEAMS TABLE (Join Table)
CREATE TABLE IF NOT EXISTS public.tournament_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  status tournament_team_status NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_tournament_team UNIQUE (tournament_id, team_id)
);

-- 5. FIXTURES TABLE
CREATE TABLE IF NOT EXISTS public.fixtures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round TEXT NOT NULL DEFAULT 'Round 1', -- e.g., 'Group Stage', 'Quarter Final', 'Semi Final', 'Final'
  team_a_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  team_b_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  team_a_score INT,
  team_b_score INT,
  status fixture_status NOT NULL DEFAULT 'scheduled',
  pitch_number INT,
  kickoff_time TIMESTAMPTZ,
  winner_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. PLAYERS TABLE (v1 minimal)
CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  position TEXT NOT NULL DEFAULT 'Player',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- SPATIAL & PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_tournaments_location ON public.tournaments USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_tournaments_start_date ON public.tournaments (start_date);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments (status);
CREATE INDEX IF NOT EXISTS idx_teams_location ON public.teams USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_tournament_teams_tourn_id ON public.tournament_teams (tournament_id);
CREATE INDEX IF NOT EXISTS idx_fixtures_tourn_id ON public.fixtures (tournament_id);

-- HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.is_organizer_pro(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT is_organizer_pro FROM public.users WHERE id = user_id), false);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- PostGIS Nearby Tournaments RPC
CREATE OR REPLACE FUNCTION public.nearby_tournaments(
  lat FLOAT,
  lng FLOAT,
  radius_m INT DEFAULT 25000,
  filter_status TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  organizer_id UUID,
  title TEXT,
  description TEXT,
  location_text TEXT,
  start_date DATE,
  end_date DATE,
  entry_fee INT,
  max_teams INT,
  team_count INT,
  status tournament_status,
  prize_pool_text TEXT,
  contact_whatsapp TEXT,
  is_featured BOOLEAN,
  distance_m FLOAT,
  organizer_name TEXT,
  organizer_avatar TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.organizer_id,
    t.title,
    t.description,
    t.location_text,
    t.start_date,
    t.end_date,
    t.entry_fee,
    t.max_teams,
    t.team_count,
    t.status,
    t.prize_pool_text,
    t.contact_whatsapp,
    t.is_featured,
    ST_Distance(t.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) AS distance_m,
    COALESCE(u.display_name, 'Organizer') AS organizer_name,
    u.avatar_url AS organizer_avatar
  FROM public.tournaments t
  LEFT JOIN public.users u ON t.organizer_id = u.id
  WHERE ST_DWithin(t.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, radius_m)
    AND (filter_status IS NULL OR t.status::text = filter_status)
  ORDER BY 
    t.is_featured DESC,
    t.start_date ASC,
    ST_Distance(t.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger: Safely increment team_count with row lock to prevent race conditions on max_teams
CREATE OR REPLACE FUNCTION public.handle_tournament_team_approval()
RETURNS TRIGGER AS $$
DECLARE
  v_max_teams INT;
  v_current_count INT;
BEGIN
  IF (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved')) THEN
    -- Lock tournament row
    SELECT max_teams, team_count INTO v_max_teams, v_current_count
    FROM public.tournaments
    WHERE id = NEW.tournament_id
    FOR UPDATE;

    IF v_current_count >= v_max_teams THEN
      RAISE EXCEPTION 'Tournament is already full (%/%)', v_current_count, v_max_teams;
    END IF;

    UPDATE public.tournaments
    SET 
      team_count = team_count + 1,
      status = CASE WHEN team_count + 1 >= max_teams THEN 'closed'::tournament_status ELSE status END
    WHERE id = NEW.tournament_id;
  ELSIF (OLD.status = 'approved' AND NEW.status != 'approved') THEN
    UPDATE public.tournaments
    SET 
      team_count = GREATEST(0, team_count - 1),
      status = CASE WHEN status = 'closed' THEN 'open'::tournament_status ELSE status END
    WHERE id = NEW.tournament_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tournament_team_approval ON public.tournament_teams;
CREATE TRIGGER trg_tournament_team_approval
AFTER INSERT OR UPDATE OF status ON public.tournament_teams
FOR EACH ROW EXECUTE FUNCTION public.handle_tournament_team_approval();

-- Trigger: Update team stats when a fixture is completed
CREATE OR REPLACE FUNCTION public.handle_fixture_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed')) THEN
    -- Team A played
    IF NEW.team_a_id IS NOT NULL THEN
      UPDATE public.teams
      SET stats = jsonb_set(
        stats, 
        '{played}', 
        to_jsonb(COALESCE((stats->>'played')::int, 0) + 1)
      )
      WHERE id = NEW.team_a_id;
    END IF;

    -- Team B played
    IF NEW.team_b_id IS NOT NULL THEN
      UPDATE public.teams
      SET stats = jsonb_set(
        stats, 
        '{played}', 
        to_jsonb(COALESCE((stats->>'played')::int, 0) + 1)
      )
      WHERE id = NEW.team_b_id;
    END IF;

    -- Winner stats
    IF NEW.winner_team_id IS NOT NULL THEN
      UPDATE public.teams
      SET stats = jsonb_set(
        stats, 
        '{wins}', 
        to_jsonb(COALESCE((stats->>'wins')::int, 0) + 1)
      )
      WHERE id = NEW.winner_team_id;

      -- If it's a Final round, increment titles for winner
      IF LOWER(NEW.round) LIKE '%final%' AND LOWER(NEW.round) NOT LIKE '%quarter%' AND LOWER(NEW.round) NOT LIKE '%semi%' THEN
        UPDATE public.teams
        SET stats = jsonb_set(
          stats, 
          '{titles}', 
          to_jsonb(COALESCE((stats->>'titles')::int, 0) + 1)
        )
        WHERE id = NEW.winner_team_id;

        -- Non-winning finalist gets a final counted
        IF NEW.team_a_id IS NOT NULL AND NEW.team_a_id != NEW.winner_team_id THEN
          UPDATE public.teams
          SET stats = jsonb_set(
            stats, 
            '{finals}', 
            to_jsonb(COALESCE((stats->>'finals')::int, 0) + 1)
          )
          WHERE id = NEW.team_a_id;
        ELSIF NEW.team_b_id IS NOT NULL AND NEW.team_b_id != NEW.winner_team_id THEN
          UPDATE public.teams
          SET stats = jsonb_set(
            stats, 
            '{finals}', 
            to_jsonb(COALESCE((stats->>'finals')::int, 0) + 1)
          )
          WHERE id = NEW.team_b_id;
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fixture_completion ON public.fixtures;
CREATE TRIGGER trg_fixture_completion
AFTER UPDATE OF status, winner_team_id ON public.fixtures
FOR EACH ROW EXECUTE FUNCTION public.handle_fixture_completion();

-- POPIA Compliance: Delete User and cascade or anonymize
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS VOID AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete user record (cascades where appropriate)
  DELETE FROM public.users WHERE id = v_user_id;
  DELETE FROM auth.users WHERE id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- USERS POLICIES
CREATE POLICY "Users are viewable by everyone" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- TEAMS POLICIES
CREATE POLICY "Teams are viewable by everyone" ON public.teams
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create teams" ON public.teams
  FOR INSERT WITH CHECK (auth.uid() = captain_id);

CREATE POLICY "Captains can update own teams" ON public.teams
  FOR UPDATE USING (auth.uid() = captain_id);

-- TOURNAMENTS POLICIES
CREATE POLICY "Tournaments are viewable by everyone" ON public.tournaments
  FOR SELECT USING (true);

-- Organizer rule: 1 active tournament free, >1 requires is_organizer_pro
CREATE POLICY "Organizers can create tournaments if pro or first is free" ON public.tournaments
  FOR INSERT WITH CHECK (
    auth.uid() = organizer_id AND (
      public.is_organizer_pro(auth.uid()) OR (
        SELECT COUNT(*) FROM public.tournaments 
        WHERE organizer_id = auth.uid() AND status IN ('open', 'live')
      ) < 1
    )
  );

CREATE POLICY "Organizers can update own tournaments" ON public.tournaments
  FOR UPDATE USING (auth.uid() = organizer_id);

-- TOURNAMENT_TEAMS POLICIES
CREATE POLICY "Tournament teams are viewable by everyone" ON public.tournament_teams
  FOR SELECT USING (true);

CREATE POLICY "Team captains can request to join tournaments" ON public.tournament_teams
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = team_id AND captain_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can manage tournament team requests" ON public.tournament_teams
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.tournaments
      WHERE id = tournament_id AND organizer_id = auth.uid()
    )
  );

-- FIXTURES POLICIES
CREATE POLICY "Fixtures are viewable by everyone" ON public.fixtures
  FOR SELECT USING (true);

CREATE POLICY "Organizers can create and update fixtures" ON public.fixtures
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.tournaments
      WHERE id = tournament_id AND organizer_id = auth.uid()
    )
  );

-- PLAYERS POLICIES
CREATE POLICY "Players are viewable by everyone" ON public.players
  FOR SELECT USING (true);

CREATE POLICY "Team captain can manage squad" ON public.players
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE id = team_id AND captain_id = auth.uid()
    )
  );
