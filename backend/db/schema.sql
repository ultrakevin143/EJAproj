-- ============================================================
-- Gym DQM System — PostgreSQL Schema
-- Compatible with Neon Cloud PostgreSQL & local PostgreSQL
-- Run once to initialize the database
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── 1. AUDIT SESSIONS ───────────────────────────────────────
-- Tracks each CSV upload or generated dataset session
CREATE TABLE IF NOT EXISTS audit_sessions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name                TEXT NOT NULL,
  uploaded_at              TIMESTAMPTZ DEFAULT NOW(),
  total_records            INT DEFAULT 0,
  total_fields             INT DEFAULT 0,
  total_issue_events       INT DEFAULT 0,
  unique_affected_records  INT DEFAULT 0,
  affected_percent         NUMERIC(5,2) DEFAULT 0.00,
  consistency_patterns     INT DEFAULT 0,
  duplicate_rows           INT DEFAULT 0,
  status                   TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'cleaned', 'archived'))
);

-- ─── 2. AUDIT RECORDS ────────────────────────────────────────
-- Raw/original records from each uploaded dataset
CREATE TABLE IF NOT EXISTS audit_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID REFERENCES audit_sessions(id) ON DELETE CASCADE,
  row_number       INT NOT NULL,
  member_name      TEXT,
  dob              TEXT,
  email            TEXT,
  screening_result TEXT,
  date_recorded    TEXT,
  is_duplicate     BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_records_session ON audit_records(session_id);

-- ─── 3. AUDIT ERRORS ─────────────────────────────────────────
-- Each detected DQM issue event per record per field
CREATE TABLE IF NOT EXISTS audit_errors (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id         UUID REFERENCES audit_sessions(id) ON DELETE CASCADE,
  row_number         INT NOT NULL,
  row_index          INT,
  field_name         TEXT NOT NULL,
  original_value     TEXT,
  issue_category     TEXT NOT NULL,
  primary_principle  TEXT NOT NULL,
  dqm_principles     TEXT[] NOT NULL,
  severity           TEXT NOT NULL
    CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
  auto_fixable       BOOLEAN DEFAULT FALSE,
  suggested_action   TEXT,
  reason             TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_errors_session ON audit_errors(session_id);

-- ─── 4. REVIEW QUEUE ─────────────────────────────────────────
-- Human review queue for data stewards
CREATE TABLE IF NOT EXISTS review_queue (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id         UUID REFERENCES audit_sessions(id) ON DELETE CASCADE,
  row_number         INT NOT NULL,
  row_index          INT,
  field_name         TEXT NOT NULL,
  current_value      TEXT,
  issue_category     TEXT NOT NULL,
  primary_principle  TEXT NOT NULL,
  dqm_principles     TEXT[] NOT NULL,
  severity           TEXT NOT NULL,
  reason_for_review  TEXT,
  suggested_action   TEXT,
  status             TEXT DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'Reviewed', 'Approved', 'Rejected')),
  notes              TEXT DEFAULT '',
  manual_value       TEXT DEFAULT '',
  reviewed_by        TEXT,
  reviewed_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_review_queue_session   ON review_queue(session_id);
CREATE INDEX IF NOT EXISTS idx_review_queue_status    ON review_queue(status);
ALTER TABLE review_queue ADD COLUMN IF NOT EXISTS reviewed_by TEXT;

