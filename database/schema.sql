-- ─────────────────────────────────────────────
-- StudySync — database/schema.sql
-- Full PostgreSQL schema
-- Run: psql $DATABASE_URL -f database/schema.sql
-- ─────────────────────────────────────────────

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for full-text search on notes

-- ══════════════════════════════
--  USERS
-- ══════════════════════════════
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name    VARCHAR(80),
  last_name     VARCHAR(80),
  name          VARCHAR(160) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar        TEXT,
  shs_level     VARCHAR(10),
  track         VARCHAR(80),
  role          VARCHAR(20) NOT NULL DEFAULT 'student',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════
--  PASSWORD RESET TOKENS
-- ══════════════════════════════
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════
--  USER SETTINGS
-- ══════════════════════════════
CREATE TABLE IF NOT EXISTS user_settings (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  -- Notifications
  notif_prayer        BOOLEAN NOT NULL DEFAULT TRUE,
  notif_study         BOOLEAN NOT NULL DEFAULT TRUE,
  notif_quiz          BOOLEAN NOT NULL DEFAULT TRUE,
  notif_tasks         BOOLEAN NOT NULL DEFAULT TRUE,
  notif_motivation    BOOLEAN NOT NULL DEFAULT TRUE,
  notif_weekly        BOOLEAN NOT NULL DEFAULT FALSE,
  -- Appearance
  accent_colour       VARCHAR(30) NOT NULL DEFAULT 'purple',
  font_size           VARCHAR(10) NOT NULL DEFAULT 'medium',
  dark_mode           BOOLEAN NOT NULL DEFAULT FALSE,
  -- Pomodoro defaults
  pomo_focus_min      INT NOT NULL DEFAULT 25,
  pomo_short_min      INT NOT NULL DEFAULT 5,
  pomo_long_min       INT NOT NULL DEFAULT 15,
  pomo_rounds         INT NOT NULL DEFAULT 4,
  -- Daily goal
  daily_focus_goal_min INT NOT NULL DEFAULT 120,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════
--  TASKS
-- ══════════════════════════════
CREATE TABLE IF NOT EXISTS tasks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  deadline    TIMESTAMPTZ,
  priority    VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  subject     VARCHAR(80),
  completed   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id   ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline  ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);

-- ══════════════════════════════
--  REMINDERS
-- ══════════════════════════════
CREATE TABLE IF NOT EXISTS reminders (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(255) NOT NULL,
  type       VARCHAR(20) NOT NULL DEFAULT 'custom' CHECK (type IN ('prayer','study','school','custom')),
  time       TIME NOT NULL,
  repeat     VARCHAR(20) NOT NULL DEFAULT 'daily' CHECK (repeat IN ('daily','weekdays','weekends','once')),
  date       DATE,
  note       TEXT,
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_active  ON reminders(active);

-- ══════════════════════════════
--  NOTES
-- ══════════════════════════════
CREATE TABLE IF NOT EXISTS notes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(255) NOT NULL,
  subject    VARCHAR(80) NOT NULL,
  type       VARCHAR(20) NOT NULL DEFAULT 'summary' CHECK (type IN ('summary','formula','definition','key-points')),
  content    TEXT NOT NULL,
  tags       TEXT[],
  bookmarked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_user_id   ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_subject   ON notes(subject);
CREATE INDEX IF NOT EXISTS idx_notes_bookmarked ON notes(bookmarked);

-- ══════════════════════════════
--  QUIZZES
-- ══════════════════════════════
CREATE TABLE IF NOT EXISTS quizzes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title             VARCHAR(255) NOT NULL,
  subject           VARCHAR(80) NOT NULL,
  level             VARCHAR(10) NOT NULL DEFAULT 'SHS1' CHECK (level IN ('SHS1','SHS2','SHS3')),
  timed             BOOLEAN NOT NULL DEFAULT TRUE,
  time_limit_minutes INT NOT NULL DEFAULT 10,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_subject ON quizzes(subject);
CREATE INDEX IF NOT EXISTS idx_quizzes_level   ON quizzes(level);
CREATE INDEX IF NOT EXISTS idx_quizzes_active  ON quizzes(is_active);

-- ══════════════════════════════
--  QUESTIONS
-- ══════════════════════════════
CREATE TABLE IF NOT EXISTS questions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id       UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  text          TEXT NOT NULL,
  options       JSONB NOT NULL,   -- [{ text, correct }]
  correct_index INT NOT NULL,
  explanation   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);

-- ══════════════════════════════
--  QUIZ ATTEMPTS
-- ══════════════════════════════
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id      UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  answers      JSONB NOT NULL DEFAULT '[]', -- [{ questionId, selectedIndex }]
  score        INT NOT NULL DEFAULT 0,      -- percentage 0-100
  correct      INT NOT NULL DEFAULT 0,
  total        INT NOT NULL DEFAULT 0,
  time_taken   INT NOT NULL DEFAULT 0,      -- seconds
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attempts_user_id  ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_quiz_id  ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_attempts_completed ON quiz_attempts(completed_at);

