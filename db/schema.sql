-- ============================================================================
-- MCPIC PostgreSQL Schema with Row Level Security (RLS)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- Custom enums
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('member', 'admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
    CREATE TYPE application_status AS ENUM ('pending', 'recruited', 'rejected');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'token_purpose') THEN
    CREATE TYPE token_purpose AS ENUM ('email_verify', 'password_reset');
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- Updated-at trigger helper
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- RLS helper functions reading per-transaction session context
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app_user_id() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')::UUID;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_user_role() RETURNS TEXT AS $$
  SELECT COALESCE(NULLIF(current_setting('app.user_role', true), ''), 'anonymous');
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_is_admin() RETURNS BOOLEAN AS $$
  SELECT app_user_role() IN ('admin', 'system');
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_is_system() RETURNS BOOLEAN AS $$
  SELECT app_user_role() = 'system';
$$ LANGUAGE sql STABLE;

-- ----------------------------------------------------------------------------
-- 1. Users
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL DEFAULT '/images/blank.webp',
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'member',
  designation TEXT NOT NULL DEFAULT 'member',
  email_verified_at TIMESTAMPTZ,
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_secret_enc TEXT,
  mfa_recovery_hashes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  token_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_email_lowercase CHECK (email = LOWER(email))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 2. Events
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT events_valid_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_events_created_at ON events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events (slug);

DROP TRIGGER IF EXISTS trg_events_updated_at ON events;
CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. Event Segments (properly linked via FK event_id with ON DELETE CASCADE)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT segments_valid_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_segments_event_id ON segments (event_id);

DROP TRIGGER IF EXISTS trg_segments_updated_at ON segments;
CREATE TRIGGER trg_segments_updated_at
  BEFORE UPDATE ON segments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. Blogs / Posts
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  publisher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  publisher_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON blogs (created_at DESC);

DROP TRIGGER IF EXISTS trg_blogs_updated_at ON blogs;
CREATE TRIGGER trg_blogs_updated_at
  BEFORE UPDATE ON blogs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 5. Executive Recruitment Applications (one active form per user)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS executive_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  why_executive TEXT NOT NULL,
  hours_per_week TEXT NOT NULL,
  tech_skills TEXT NOT NULL,
  experience TEXT NOT NULL,
  leadership_rating TEXT NOT NULL,
  github_profile TEXT NOT NULL,
  awards TEXT NOT NULL,
  status application_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exec_apps_user_id ON executive_applications (user_id);
CREATE INDEX IF NOT EXISTS idx_exec_apps_created_at ON executive_applications (created_at DESC);

DROP TRIGGER IF EXISTS trg_exec_apps_updated_at ON executive_applications;
CREATE TRIGGER trg_exec_apps_updated_at
  BEFORE UPDATE ON executive_applications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 6. Site Settings (e.g., recruitment toggle)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_site_settings_updated_at ON site_settings;
CREATE TRIGGER trg_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO site_settings (key, value)
VALUES ('recruitment', '{"enabled": false}'::JSONB)
ON CONFLICT (key) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 7. Hashed Verification & Password Reset Tokens
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose token_purpose NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verif_tokens_hash ON verification_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_verif_tokens_user ON verification_tokens (user_id, purpose);

-- ----------------------------------------------------------------------------
-- 8. Contact Messages
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 9. Security Audit Logs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);

-- ----------------------------------------------------------------------------
-- Tier 1 Schema Extensions (Idempotent ALTERs + New Tables)
-- ----------------------------------------------------------------------------

