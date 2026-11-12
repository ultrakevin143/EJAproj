/**
 * Automated Data Audit Engine
 * Industry: Fitness & Gym Member Health Screening Records
 *
 * Audits 5-field datasets, detects issues, classifies findings under DQM principles,
 * and distinguishes issue events vs unique affected records vs consistency patterns.
 *
 * Fields: Name | DOB | Email | Screening Result | Date Recorded
 */

const { parse } = require('csv-parse/sync');
const {
  ISSUE_DEFINITIONS,
  VALID_SCREENING_RESULTS,
  SCREENING_RESULT_ABBR_MAP,
  CLASSROOM_BASELINE
} = require('./dqmClassifier');

const REQUIRED_HEADERS = ['Name', 'DOB', 'Email', 'Screening Result', 'Date Recorded'];

// ─── Date Helpers ────────────────────────────────────────────────────────────

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDaysInMonth(year, month) {
  if (month < 1 || month > 12) return 0;
  const days = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return days[month - 1];
}

/**
 * Parses & validates a date string in various common formats.
 * Returns { isValid, isStandardIso, year, month, day, formattedIso, originalFormat }
 */
function parseDateDetails(str) {
  if (!str || typeof str !== 'string' || !str.trim()) {
    return { isValid: false, isStandardIso: false, reason: 'Empty date string' };
  }
  const trimmed = str.trim();

  // 1. YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    const maxDays = getDaysInMonth(year, month);
    if (month < 1 || month > 12 || day < 1 || day > maxDays) {
      return {
        isValid: false,
        isStandardIso: false,
        reason: `Impossible date ${trimmed} (Month: ${month}, Day: ${day})`
      };
    }
    const isStandardIso =
      /^\d{4}-\d{2}-\d{2}$/.test(trimmed) &&
      isoMatch[2].length === 2 &&
      isoMatch[3].length === 2;
    const formattedIso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { isValid: true, isStandardIso, year, month, day, formattedIso, originalFormat: 'YYYY-MM-DD' };
  }

  // 2. MM/DD/YYYY or DD/MM/YYYY variants
  const mdyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (mdyMatch) {
    const part1 = parseInt(mdyMatch[1], 10);
    const part2 = parseInt(mdyMatch[2], 10);
    const year = parseInt(mdyMatch[3], 10);
    let month, day;
    if (part1 > 12 && part2 <= 12) { day = part1; month = part2; }
    else if (part2 > 12 && part1 <= 12) { month = part1; day = part2; }
    else { month = part1; day = part2; } // default: MM/DD/YYYY
    const maxDays = getDaysInMonth(year, month);
    if (month < 1 || month > 12 || day < 1 || day > maxDays) {
      return {
        isValid: false,
        isStandardIso: false,
        reason: `Impossible date ${trimmed} (Month: ${month}, Day: ${day})`
      };
    }
    const formattedIso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { isValid: true, isStandardIso: false, year, month, day, formattedIso, originalFormat: 'MM/DD/YYYY' };
  }

  return { isValid: false, isStandardIso: false, reason: `Unrecognized date format: ${trimmed}` };
}

// ─── Email Validator ──────────────────────────────────────────────────────────

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 100) return false;
  if (/\s/.test(trimmed)) return false;
  if (trimmed.includes('..') || trimmed.includes('@@')) return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) return false;
  const parts = trimmed.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || !domain) return false;
  if (domain.startsWith('.') || domain.endsWith('.')) return false;
  if (domain.startsWith('-') || domain.endsWith('-')) return false;
  return true;
}

// ─── Name Validator ───────────────────────────────────────────────────────────

function validateName(name) {
  if (!name || typeof name !== 'string' || !name.trim()) {
    return { isIncomplete: true, reason: 'Name is blank' };
  }
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) {
    return {
      isIncomplete: true,
      reason: `Single-word name "${name.trim()}" (at least First and Last name required)`
    };
  }
  return { isIncomplete: false };
}

// ─── Main Audit Function ──────────────────────────────────────────────────────