-- ─── 5. GOVERNANCE RULES ─────────────────────────────────────
-- Data governance prevention policies
CREATE TABLE IF NOT EXISTS governance_rules (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name          TEXT NOT NULL UNIQUE,
  rule_description   TEXT,
  dqm_principle      TEXT NOT NULL,
  enforcement_level  TEXT DEFAULT 'Advisory'
    CHECK (enforcement_level IN ('Mandatory', 'Advisory')),
  is_active          BOOLEAN DEFAULT TRUE,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 6. CLEANED RECORDS ──────────────────────────────────────
-- Standardized/cleaned dataset after safe transformations
CREATE TABLE IF NOT EXISTS cleaned_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID REFERENCES audit_sessions(id) ON DELETE CASCADE,
  row_number       INT NOT NULL,
  member_name      TEXT,
  dob              TEXT,
  email            TEXT,
  screening_result TEXT,
  date_recorded    TEXT,
  was_modified     BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cleaned_records_session ON cleaned_records(session_id);

CREATE TABLE IF NOT EXISTS cleaning_change_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     UUID NOT NULL REFERENCES audit_sessions(id) ON DELETE CASCADE,
  row_number     INT NOT NULL,
  field_name     TEXT NOT NULL,
  original_value TEXT,
  new_value      TEXT,
  rule_name      TEXT NOT NULL,
  change_type    TEXT NOT NULL,
  changed_by     TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cleaning_change_log_session ON cleaning_change_log(session_id, row_number);

-- ─── 7. MULTI-SOURCE SOURCE 1: CRM MEMBERS (FRONT-DESK) ──────
CREATE TABLE IF NOT EXISTS crm_members (
  member_id        TEXT PRIMARY KEY,
  full_name        TEXT NOT NULL,
  dob              TEXT,
  email            TEXT,
  membership_tier  TEXT DEFAULT 'Standard',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 8. MULTI-SOURCE SOURCE 2: CLINIC HEALTH SCREENINGS ──────
CREATE TABLE IF NOT EXISTS clinic_screenings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id           TEXT NOT NULL,
  parq_status         TEXT,
  resting_heart_rate  INT,
  assessment_date     TEXT,
  medical_flag        TEXT DEFAULT 'NO',
  notes               TEXT DEFAULT '',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 9. MULTI-SOURCE SOURCE 3: TURNSTILE CHECK-IN LOGS ────────
CREATE TABLE IF NOT EXISTS turnstile_scans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_id      TEXT,
  member_id       TEXT NOT NULL,
  scan_time       TIMESTAMPTZ DEFAULT NOW(),
  facility_zone   TEXT DEFAULT 'Main Gym Floor',
  access_granted  BOOLEAN DEFAULT TRUE,
  denial_reason   TEXT DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 10. TARGET DATA WAREHOUSE: INTEGRATED MEMBER 360 ─────────
CREATE TABLE IF NOT EXISTS integrated_members_360 (
  member_id                TEXT PRIMARY KEY,
  full_name                TEXT,
  dob                      TEXT,
  email                    TEXT,
  membership_tier          TEXT,
  parq_status              TEXT,
  resting_heart_rate       INT,
  assessment_date          TEXT,
  total_checkins           INT DEFAULT 0,
  last_checkin_time        TEXT,
  frequent_zone            TEXT,
  safety_clearance_status  TEXT,
  risk_tier                TEXT,
  dqm_flags_count          INT DEFAULT 0,
  dqm_flags                TEXT[],
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 11. ETL RUN HISTORY, QUALITY ISSUES, AND FIELD LINEAGE ────
CREATE TABLE IF NOT EXISTS etl_pipeline_runs (
  run_id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status                    TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'succeeded', 'failed')),
  started_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at               TIMESTAMPTZ,
  started_by                TEXT NOT NULL,
  crm_rows                  INT DEFAULT 0,
  clinic_rows               INT DEFAULT 0,
  turnstile_rows            INT DEFAULT 0,
  loaded_rows               INT DEFAULT 0,
  issue_count               INT DEFAULT 0,
  orphan_count              INT DEFAULT 0,
  transformation_count     INT DEFAULT 0,
  review_queue_count        INT DEFAULT 0,
  error_message             TEXT
);
CREATE INDEX IF NOT EXISTS idx_etl_pipeline_runs_started ON etl_pipeline_runs(started_at DESC);

CREATE TABLE IF NOT EXISTS etl_pipeline_issues (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id             UUID NOT NULL REFERENCES etl_pipeline_runs(run_id) ON DELETE CASCADE,
  source_name        TEXT NOT NULL,
  member_id          TEXT,
  field_name         TEXT NOT NULL,
  issue_category     TEXT NOT NULL,
  dqm_principle      TEXT NOT NULL,
  severity           TEXT NOT NULL
    CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
  issue_value        TEXT,
  suggested_action   TEXT,
  review_status      TEXT NOT NULL DEFAULT 'Open'
    CHECK (review_status IN ('Open', 'Resolved', 'Quarantined')),
  review_note        TEXT DEFAULT '',
  reviewed_by        TEXT,
  reviewed_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_etl_pipeline_issues_run ON etl_pipeline_issues(run_id, review_status);

CREATE TABLE IF NOT EXISTS etl_field_lineage (
  run_id       UUID NOT NULL REFERENCES etl_pipeline_runs(run_id) ON DELETE CASCADE,
  member_id    TEXT NOT NULL,
  field_name   TEXT NOT NULL,
  source_name  TEXT NOT NULL,
  source_key   TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (run_id, member_id, field_name)
);

CREATE TABLE IF NOT EXISTS audit_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    TEXT NOT NULL,
  actor_role  TEXT NOT NULL,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   TEXT,
  details     TEXT DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_events_created ON audit_events(created_at DESC);

ALTER TABLE integrated_members_360
  ADD COLUMN IF NOT EXISTS pipeline_run_id UUID REFERENCES etl_pipeline_runs(run_id);

-- ─── SEED: Default Governance Rules ──────────────────────────
INSERT INTO governance_rules (rule_name, rule_description, dqm_principle, enforcement_level, is_active)
VALUES
  (
    'Mandatory Full Name Validation',
    'All gym member records must contain at least First and Last name. Single-token names are rejected at intake.',
    'Completeness',
    'Mandatory',
    TRUE
  ),
  (
    'Date of Birth Required Field',
    'DOB is a required field. Records missing DOB cannot be screened or activated in the gym system.',
    'Completeness',
    'Mandatory',
    TRUE
  ),
  (
    'ISO-8601 Date Format Standard',
    'All date fields (DOB, Date Recorded) must be stored in YYYY-MM-DD format. Non-standard formats are auto-standardized on import.',
    'Consistency',
    'Mandatory',
    TRUE
  ),
  (
    'Controlled Screening Result Vocabulary',
    'Only "Cleared", "Flagged", or "Pending" are accepted screening result values. Abbreviations are automatically expanded.',
    'Consistency',
    'Mandatory',
    TRUE
  ),
  (
    'Email Format Validation',
    'All member email addresses must pass RFC-compliant syntax validation before being stored.',
    'Accuracy',
    'Mandatory',
    TRUE
  ),
  (
    'Data Steward Review After Each Upload',
    'Every dataset upload must be reviewed by a designated data steward before records are marked as approved.',
    'Reliability',
    'Advisory',
    TRUE
  ),
  (
    'Duplicate Record Detection',
    'Exact duplicate member records are automatically flagged and must be resolved before activation.',
    'Accuracy',
    'Mandatory',
    TRUE
  ),
  (
    'Audit Trail Preservation',
    'All changes to member records (automated or manual) must be logged in the correction changelog. No silent overwrites.',
    'Reliability',
    'Mandatory',
    TRUE
  )
ON CONFLICT (rule_name) DO NOTHING;

