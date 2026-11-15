/**
 * Safe Data Cleaning & Standardization Engine
 * Industry: Fitness & Gym Member Health Screening Records
 *
 * Deterministic safe transformations only:
 *   - Abbreviation map: "Clrd" → "Cleared", "Fla" → "Flagged", "Pnd" → "Pending"
 *   - Valid dates → ISO YYYY-MM-DD
 *   - Whitespace trimming
 *
 * Zero Hallucination Rule: Never fabricates missing names, DOBs, emails, or screening results.
 */

const { parseDateDetails, todayIsoDate, isValidEmail, validateName } = require('./auditEngine');
const { stringify } = require('csv-stringify/sync');
const { SCREENING_RESULT_ABBR_MAP, VALID_SCREENING_RESULTS } = require('./dqmClassifier');
const { protectRows } = require('./csvSafety');

function normalizeApprovedValue(field, value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const cleaned = value.trim();

  if (field === 'Name') {
    return validateName(cleaned).isIncomplete ? null : cleaned.replace(/\s+/g, ' ');
  }
  if (field === 'DOB' || field === 'Date Recorded') {
    const parsed = parseDateDetails(cleaned);
    if (!parsed.isValid || parsed.formattedIso > todayIsoDate()) return null;
    return parsed.formattedIso;
  }
  if (field === 'Email') {
    return isValidEmail(cleaned) ? cleaned.toLowerCase() : null;
  }
  if (field === 'Screening Result') {
    const lower = cleaned.toLowerCase();
    const expanded = SCREENING_RESULT_ABBR_MAP[lower] || lower;
    if (!VALID_SCREENING_RESULTS.includes(expanded.toLowerCase())) return null;
    return expanded.charAt(0).toUpperCase() + expanded.slice(1).toLowerCase();
  }
  return null;
}

/**
 * Applies safe cleaning to an array of row objects.
 * Returns { cleanedRows, reviewQueue, changelog, summary }
 */
function applySafeCleaning(records, errorLog = [], existingReviewQueue = []) {
  if (!records || !Array.isArray(records)) {
    return { cleanedRows: [], reviewQueue: [], changelog: [], summary: {} };
  }

  const cleanedRows = records.map(r => ({ ...r }));
  const changelog = [];
  const reviewQueue = [];

  let abbrFixed = 0;
  let datesStandardized = 0;
  let whitespaceTrimmed = 0;

  cleanedRows.forEach((row, index) => {
    const rowNumber = index + 1;

    // 1. Whitespace trimming across all fields
    for (const key of Object.keys(row)) {
      if (typeof row[key] === 'string') {
        const trimmed = row[key].trim();
        if (trimmed !== row[key]) {
          changelog.push({
            rowNumber,
            field: key,
            originalValue: row[key],
            newValue: trimmed,
            rule: 'Trim leading/trailing whitespace',
            type: 'Automated Safe Fix'
          });
          row[key] = trimmed;
          whitespaceTrimmed++;
        }
      }
    }

    // 2. Safe Screening Result Standardization (abbreviation expansion)
    const srVal = row['Screening Result'];
    if (srVal) {
      const lower = srVal.toLowerCase().trim();
      const expanded = SCREENING_RESULT_ABBR_MAP[lower];
      if (expanded) {
        changelog.push({
          rowNumber,
          field: 'Screening Result',
          originalValue: srVal,
          newValue: expanded,
          rule: `Standardize "${srVal}" abbreviation to "${expanded}"`,
          type: 'Automated Safe Fix'
        });
        row['Screening Result'] = expanded;
        abbrFixed++;
      }
    }

    // 3. Safe Date Standardization (DOB)
    const dobVal = row['DOB'];
    if (dobVal && dobVal.trim()) {
      const dobCheck = parseDateDetails(dobVal);
      if (dobCheck.isValid && !dobCheck.isStandardIso) {
        changelog.push({
          rowNumber,
          field: 'DOB',
          originalValue: dobVal,
          newValue: dobCheck.formattedIso,
          rule: 'Standardize valid date to ISO YYYY-MM-DD format',
          type: 'Automated Safe Fix'
        });
        row['DOB'] = dobCheck.formattedIso;
        datesStandardized++;
      }
    }

    // 4. Safe Date Standardization (Date Recorded)
    const recVal = row['Date Recorded'];
    if (recVal && recVal.trim()) {
      const recCheck = parseDateDetails(recVal);
      if (recCheck.isValid && !recCheck.isStandardIso) {
        changelog.push({
          rowNumber,
          field: 'Date Recorded',
          originalValue: recVal,
          newValue: recCheck.formattedIso,
          rule: 'Standardize valid date to ISO YYYY-MM-DD format',
          type: 'Automated Safe Fix'
        });
        row['Date Recorded'] = recCheck.formattedIso;
        datesStandardized++;
      }
    }
  });

  if (Array.isArray(existingReviewQueue)) {
    existingReviewQueue.forEach((item) => {
      if (item.status !== 'Approved') return;
      const row = cleanedRows[Number(item.rowNumber) - 1];
      if (!row) return;

      const normalizedValue = normalizeApprovedValue(item.field, item.manualValue);
      if (normalizedValue === null || !Object.prototype.hasOwnProperty.call(row, item.field)) return;

      const originalValue = row[item.field];
      row[item.field] = normalizedValue;
      changelog.push({
        rowNumber: Number(item.rowNumber),
        field: item.field,
        originalValue,
        newValue: normalizedValue,
        rule: 'Apply steward-approved correction',
        type: 'Human Approved Correction'
      });
    });
  }

  // Build Human Review Queue from non-auto-fixable errors
  const statusMap = new Map();
  if (Array.isArray(existingReviewQueue)) {
    existingReviewQueue.forEach(item => {
      statusMap.set(`${item.rowNumber}-${item.field}`, {
        status: item.status,
        notes: item.notes,
        manualValue: item.manualValue,
        reviewedBy: item.reviewedBy
      });
    });
  }

  errorLog.forEach(err => {
    if (!err.autoFixable) {
      const queueKey = `${err.rowNumber}-${err.fieldName}`;
      const existing = statusMap.get(queueKey);
      reviewQueue.push({
        id: `rev-${reviewQueue.length + 1}`,
        rowNumber: err.rowNumber,
        rowIndex: err.rowIndex,
        field: err.fieldName,
        currentValue: err.originalValue,
        category: err.issueCategory,
        primaryPrinciple: err.primaryPrinciple,
        dqmPrinciples: err.dqmPrinciples,
        severity: err.severity,
        reasonForReview: err.reason,
        suggestedNextAction: err.suggestedAction,
        status: existing?.status || 'Pending',
        notes: existing?.notes || '',
        manualValue: existing?.manualValue || '',
        reviewedBy: existing?.reviewedBy || ''
      });
    }
  });

  const summary = {
    totalRecords: cleanedRows.length,
    abbrResultsStandardized: abbrFixed,
    datesStandardized,
    whitespaceTrimmed,
    totalAutomatedChanges: changelog.length,
    humanReviewItemsCount: reviewQueue.length
  };

  return { cleanedRows, reviewQueue, changelog, summary };
}

/**
 * Converts an array of row objects to a CSV string.
 */
function rowsToCsvString(
  rows,
  headers = ['Name', 'DOB', 'Email', 'Screening Result', 'Date Recorded']
) {
  return stringify(protectRows(rows), { header: true, columns: headers });
}

module.exports = { applySafeCleaning, rowsToCsvString };