function auditDataset(csvInput) {
  let rows = [];

  if (typeof csvInput === 'string') {
    try {
      rows = parse(csvInput, { columns: true, skip_empty_lines: true, trim: false });
    } catch (err) {
      return { success: false, error: `CSV Parsing Error: ${err.message}` };
    }
  } else if (Array.isArray(csvInput)) {
    rows = csvInput;
  } else {
    return { success: false, error: 'Invalid input provided to audit engine' };
  }

  if (!rows || rows.length === 0) {
    return { success: false, error: 'Uploaded file contains no data rows.' };
  }

  // Validate required columns
  const firstRow = rows[0];
  const presentHeaders = Object.keys(firstRow).map(h => h.trim());
  const missingHeaders = REQUIRED_HEADERS.filter(req => !presentHeaders.includes(req));
  if (missingHeaders.length > 0) {
    return {
      success: false,
      error: `Missing required column(s): ${missingHeaders.join(', ')}. Dataset must contain: ${REQUIRED_HEADERS.join(', ')}.`
    };
  }

  const totalRecords = rows.length;
  const totalFields = totalRecords * REQUIRED_HEADERS.length;

  const errorLog = [];
  const consistencyPatterns = [];
  const affectedRecordIndices = new Set();
  const duplicateRows = [];
  const seenSignatures = new Map();

  const categoryCounts = {
    'Abbreviated Screening Result': 0,
    'Blank Screening Result': 0,
    'Unknown Screening Result': 0,
    'Incomplete Name': 0,
    'Missing DOB': 0,
    'Malformed Email': 0,
    'Invalid Recorded Date': 0,
    'Duplicate Record': 0
  };

  const dqmCounts = {
    Accuracy: 0,
    Consistency: 0,
    Completeness: 0,
    Timeliness: 0,
    Reliability: 0,
    Relevance: 0
  };

  rows.forEach((row, index) => {
    const rowNumber = index + 1;
    const nameVal = row['Name'] !== undefined ? String(row['Name']) : '';
    const dobVal = row['DOB'] !== undefined ? String(row['DOB']) : '';
    const emailVal = row['Email'] !== undefined ? String(row['Email']) : '';
    const screeningVal = row['Screening Result'] !== undefined ? String(row['Screening Result']) : '';
    const dateRecordedVal = row['Date Recorded'] !== undefined ? String(row['Date Recorded']) : '';

    function addIssueEvent(field, originalVal, defKey, customReason = null) {
      const def = ISSUE_DEFINITIONS[defKey];
      affectedRecordIndices.add(index);
      categoryCounts[def.category] = (categoryCounts[def.category] || 0) + 1;
      def.dqmPrinciples.forEach(p => { dqmCounts[p] = (dqmCounts[p] || 0) + 1; });
      errorLog.push({
        id: `err-${errorLog.length + 1}`,
        rowNumber,
        rowIndex: index,
        fieldName: field,
        originalValue: originalVal,
        issueCategory: def.category,
        dqmPrinciples: def.dqmPrinciples,
        primaryPrinciple: def.primaryPrinciple,
        severity: def.severity,
        autoFixable: def.autoFixable,
        reason: customReason || def.suggestedAction,
        suggestedAction: def.suggestedAction
      });
    }

    function addConsistencyPattern(field, originalVal, formattedIso) {
      consistencyPatterns.push({
        id: `const-${consistencyPatterns.length + 1}`,
        rowNumber,
        rowIndex: index,
        fieldName: field,
        originalValue: originalVal,
        targetValue: formattedIso,
        issueCategory: ISSUE_DEFINITIONS.MIXED_DATE_FORMAT.category,
        dqmPrinciples: ISSUE_DEFINITIONS.MIXED_DATE_FORMAT.dqmPrinciples,
        autoFixable: true
      });
    }

    // CHECK 1: DUPLICATE ROW
    const sig = `${nameVal.trim()}|${dobVal.trim()}|${emailVal.trim()}|${screeningVal.trim()}|${dateRecordedVal.trim()}`;
    if (seenSignatures.has(sig)) {
      const originalRow = seenSignatures.get(sig);
      duplicateRows.push({ rowNumber, duplicateOfRow: originalRow, data: row });
      addIssueEvent('Entire Record', sig, 'DUPLICATE_RECORD', `Exact duplicate of Row ${originalRow}`);
    } else {
      seenSignatures.set(sig, rowNumber);
    }

    // CHECK 2: NAME
    const nameCheck = validateName(nameVal);
    if (nameCheck.isIncomplete) {
      addIssueEvent('Name', nameVal, 'INCOMPLETE_NAME', nameCheck.reason);
    }

    // CHECK 3: DOB
    if (!dobVal || !dobVal.trim()) {
      addIssueEvent('DOB', dobVal, 'MISSING_DOB', 'Date of Birth is missing/blank');
    } else {
      const dobDate = parseDateDetails(dobVal);
      if (!dobDate.isValid) {
        addIssueEvent('DOB', dobVal, 'INVALID_RECORDED_DATE', `DOB is invalid: ${dobDate.reason}`);
      } else if (!dobDate.isStandardIso) {
        addConsistencyPattern('DOB', dobVal, dobDate.formattedIso);
      }
    }

    // CHECK 4: EMAIL
    if (!isValidEmail(emailVal)) {
      addIssueEvent('Email', emailVal, 'MALFORMED_EMAIL', `Email "${emailVal}" is malformed or invalid syntax`);
    }

    // CHECK 5: SCREENING RESULT
    const srTrimmed = screeningVal.trim();
    const srLower = srTrimmed.toLowerCase();
    if (!srTrimmed) {
      addIssueEvent('Screening Result', screeningVal, 'BLANK_SCREENING_RESULT', 'Screening Result value is blank');
    } else if (SCREENING_RESULT_ABBR_MAP[srLower]) {
      addIssueEvent(
        'Screening Result', screeningVal, 'NON_STANDARD_SCREENING_RESULT',
        `Non-standard abbreviation "${screeningVal}" (expected Cleared, Flagged, or Pending)`
      );
    } else if (srLower === 'unknown' || srLower === 'unk' || srLower === '?' || srLower === 'n/a') {
      addIssueEvent('Screening Result', screeningVal, 'UNKNOWN_SCREENING_RESULT', `Ambiguous result "${screeningVal}"`);
    } else if (!VALID_SCREENING_RESULTS.includes(srLower)) {
      addIssueEvent('Screening Result', screeningVal, 'UNKNOWN_SCREENING_RESULT', `Unrecognized screening result "${screeningVal}"`);
    }

    // CHECK 6: DATE RECORDED
    if (!dateRecordedVal || !dateRecordedVal.trim()) {
      addIssueEvent('Date Recorded', dateRecordedVal, 'INVALID_RECORDED_DATE', 'Date Recorded is missing');
    } else {
      const recDate = parseDateDetails(dateRecordedVal);
      if (!recDate.isValid) {
        addIssueEvent('Date Recorded', dateRecordedVal, 'INVALID_RECORDED_DATE', `Date Recorded is impossible/invalid: ${recDate.reason}`);
      } else if (!recDate.isStandardIso) {
        addConsistencyPattern('Date Recorded', dateRecordedVal, recDate.formattedIso);
      }
    }
  });

  const uniqueAffectedCount = affectedRecordIndices.size;
  const affectedPercent = totalRecords > 0 ? (uniqueAffectedCount / totalRecords) * 100 : 0;
  const issueEventsCount = errorLog.length;

  return {
    success: true,
    summary: {
      totalRecords,
      totalFields,
      issueEvents: issueEventsCount,
      uniqueAffectedRecords: uniqueAffectedCount,
      affectedRecordsPercent: parseFloat(affectedPercent.toFixed(2)),
      consistencyPatternsCount: consistencyPatterns.length,
      duplicateRowsCount: duplicateRows.length,
      categoryCounts,
      dqmCounts
    },
    baselineComparison: {
      baseline: CLASSROOM_BASELINE,
      actual: {
        totalRecords,
        issueEvents: issueEventsCount,
        uniqueAffectedRecords: uniqueAffectedCount,
        affectedRecordsPercent: parseFloat(affectedPercent.toFixed(2)),
        abbrScreeningCount: categoryCounts['Abbreviated Screening Result'] || 0,
        blankScreeningCount: categoryCounts['Blank Screening Result'] || 0,
        unknownScreeningCount: categoryCounts['Unknown Screening Result'] || 0,
        incompleteNameCount: categoryCounts['Incomplete Name'] || 0,
        missingDOBCount: categoryCounts['Missing DOB'] || 0,
        malformedEmailCount: categoryCounts['Malformed Email'] || 0,
        invalidRecordedDateCount: categoryCounts['Invalid Recorded Date'] || 0,
        mixedFormatDateCount: consistencyPatterns.length,
        duplicateRowCount: duplicateRows.length
      }
    },
    errorLog,
    consistencyPatterns,
    duplicateRows,
    records: rows
  };
}

module.exports = {
  auditDataset,
  parseDateDetails,
  isValidEmail,
  validateName,
  REQUIRED_HEADERS
};

