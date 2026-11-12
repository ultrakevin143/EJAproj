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
  reviewed_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_review_queue_session   ON review_queue(session_id);
CREATE INDEX IF NOT EXISTS idx_review_queue_status    ON review_queue(status);

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