-- ══════════════════════════════
--  CALENDAR EVENTS
-- ══════════════════════════════
CREATE TABLE IF NOT EXISTS calendar_events (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(255) NOT NULL,
  type       VARCHAR(20) NOT NULL DEFAULT 'study' CHECK (type IN ('quiz','task','reminder','study','school')),
  date       DATE NOT NULL,
  start_time TIME,
  end_time   TIME,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_user_id ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_date    ON calendar_events(date);

-- ══════════════════════════════
--  TIMER SESSIONS (Pomodoro)
-- ══════════════════════════════
CREATE TABLE IF NOT EXISTS timer_sessions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(10) NOT NULL DEFAULT 'focus' CHECK (type IN ('focus','break')),
  minutes     INT NOT NULL,
  task_id     UUID REFERENCES tasks(id) ON DELETE SET NULL,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timer_user_id ON timer_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_timer_date    ON timer_sessions(date);

-- ══════════════════════════════
--  STUDY STREAK
-- ══════════════════════════════
CREATE TABLE IF NOT EXISTS study_streak (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  last_study_date DATE,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ══════════════════════════════
--  DAILY ACTIVITY LOG
-- ══════════════════════════════
CREATE TABLE IF NOT EXISTS daily_activity (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  quiz_count INT NOT NULL DEFAULT 0,
  avg_score  INT,
  focus_min  INT NOT NULL DEFAULT 0,
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_activity_user_date ON daily_activity(user_id, date);

-- ══════════════════════════════
--  AUTO-UPDATE updated_at TRIGGER
-- ══════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['users','user_settings','tasks','reminders','notes','calendar_events']
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_updated_at ON %I;
      CREATE TRIGGER trg_updated_at
      BEFORE UPDATE ON %I
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    ', tbl, tbl);
  END LOOP;
END;
$$;

-- ══════════════════════════════
--  VIEWS
-- ══════════════════════════════

-- User performance summary view
CREATE OR REPLACE VIEW v_user_subject_performance AS
SELECT
  qa.user_id,
  q.subject,
  COUNT(qa.id)       AS quiz_count,
  ROUND(AVG(qa.score))::INT AS avg_score,
  MAX(qa.score)      AS best_score,
  MIN(qa.score)      AS worst_score
FROM quiz_attempts qa
JOIN quizzes q ON q.id = qa.quiz_id
GROUP BY qa.user_id, q.subject;

-- Quiz with last attempt score per user
CREATE OR REPLACE VIEW v_quiz_with_stats AS
SELECT
  q.id,
  q.title,
  q.subject,
  q.level,
  q.timed,
  q.time_limit_minutes,
  q.is_active,
  q.created_at,

  (
    SELECT COUNT(*)
    FROM questions qu
    WHERE qu.quiz_id = q.id
  ) AS question_count,

  (
    SELECT ROUND(AVG(score))::INT
    FROM quiz_attempts qa
    WHERE qa.quiz_id = q.id
  ) AS average_score

FROM quizzes q
WHERE q.is_active = TRUE;

-- ─────────────────────────────────────────────
-- StudySync — database/schema_logs.sql
-- Add log tables to existing schema
-- Run: psql $DATABASE_URL -f database/schema_logs.sql
-- ─────────────────────────────────────────────

-- ══════════════════════════════
--  ACTIVITY LOGS
--  Tracks all user actions
-- ══════════════════════════════
CREATE TABLE IF NOT EXISTS activity_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email  VARCHAR(255),
  user_name   VARCHAR(160),
  type        VARCHAR(30) NOT NULL DEFAULT 'system',
  -- auth | quiz | task | note | reminder | calendar | timer | settings | system
  level       VARCHAR(10) NOT NULL DEFAULT 'info',
  -- info | warning | error
  action      VARCHAR(255) NOT NULL,
  details     TEXT,
  ip_address  VARCHAR(45),
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id    ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type       ON activity_logs(type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_level      ON activity_logs(level);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ══════════════════════════════
--  EMAIL LOGS
--  Tracks all emails sent
-- ══════════════════════════════
CREATE TABLE IF NOT EXISTS email_logs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type             VARCHAR(30) NOT NULL DEFAULT 'custom',
  -- motivation | weekly | custom | password_reset | welcome
  subject          VARCHAR(255) NOT NULL,
  recipient_count  INT NOT NULL DEFAULT 1,
  recipients       TEXT,       -- comma-separated emails or group name
  sent_by          UUID REFERENCES users(id) ON DELETE SET NULL,
  status           VARCHAR(10) NOT NULL DEFAULT 'sent',
  -- sent | failed | partial
  error_message    TEXT,
  sent_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_type    ON email_logs(type);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);

-- ══════════════════════════════
--  ERROR LOGS
--  Tracks API and system errors
-- ══════════════════════════════
CREATE TABLE IF NOT EXISTS error_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email  VARCHAR(255),
  endpoint    VARCHAR(255),
  method      VARCHAR(10),
  status_code INT,
  message     TEXT NOT NULL,
  stack       TEXT,
  ip_address  VARCHAR(45),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_status_code ON error_logs(status_code);

-- ══════════════════════════════
--  ADMIN SETTINGS TABLE
--  Stores system-wide config
-- ══════════════════════════════
CREATE TABLE IF NOT EXISTS admin_settings (
  key        VARCHAR(100) PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default settings
INSERT INTO admin_settings (key, value) VALUES
  ('maintenance_mode', 'false'),
  ('smtp_host',        ''),
  ('smtp_port',        '587'),
  ('smtp_user',        ''),
  ('smtp_from',        'StudySync <ayisiemmanuel151@gmail.com>'),
  ('motivation_email_time', '08:00'),
  ('weekly_email_time', 'Monday 09:00')
ON CONFLICT (key) DO NOTHING;