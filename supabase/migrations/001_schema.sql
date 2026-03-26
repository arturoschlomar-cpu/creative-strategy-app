-- ============================================================
-- Creative Strategy App — Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- -------------------------
-- STORAGE BUCKET
-- -------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('ads', 'ads', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload ads"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can read ads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ads');

CREATE POLICY "Owners can delete ads"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'ads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- -------------------------
-- PRODUCTS
-- -------------------------
CREATE TABLE IF NOT EXISTS products (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  benefits    TEXT[] DEFAULT '{}',
  features    TEXT[] DEFAULT '{}',
  target_audience TEXT,
  usp         TEXT,
  website_url TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own products"
  ON products FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- -------------------------
-- ADS
-- -------------------------
CREATE TABLE IF NOT EXISTS ads (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title        TEXT NOT NULL,
  file_url     TEXT,
  file_type    TEXT,     -- 'video' | 'image'
  file_path    TEXT,     -- supabase storage path
  thumbnail_url TEXT,
  platform     TEXT DEFAULT 'meta',
  label        TEXT DEFAULT 'neutral',   -- 'winner' | 'loser' | 'neutral'
  status       TEXT DEFAULT 'pending',  -- 'pending' | 'analyzing' | 'analyzed' | 'failed'
  metrics      JSONB DEFAULT '{}',
  product_id   UUID REFERENCES products(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own ads"
  ON ads FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- -------------------------
-- AD ANALYSES
-- -------------------------
CREATE TABLE IF NOT EXISTS ad_analyses (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id          UUID REFERENCES ads(id) ON DELETE CASCADE NOT NULL,
  analysis_type  TEXT DEFAULT 'full',
  content        JSONB NOT NULL,
  model_used     TEXT DEFAULT 'gemini-1.5-flash',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ad_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read analyses of own ads"
  ON ad_analyses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ads WHERE ads.id = ad_analyses.ad_id AND ads.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert analyses"
  ON ad_analyses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ads WHERE ads.id = ad_analyses.ad_id AND ads.user_id = auth.uid()
    )
  );

-- -------------------------
-- BUILDING BLOCKS
-- -------------------------
CREATE TABLE IF NOT EXISTS building_blocks (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ad_id      UUID REFERENCES ads(id) ON DELETE SET NULL,
  type       TEXT NOT NULL,    -- 'hook' | 'angle' | 'benefit' | 'social_proof' | 'cta'
  content    TEXT NOT NULL,
  metadata   JSONB DEFAULT '{}',
  status     TEXT DEFAULT 'testing', -- 'testing' | 'validated' | 'failed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE building_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own building blocks"
  ON building_blocks FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- -------------------------
-- SCRIPTS
-- -------------------------
CREATE TABLE IF NOT EXISTS scripts (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ad_analysis_id   UUID REFERENCES ad_analyses(id) ON DELETE SET NULL,
  ad_id            UUID REFERENCES ads(id) ON DELETE SET NULL,
  title            TEXT,
  content          JSONB NOT NULL,
  platform         TEXT DEFAULT 'meta',
  status           TEXT DEFAULT 'draft',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own scripts"
  ON scripts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- -------------------------
-- BRIEFS
-- -------------------------
CREATE TABLE IF NOT EXISTS briefs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  script_id   UUID REFERENCES scripts(id) ON DELETE SET NULL,
  title       TEXT,
  content     JSONB NOT NULL,
  status      TEXT DEFAULT 'draft',  -- 'draft' | 'active' | 'completed'
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own briefs"
  ON briefs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- -------------------------
-- CHAT MESSAGES
-- -------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id  TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  role        TEXT NOT NULL,   -- 'user' | 'assistant'
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own chat messages"
  ON chat_messages FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- -------------------------
-- UPDATED_AT TRIGGER
-- -------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON ads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_building_blocks_updated_at BEFORE UPDATE ON building_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scripts_updated_at BEFORE UPDATE ON scripts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_briefs_updated_at BEFORE UPDATE ON briefs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
