/**
 * Gym Member Health Screening Dataset Generator
 * Produces 500 synthetic records with intentional DQM issues.
 *
 * Fields: Name | DOB | Email | Screening Result | Date Recorded
 * Screening Results: Cleared | Flagged | Pending  (and abbrev. errors)
 */

const { faker } = require('@faker-js/faker');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs');

function createWriter(filePath) {
  return createCsvWriter({
    path: filePath || path.join(__dirname, 'sample_dataset.csv'),
    header: [
      { id: 'name', title: 'Name' },
      { id: 'dob', title: 'DOB' },
      { id: 'email', title: 'Email' },
      { id: 'screeningResult', title: 'Screening Result' },
      { id: 'dateRecorded', title: 'Date Recorded' }
    ]
  });
}

function randomFormatDate(date) {
  const formats = [
    date.toISOString().split('T')[0],                              // YYYY-MM-DD
    `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`, // DD/MM/YYYY
    `${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}`  // MM-DD-YYYY
  ];
  return formats[Math.floor(Math.random() * formats.length)];
}

function generateRecord() {
  let name = faker.person.fullName();
  let dob = faker.date.birthdate({ min: 16, max: 70, mode: 'age' });
  let dobFormatted = randomFormatDate(dob);
  let email = faker.internet.email();

  // Normal results with abbreviation errors mixed in
  let screeningResult = faker.helpers.arrayElement([
    'Cleared', 'Flagged', 'Pending',
    'Clrd', 'Fla', 'Pnd',
    ''
  ]);

  let dateRecorded = randomFormatDate(faker.date.recent({ days: 1000 }));

  // Inject intentional DQM errors
  if (Math.random() < 0.05) name = name.split(' ')[0];         // Incomplete name
  if (Math.random() < 0.05) dobFormatted = '';                  // Missing DOB
  if (Math.random() < 0.05) email = email.replace('@', '');     // Malformed email
  if (Math.random() < 0.05) screeningResult = 'Unknown';        // Unknown/ambiguous result
  if (Math.random() < 0.05) dateRecorded = '2025-13-01';        // Impossible date

  return {
    name,
    dob: dobFormatted,
    email,
    screeningResult,
    dateRecorded
  };
}

function generateRecords(count = 500) {
  const records = [];
  for (let i = 0; i < count; i++) {
    records.push(generateRecord());
  }
  return records;
}

function recordsToCSV(records) {
  const headers = ['Name', 'DOB', 'Email', 'Screening Result', 'Date Recorded'];
  const lines = [headers.join(',')];
  for (const r of records) {
    const vals = [
      r.name ?? r.Name ?? '',
      r.dob ?? r.DOB ?? '',
      r.email ?? r.Email ?? '',
      r.screeningResult ?? r['Screening Result'] ?? '',
      r.dateRecorded ?? r['Date Recorded'] ?? ''
    ];
    const escaped = vals.map(v => {
      const s = String(v);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    });
    lines.push(escaped.join(','));
  }
  return lines.join('\n');
}

async function generateDataset(filePath) {
  const targetPath = filePath || path.join(__dirname, 'sample_dataset.csv');
  const csvWriter = createWriter(targetPath);
  const records = generateRecords(500);
  await csvWriter.writeRecords(records);
  console.log(`✅ Generated ${targetPath} with 500 gym member records (with intentional DQM errors)`);
  return { filePath: targetPath, records };
}

if (require.main === module) {
  const targetPath = process.argv[2] || path.join(__dirname, 'sample_dataset.csv');
  generateDataset(targetPath);
}

module.exports = { generateRecord, randomFormatDate, generateRecords, generateDataset, recordsToCSV };

