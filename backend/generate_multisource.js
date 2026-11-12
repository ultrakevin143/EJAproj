/**
 * Multi-Source Dataset Generator for Fitness Enterprise Data Integration (ETL)
 * Aligned with integration.pptx (Slides 4-8, 15-19)
 *
 * Generates 3 disparate source systems that must be Extracted, Transformed, and Loaded:
 *
 * Source 1: Front-Desk Member Registration CRM (members_source.csv)
 *   Fields: member_id, full_name, dob, email, membership_tier
 *
 * Source 2: Medical & Fitness Health Screening Clinic (screening_source.csv)
 *   Fields: member_id, parq_status, resting_heart_rate, assessment_date, medical_flag
 *
 * Source 3: Facility RFID Gate & Turnstile Check-in Log (checkins_source.csv)
 *   Fields: checkin_id, member_id, checkin_time, facility_zone, gate_status
 */

const { faker } = require('@faker-js/faker');
const { stringify } = require('csv-stringify/sync');
const fs = require('fs');
const path = require('path');

function randomFormatDate(date) {
  const formats = [
    date.toISOString().split('T')[0], // YYYY-MM-DD
    `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`, // MM/DD/YYYY
    `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}` // DD-MM-YYYY
  ];
  return formats[Math.floor(Math.random() * formats.length)];
}

function generateMultiSourceDatasets(count = 300) {
  const members = [];
  const screenings = [];
  const checkins = [];

  const zones = ['Main Gym Floor', 'Cardio Deck', 'Swimming Pool', 'CrossFit Box', 'Sauna & Spa'];
  const tiers = ['Standard', 'Premium', 'VIP All-Access'];

  for (let i = 1; i <= count; i++) {
    const memberId = `MBR-${String(1000 + i)}`;

    // ─── SOURCE 1: Front-Desk CRM ──────────────────────────────
    let name = faker.person.fullName();
    let dob = faker.date.birthdate({ min: 16, max: 72, mode: 'age' });
    let dobFormatted = randomFormatDate(dob);
    let email = faker.internet.email();
    let tier = faker.helpers.arrayElement(tiers);

    // Intentional Source 1 anomalies
    if (Math.random() < 0.06) name = name.split(' ')[0]; // Single-word name
    if (Math.random() < 0.05) dobFormatted = ''; // Missing DOB
    if (Math.random() < 0.06) email = email.replace('@', ''); // Malformed email
    if (Math.random() < 0.08) name = name.toUpperCase(); // Uppercase formatting anomaly

    members.push({
      member_id: memberId,
      full_name: name,
      dob: dobFormatted,
      email: email,
      membership_tier: tier
    });

    // ─── SOURCE 2: Health Screening Assessment ─────────────────
    // Some members haven't completed their screening yet (missing join)
    const hasScreening = Math.random() > 0.08;
    if (hasScreening) {
      let parq = faker.helpers.arrayElement([
        'Cleared', 'Cleared', 'Flagged',
        'Clrd', 'Fla', 'Pnd', 'Unknown', ''
      ]);
      let hr = faker.number.int({ min: 55, max: 110 });
      let assessDate = randomFormatDate(faker.date.recent({ days: 365 }));
      let flag = parq === 'Flagged' || parq === 'Fla';

      // Intentional Source 2 anomalies
      if (Math.random() < 0.04) hr = 260; // Physiologically impossible resting HR
      if (Math.random() < 0.04) assessDate = '2025-13-01'; // Impossible month

      screenings.push({
        member_id: memberId,
        parq_status: parq,
        resting_heart_rate: hr,
        assessment_date: assessDate,
        medical_flag: flag ? 'YES' : 'NO'
      });
    }

    // ─── SOURCE 3: RFID Turnstile Check-ins ───────────────────
    // Generate 1-3 check-ins per member
    const checkinCount = faker.number.int({ min: 1, max: 3 });
    for (let c = 0; c < checkinCount; c++) {
      const checkinId = `CHK-${faker.string.alphanumeric(8).toUpperCase()}`;
      let checkinTime = faker.date.recent({ days: 30 }).toISOString();
      let zone = faker.helpers.arrayElement(zones);
      let gateStatus = 'GRANTED';

      // Intentional Source 3 anomaly: Orphaned check-in (ID does not exist in CRM)
      let checkinMemberId = memberId;
      if (Math.random() < 0.03) {
        checkinMemberId = `MBR-${faker.number.int({ min: 9000, max: 9999 })}`;
      }

      checkins.push({
        checkin_id: checkinId,
        member_id: checkinMemberId,
        checkin_time: checkinTime,
        facility_zone: zone,
        gate_status: gateStatus
      });
    }
  }

  return { members, screenings, checkins };
}

function writeDatasetsToDisk(targetDir) {
  const dir = targetDir || path.join(__dirname, 'data_sources');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const { members, screenings, checkins } = generateMultiSourceDatasets(300);

  const membersCsv = stringify(members, { header: true });
  const screeningsCsv = stringify(screenings, { header: true });
  const checkinsCsv = stringify(checkins, { header: true });

  fs.writeFileSync(path.join(dir, 'source1_crm_members.csv'), membersCsv);
  fs.writeFileSync(path.join(dir, 'source2_clinic_screenings.csv'), screeningsCsv);
  fs.writeFileSync(path.join(dir, 'source3_turnstile_checkins.csv'), checkinsCsv);

  console.log(`✅ Multi-source datasets generated in: ${dir}`);
  console.log(`   • Source 1 (CRM Members): ${members.length} records`);
  console.log(`   • Source 2 (Clinic Screenings): ${screenings.length} records`);
  console.log(`   • Source 3 (Turnstile Check-ins): ${checkins.length} records`);

  return { members, screenings, checkins, dir };
}

if (require.main === module) {
  writeDatasetsToDisk();
}

module.exports = {
  generateMultiSourceDatasets,
  writeDatasetsToDisk
};