-- 10. Blog slugs for shareable /posts/[slug] permalinks
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS slug TEXT;
UPDATE blogs
SET slug = LOWER(REGEXP_REPLACE(TRIM(title), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || SUBSTRING(id::TEXT, 1, 6)
WHERE slug IS NULL OR slug = '';
CREATE UNIQUE INDEX IF NOT EXISTS idx_blogs_slug ON blogs (slug);

-- 11. Contact message workflow status (unread | read | resolved)
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'unread';
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_status_check'
  ) THEN
    ALTER TABLE contact_messages
      ADD CONSTRAINT contact_messages_status_check
      CHECK (status IN ('unread', 'read', 'resolved'));
  END IF;
END $$;

-- 12. Segment registration settings
ALTER TABLE segments ADD COLUMN IF NOT EXISTS registration_open BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE segments ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMPTZ;
ALTER TABLE segments ADD COLUMN IF NOT EXISTS max_participants INTEGER;
ALTER TABLE segments ADD COLUMN IF NOT EXISTS is_team_based BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE segments ADD COLUMN IF NOT EXISTS max_team_size INTEGER NOT NULL DEFAULT 1;

-- 13. Segment Registrations
CREATE TABLE IF NOT EXISTS segment_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_code TEXT NOT NULL UNIQUE,
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  participant_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  institution TEXT NOT NULL,
  class_grade TEXT NOT NULL,
  team_name TEXT,
  team_members TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT seg_reg_email_lowercase CHECK (email = LOWER(email))
);

