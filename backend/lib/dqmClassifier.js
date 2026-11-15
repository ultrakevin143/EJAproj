/**
 * DQM Principles & Classification Definitions
 * Industry: Fitness & Gym Member Health Screening Records
 *
 * 6 DQM Principles:
 * 1. Accuracy    – Data reflects the true real-world entity/value.
 * 2. Consistency – Data follows uniform formatting rules across systems.
 * 3. Completeness– All required values are present and not missing.
 * 4. Timeliness  – Data is recorded within valid temporal constraints.
 * 5. Reliability – Data can be trusted for health & operational decisions.
 * 6. Relevance   – Data is actionable and usable for its intended purpose.
 */

const ISSUE_DEFINITIONS = {
  INCOMPLETE_NAME: {
    category: 'Incomplete Name',
    dqmPrinciples: ['Completeness', 'Relevance'],
    primaryPrinciple: 'Completeness',
    severity: 'High',
    autoFixable: false,
    suggestedAction:
      'Route to human review queue; verify full legal name against gym membership registration records.'
  },
  MISSING_DOB: {
    category: 'Missing DOB',
    dqmPrinciples: ['Completeness'],
    primaryPrinciple: 'Completeness',
    severity: 'High',
    autoFixable: false,
    suggestedAction:
      'Route to human review queue; request verified date of birth from membership form.'
  },
  MALFORMED_EMAIL: {
    category: 'Malformed Email',
    dqmPrinciples: ['Accuracy', 'Relevance'],
    primaryPrinciple: 'Accuracy',
    severity: 'Medium',
    autoFixable: false,
    suggestedAction:
      'Route to human review queue; contact gym member to update contact email.'
  },
  NON_STANDARD_SCREENING_RESULT: {
    category: 'Abbreviated Screening Result',
    dqmPrinciples: ['Consistency', 'Reliability'],
    primaryPrinciple: 'Consistency',
    severity: 'Medium',
    autoFixable: true,
    suggestedAction:
      'Automatically standardize abbreviations (e.g. "Clrd" → "Cleared", "Fla" → "Flagged", "Pnd" → "Pending").'
  },
  BLANK_SCREENING_RESULT: {
    category: 'Blank Screening Result',
    dqmPrinciples: ['Completeness', 'Reliability'],
    primaryPrinciple: 'Completeness',
    severity: 'Critical',
    autoFixable: false,
    suggestedAction:
      'Route to human review queue; investigate missing PAR-Q screening result with fitness coordinator.'
  },
  UNKNOWN_SCREENING_RESULT: {
    category: 'Unknown Screening Result',
    dqmPrinciples: ['Accuracy', 'Reliability'],
    primaryPrinciple: 'Accuracy',
    severity: 'High',
    autoFixable: false,
    suggestedAction:
      'Route to human review queue; reschedule PAR-Q assessment or confirm screening status.'
  },
  INVALID_RECORDED_DATE: {
    category: 'Invalid Recorded Date',
    dqmPrinciples: ['Accuracy', 'Timeliness'],
    primaryPrinciple: 'Accuracy',
    severity: 'Critical',
    autoFixable: false,
    suggestedAction:
      'Route to human review queue; inspect source gym management system timestamp logs.'
  },
  FUTURE_DATE: {
    category: 'Future Date',
    dqmPrinciples: ['Accuracy', 'Timeliness'],
    primaryPrinciple: 'Timeliness',
    severity: 'High',
    autoFixable: false,
    suggestedAction: 'Confirm the date with the source system and correct it before using the record.'
  },
  MIXED_DATE_FORMAT: {
    category: 'Mixed Date Format',
    dqmPrinciples: ['Consistency'],
    primaryPrinciple: 'Consistency',
    severity: 'Low',
    autoFixable: true,
    suggestedAction: 'Automatically reformat valid date to ISO standard YYYY-MM-DD.'
  },
  DUPLICATE_RECORD: {
    category: 'Duplicate Record',
    dqmPrinciples: ['Consistency', 'Accuracy'],
    primaryPrinciple: 'Consistency',
    severity: 'High',
    autoFixable: false,
    suggestedAction:
      'Flag redundant entry for de-duplication and gym data steward review.'
  }
};

// Valid controlled screening result vocabulary (after standardization)
const VALID_SCREENING_RESULTS = ['cleared', 'flagged', 'pending'];

// Abbreviation map for auto-fix
const SCREENING_RESULT_ABBR_MAP = {
  clrd: 'Cleared',
  'clrd.': 'Cleared',
  cl: 'Cleared',
  fla: 'Flagged',
  'fla.': 'Flagged',
  flg: 'Flagged',
  'flg.': 'Flagged',
  pnd: 'Pending',
  'pnd.': 'Pending',
  pn: 'Pending'
};

// Classroom baseline for 500 gym member records
const CLASSROOM_BASELINE = {
  totalRecords: 500,
  totalIssueEvents: 410,
  uniqueAffectedRecords: 345,
  affectedRecordsPercent: 69.0,
  abbrScreeningCount: 178,
  blankScreeningCount: 105,
  unknownScreeningCount: 27,
  incompleteNameCount: 28,
  missingDOBCount: 26,
  malformedEmailCount: 26,
  invalidRecordedDateCount: 20,
  mixedFormatDateCount: 457,
  duplicateRowCount: 0
};

module.exports = {
  ISSUE_DEFINITIONS,
  VALID_SCREENING_RESULTS,
  SCREENING_RESULT_ABBR_MAP,
  CLASSROOM_BASELINE
};

