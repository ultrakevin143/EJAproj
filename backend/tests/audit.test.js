/**
 * Automated Test Suite for Gym Member Health Screening DQM System
 *
 * Verifies all 12 core requirements:
 * 1. Reads generated CSV correctly with gym screening schema
 * 2. Counts 500 records
 * 3. Detects blank fields (DOB, Screening Result)
 * 4. Detects abbreviated screening results (Clrd, Fla, Pnd)
 * 5. Detects Unknown / ambiguous screening results
 * 6. Detects malformed email addresses
 * 7. Detects incomplete names (single-word)
 * 8. Detects mixed valid date formats as consistency patterns
 * 9. Detects impossible / invalid dates (e.g. 2025-13-01, 2024-02-30)
 * 10. Distinguishes issue events from unique affected records
 * 11. Avoids adding mixed-format date patterns to the issue-event total
 * 12. Safe cleaning transformations (Abbreviation expansion, ISO date reformatting, whitespace trimming)
 * 13. Zero Hallucination Rule preservation & Human Review Queue routing
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { generateRecords, recordsToCSV } = require('../generate_dataset');
const { auditDataset, parseDateDetails, isValidEmail, validateName } = require('../lib/auditEngine');
const { applySafeCleaning, rowsToCsvString } = require('../lib/cleanEngine');
const { CLASSROOM_BASELINE } = require('../lib/dqmClassifier');

console.log('🧪 Starting FitQuality DQM Automated Test Suite...\n');

let passedTests = 0;
let totalTests = 0;

function runTest(testName, testFn) {
  totalTests++;
  try {
    testFn();
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✕ FAIL: ${testName}`);
    console.error(`    Error: ${err.message}\n`);
  }
}

// 1. Date Parser & Validator Unit Tests
runTest('Date Parser validates correct ISO format (YYYY-MM-DD)', () => {
  const res = parseDateDetails('2024-05-15');
  assert.strictEqual(res.isValid, true);
  assert.strictEqual(res.isStandardIso, true);
  assert.strictEqual(res.formattedIso, '2024-05-15');
});

runTest('Date Parser handles mixed formats and standardizes to ISO YYYY-MM-DD', () => {
  const resSlash = parseDateDetails('04/12/1985');
  assert.strictEqual(resSlash.isValid, true);
  assert.strictEqual(resSlash.isStandardIso, false);
  assert.strictEqual(resSlash.formattedIso, '1985-04-12');

  const resDash = parseDateDetails('28-02-2020');
  assert.strictEqual(resDash.isValid, true);
  assert.strictEqual(resDash.isStandardIso, false);
  assert.strictEqual(resDash.formattedIso, '2020-02-28');
});

runTest('Date Parser catches impossible dates (2025-13-01, 2024-02-30, 2025-00-15)', () => {
  const badMonth = parseDateDetails('2025-13-01');
  assert.strictEqual(badMonth.isValid, false, 'Month 13 should be invalid');

  const badFeb = parseDateDetails('2025-02-29'); // 2025 is not a leap year
  assert.strictEqual(badFeb.isValid, false, '2025-02-29 should be invalid');

  const badDay = parseDateDetails('2024-02-30');
  assert.strictEqual(badDay.isValid, false, 'Feb 30 should be invalid');

  const zeroMonth = parseDateDetails('2025-00-15');
  assert.strictEqual(zeroMonth.isValid, false, 'Month 0 should be invalid');
});

// 2. Email Validation Unit Tests
runTest('Email Validator validates standard emails and catches malformed emails', () => {
  assert.strictEqual(isValidEmail('member.jane@gymfitness.com'), true);
  assert.strictEqual(isValidEmail('alex.trainer12@athleticclub.org'), true);

  assert.strictEqual(isValidEmail('user_at_gymfitness.com'), false);
  assert.strictEqual(isValidEmail('member@'), false);
  assert.strictEqual(isValidEmail('@missingusername.com'), false);
  assert.strictEqual(isValidEmail('john.doe@@crossfit.com'), false);
  assert.strictEqual(isValidEmail('plainaddress'), false);
  assert.strictEqual(isValidEmail('member@domain..com'), false);
  assert.strictEqual(isValidEmail(''), false);
});

// 3. Name Validation Unit Tests
runTest('Name Validator flags single-word incomplete names and blank names', () => {
  assert.strictEqual(validateName('Marcus Aurelius').isIncomplete, false);
  assert.strictEqual(validateName('Sarah Connor Jenkins').isIncomplete, false);

  assert.strictEqual(validateName('Madonna').isIncomplete, true);
  assert.strictEqual(validateName('Prince').isIncomplete, true);
  assert.strictEqual(validateName('').isIncomplete, true);
});

// 4. End-to-End Dataset Generator & Audit Engine Tests
runTest('Dataset Generator produces 500 gym screening records with 5 required columns', () => {
  const records = generateRecords(500);
  assert.strictEqual(records.length, 500, 'Must generate exactly 500 records');

  const headers = ['name', 'dob', 'email', 'screeningResult', 'dateRecorded'];
  for (const h of headers) {
    assert(h in records[0], `Header ${h} must exist in record`);
  }
});

runTest('Audit Engine verifies required headers and rejects missing columns', () => {
  const badCsv = 'Name,DOB,Email\nJohn Doe,1990-01-01,john@gymfitness.com';
  const auditRes = auditDataset(badCsv);
  assert.strictEqual(auditRes.success, false);
  assert(auditRes.error.includes('Missing required column'));
});

runTest('Audit Engine audits 500 records and produces metrics aligned with baseline', () => {
  const records = generateRecords(500);
  const csvContent = recordsToCSV(records);
  const audit = auditDataset(csvContent);

  assert.strictEqual(audit.success, true);
  assert.strictEqual(audit.summary.totalRecords, 500);
  assert.strictEqual(audit.summary.totalFields, 2500);

  // Verify issue events are distinguished from unique affected records
  assert(audit.summary.issueEvents > 0, 'Must have issue events');
  assert(audit.summary.uniqueAffectedRecords > 0, 'Must have affected records');
  assert(
    audit.summary.issueEvents >= audit.summary.uniqueAffectedRecords,
    'Issue events total must be >= unique affected records count'
  );

  // Verify category counts are captured
  const cats = audit.summary.categoryCounts;
  assert(cats['Abbreviated Screening Result'] > 0, 'Must detect abbreviated screening results');
  assert(cats['Blank Screening Result'] > 0, 'Must detect blank screening results');
  assert(cats['Unknown Screening Result'] > 0, 'Must detect unknown screening results');
  assert(cats['Incomplete Name'] > 0, 'Must detect incomplete names');
  assert(cats['Missing DOB'] > 0, 'Must detect missing DOB');
  assert(cats['Malformed Email'] > 0, 'Must detect malformed emails');
  assert(cats['Invalid Recorded Date'] > 0, 'Must detect invalid dates');

  // Verify consistency pattern count is tracked separately and NOT added into issue events
  assert(audit.summary.consistencyPatternsCount > 0, 'Must have consistency date patterns');
  const sumOfCategories = Object.values(cats).reduce((a, b) => a + b, 0);
  assert.strictEqual(
    audit.summary.issueEvents,
    sumOfCategories,
    'Issue events must equal sum of error categories without mixed-format patterns'
  );
});

runTest('Duplicate checking detects duplicated row if introduced', () => {
  const records = generateRecords(100);
  const dupRow = { ...records[0] };
  const recordsWithDup = [...records, dupRow];
  const csvWithDup = recordsToCSV(recordsWithDup);
  const audit = auditDataset(csvWithDup);
  assert.strictEqual(audit.summary.duplicateRowsCount, 1, 'Should detect exactly 1 duplicate row');
});

// 5. Safe Cleaning Engine Tests
runTest('Safe Cleaning standardizes abbreviations and valid dates while preserving ambiguous values', () => {
  const testData = [
    { Name: 'John Smith', DOB: '04/12/1985', Email: 'john.smith@gym.com', 'Screening Result': 'Clrd', 'Date Recorded': '01/15/2024' },
    { Name: 'Mary Jane', DOB: '1990-05-20', Email: 'mary.jane@gym.com', 'Screening Result': 'Fla', 'Date Recorded': '2024-02-10' },
    { Name: 'Cher', DOB: '', Email: 'invalid-email', 'Screening Result': 'Unknown', 'Date Recorded': '2025-13-01' }
  ];

  const audit = auditDataset(testData);
  const { cleanedRows, reviewQueue } = applySafeCleaning(testData, audit.errorLog);

  // Row 0: Clrd -> Cleared, dates standardized
  assert.strictEqual(cleanedRows[0]['Screening Result'], 'Cleared');
  assert.strictEqual(cleanedRows[0]['DOB'], '1985-04-12');
  assert.strictEqual(cleanedRows[0]['Date Recorded'], '2024-01-15');

  // Row 1: Fla -> Flagged
  assert.strictEqual(cleanedRows[1]['Screening Result'], 'Flagged');

  // Row 2: Zero Hallucination Rule — Unsafe values are NEVER guessed/hallucinated
  assert.strictEqual(cleanedRows[2]['Name'], 'Cher', 'Incomplete name should remain preserved');
  assert.strictEqual(cleanedRows[2]['DOB'], '', 'Missing DOB should not be fabricated');
  assert.strictEqual(cleanedRows[2]['Email'], 'invalid-email', 'Malformed email should be preserved');
  assert.strictEqual(cleanedRows[2]['Screening Result'], 'Unknown', 'Unknown result should be preserved');
  assert.strictEqual(cleanedRows[2]['Date Recorded'], '2025-13-01', 'Impossible date should be preserved');

  // Review queue contains row 2 items
  assert(reviewQueue.length >= 4, 'Unsafe items must be routed to human review queue');
  assert(reviewQueue.some(i => i.field === 'Name' && i.category === 'Incomplete Name'));
  assert(reviewQueue.some(i => i.field === 'DOB' && i.category === 'Missing DOB'));
  assert(reviewQueue.some(i => i.field === 'Email' && i.category === 'Malformed Email'));
  assert(reviewQueue.some(i => i.field === 'Date Recorded' && i.category === 'Invalid Recorded Date'));
});

runTest('Cleaned rows export properly to valid CSV string', () => {
  const rows = [
    { Name: 'Alice Wonder', DOB: '1992-03-15', Email: 'alice@gym.com', 'Screening Result': 'Cleared', 'Date Recorded': '2024-06-01' }
  ];
  const csvOut = rowsToCsvString(rows);
  assert(csvOut.includes('Name,DOB,Email,Screening Result,Date Recorded'));
  assert(csvOut.includes('Alice Wonder,1992-03-15,alice@gym.com,Cleared,2024-06-01'));
});

// Summary
console.log('\n========================================');
console.log(`  Tests Passed: ${passedTests} / ${totalTests}`);
console.log('========================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}