CREATE INDEX IF NOT EXISTS idx_seg_reg_segment_id ON segment_registrations (segment_id);
CREATE INDEX IF NOT EXISTS idx_seg_reg_user_id ON segment_registrations (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_seg_reg_unique_confirmed
  ON segment_registrations (segment_id, email)
  WHERE status = 'confirmed';

DROP TRIGGER IF EXISTS trg_seg_reg_updated_at ON segment_registrations;
CREATE TRIGGER trg_seg_reg_updated_at
  BEFORE UPDATE ON segment_registrations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 14. Database-driven Executive Committee Members
CREATE TABLE IF NOT EXISTS executive_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  panel_year TEXT NOT NULL,
  name TEXT NOT NULL,
  post TEXT NOT NULL,
  image_url TEXT NOT NULL DEFAULT '/images/blank.webp',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exec_members_year_order
  ON executive_members (panel_year DESC, display_order ASC, created_at ASC);

DROP TRIGGER IF EXISTS trg_exec_members_updated_at ON executive_members;
CREATE TRIGGER trg_exec_members_updated_at
  BEFORE UPDATE ON executive_members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 15. Database-driven Achievements Gallery
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  tag TEXT NOT NULL,
  image_url TEXT NOT NULL,
  year TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_achievements_order
  ON achievements (display_order ASC, created_at DESC);

DROP TRIGGER IF EXISTS trg_achievements_updated_at ON achievements;
CREATE TRIGGER trg_achievements_updated_at
  BEFORE UPDATE ON achievements
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enforced at the PostgreSQL engine level for `mcpic_app`
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE events FORCE ROW LEVEL SECURITY;

ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments FORCE ROW LEVEL SECURITY;

ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs FORCE ROW LEVEL SECURITY;

ALTER TABLE executive_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_applications FORCE ROW LEVEL SECURITY;

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings FORCE ROW LEVEL SECURITY;

ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_tokens FORCE ROW LEVEL SECURITY;

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages FORCE ROW LEVEL SECURITY;

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

-- Users policies: users see/update only themselves; admins/system see all; only system registers new accounts
DROP POLICY IF EXISTS users_select_policy ON users;
CREATE POLICY users_select_policy ON users
  FOR SELECT USING (app_is_admin() OR id = app_user_id());

DROP POLICY IF EXISTS users_insert_policy ON users;
CREATE POLICY users_insert_policy ON users
  FOR INSERT WITH CHECK (app_is_system());

DROP POLICY IF EXISTS users_update_policy ON users;
CREATE POLICY users_update_policy ON users
  FOR UPDATE
  USING (app_is_admin() OR id = app_user_id())
  WITH CHECK (app_is_admin() OR id = app_user_id());

DROP POLICY IF EXISTS users_delete_policy ON users;
CREATE POLICY users_delete_policy ON users
  FOR DELETE USING (app_is_admin());

-- Events policies: public read, admin write
DROP POLICY IF EXISTS events_select_policy ON events;
CREATE POLICY events_select_policy ON events
  FOR SELECT USING (true);

DROP POLICY IF EXISTS events_write_policy ON events;
CREATE POLICY events_write_policy ON events
  FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

-- Segments policies: public read, admin write
DROP POLICY IF EXISTS segments_select_policy ON segments;
CREATE POLICY segments_select_policy ON segments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS segments_write_policy ON segments;
CREATE POLICY segments_write_policy ON segments
  FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

-- Blogs policies: public read, admin write
DROP POLICY IF EXISTS blogs_select_policy ON blogs;
CREATE POLICY blogs_select_policy ON blogs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS blogs_write_policy ON blogs;
CREATE POLICY blogs_write_policy ON blogs
  FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

-- Executive applications: strict BOLA enforcement (owner or admin only)
DROP POLICY IF EXISTS exec_apps_select_policy ON executive_applications;
CREATE POLICY exec_apps_select_policy ON executive_applications
  FOR SELECT USING (app_is_admin() OR user_id = app_user_id());

DROP POLICY IF EXISTS exec_apps_insert_policy ON executive_applications;
CREATE POLICY exec_apps_insert_policy ON executive_applications
  FOR INSERT WITH CHECK (user_id = app_user_id());

DROP POLICY IF EXISTS exec_apps_update_policy ON executive_applications;
CREATE POLICY exec_apps_update_policy ON executive_applications
  FOR UPDATE
  USING (app_is_admin() OR user_id = app_user_id())
  WITH CHECK (app_is_admin() OR user_id = app_user_id());

DROP POLICY IF EXISTS exec_apps_delete_policy ON executive_applications;
CREATE POLICY exec_apps_delete_policy ON executive_applications
  FOR DELETE USING (app_is_admin());

-- Site settings: public read, admin write
DROP POLICY IF EXISTS site_settings_select_policy ON site_settings;
CREATE POLICY site_settings_select_policy ON site_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS site_settings_write_policy ON site_settings;
CREATE POLICY site_settings_write_policy ON site_settings
  FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

-- Verification tokens: system context only
DROP POLICY IF EXISTS verification_tokens_policy ON verification_tokens;
CREATE POLICY verification_tokens_policy ON verification_tokens
  FOR ALL USING (app_is_system()) WITH CHECK (app_is_system());

-- Contact messages: anyone can submit, only admins can read/update/delete
DROP POLICY IF EXISTS contact_messages_insert_policy ON contact_messages;
CREATE POLICY contact_messages_insert_policy ON contact_messages
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS contact_messages_select_policy ON contact_messages;
CREATE POLICY contact_messages_select_policy ON contact_messages
  FOR SELECT USING (app_is_admin());

DROP POLICY IF EXISTS contact_messages_update_policy ON contact_messages;
CREATE POLICY contact_messages_update_policy ON contact_messages
  FOR UPDATE USING (app_is_admin()) WITH CHECK (app_is_admin());

DROP POLICY IF EXISTS contact_messages_delete_policy ON contact_messages;
CREATE POLICY contact_messages_delete_policy ON contact_messages
  FOR DELETE USING (app_is_admin());

-- Audit logs: append-only for authenticated/system, admin read only
DROP POLICY IF EXISTS audit_logs_insert_policy ON audit_logs;
CREATE POLICY audit_logs_insert_policy ON audit_logs
  FOR INSERT WITH CHECK (app_is_system() OR app_user_id() IS NOT NULL);

DROP POLICY IF EXISTS audit_logs_select_policy ON audit_logs;
CREATE POLICY audit_logs_select_policy ON audit_logs
  FOR SELECT USING (app_is_admin());

-- Segment registrations RLS: anyone can register (API validates deadline/capacity),
-- owners see/cancel their own, admins manage all
ALTER TABLE segment_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_registrations FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS seg_reg_insert_policy ON segment_registrations;
CREATE POLICY seg_reg_insert_policy ON segment_registrations
  FOR INSERT WITH CHECK (user_id IS NULL OR user_id = app_user_id() OR app_is_admin());

DROP POLICY IF EXISTS seg_reg_select_policy ON segment_registrations;
CREATE POLICY seg_reg_select_policy ON segment_registrations
  FOR SELECT USING (app_is_admin() OR (app_user_id() IS NOT NULL AND user_id = app_user_id()));

DROP POLICY IF EXISTS seg_reg_update_policy ON segment_registrations;
CREATE POLICY seg_reg_update_policy ON segment_registrations
  FOR UPDATE
  USING (app_is_admin() OR (app_user_id() IS NOT NULL AND user_id = app_user_id()))
  WITH CHECK (app_is_admin() OR (app_user_id() IS NOT NULL AND user_id = app_user_id()));

DROP POLICY IF EXISTS seg_reg_delete_policy ON segment_registrations;
CREATE POLICY seg_reg_delete_policy ON segment_registrations
  FOR DELETE USING (app_is_admin() OR (app_user_id() IS NOT NULL AND user_id = app_user_id()));

-- Executive members RLS: public read, admin write
ALTER TABLE executive_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_members FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS exec_members_select_policy ON executive_members;
CREATE POLICY exec_members_select_policy ON executive_members
  FOR SELECT USING (true);

DROP POLICY IF EXISTS exec_members_write_policy ON executive_members;
CREATE POLICY exec_members_write_policy ON executive_members
  FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

-- Achievements RLS: public read, admin write
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS achievements_select_policy ON achievements;
CREATE POLICY achievements_select_policy ON achievements
  FOR SELECT USING (true);

DROP POLICY IF EXISTS achievements_write_policy ON achievements;
CREATE POLICY achievements_write_policy ON achievements
  FOR ALL USING (app_is_admin()) WITH CHECK (app_is_admin());

-- ----------------------------------------------------------------------------
-- 16. Role-Aware Notifications & Per-User Read Receipts (Forced RLS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audience TEXT NOT NULL CHECK (audience IN ('all', 'members', 'admins', 'user')),
  target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (
    category IN (
      'event',
      'post',
      'recruitment',
      'message',
      'application',
      'registration',
      'member',
      'announcement',
      'security'
    )
  ),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT NOT NULL DEFAULT '/',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT notifications_user_target_check CHECK (
    audience <> 'user' OR target_user_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_notifications_audience_created
  ON notifications (audience, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_target_user
  ON notifications (target_user_id, created_at DESC)
  WHERE target_user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS notification_reads (
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (notification_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_reads_user
  ON notification_reads (user_id, read_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_select_policy ON notifications;
CREATE POLICY notifications_select_policy ON notifications
  FOR SELECT USING (
    app_is_system()
    OR (
      app_user_id() IS NOT NULL
      AND (
        audience = 'all'
        OR (audience = 'admins' AND app_user_role() = 'admin')
        OR (audience = 'members' AND app_user_role() = 'member')
        OR (audience = 'user' AND target_user_id = app_user_id())
      )
    )
  );

DROP POLICY IF EXISTS notifications_insert_policy ON notifications;
CREATE POLICY notifications_insert_policy ON notifications
  FOR INSERT WITH CHECK (app_is_system() OR app_is_admin());

DROP POLICY IF EXISTS notifications_delete_policy ON notifications;
CREATE POLICY notifications_delete_policy ON notifications
  FOR DELETE USING (app_is_system() OR app_is_admin());

ALTER TABLE notification_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_reads FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notification_reads_select_policy ON notification_reads;
CREATE POLICY notification_reads_select_policy ON notification_reads
  FOR SELECT USING (
    app_is_system() OR (app_user_id() IS NOT NULL AND user_id = app_user_id())
  );

DROP POLICY IF EXISTS notification_reads_insert_policy ON notification_reads;
CREATE POLICY notification_reads_insert_policy ON notification_reads
  FOR INSERT WITH CHECK (
    app_is_system() OR (app_user_id() IS NOT NULL AND user_id = app_user_id())
  );

DROP POLICY IF EXISTS notification_reads_delete_policy ON notification_reads;
CREATE POLICY notification_reads_delete_policy ON notification_reads
  FOR DELETE USING (
    app_is_system() OR (app_user_id() IS NOT NULL AND user_id = app_user_id())
  );
