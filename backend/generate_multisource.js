/**
 * Multi-Source Dataset Generator for Philippine Fitness Enterprise Data Integration (ETL)
 * Domain: Athletic Club Member Health Screening & Facility Access Management
 * 
 * Generates 3 disparate source systems with authentic Filipino names and gym screening data:
 *   Source 1: Front-Desk Member Registration CRM (source1_crm_members.csv)
 *   Source 2: Medical Clinic Health Screening & PAR-Q (source2_clinic_screenings.csv)
 *   Source 3: Facility Turnstile IoT RFID Gate Log (source3_turnstile_checkins.csv)
 */

const { stringify } = require('csv-stringify/sync');
const fs = require('fs');
const path = require('path');

// Authentic Filipino Name Repositories
const FILIPINO_FIRST_NAMES = [
  'Juan', 'Maria', 'Jose', 'Antonio', 'Francisco', 'Manuel', 'Ramon', 'Eduardo',
  'Danilo', 'Rodrigo', 'Carlos', 'Angelo', 'Christian', 'Joshua', 'Paolo', 'Alden',
  'Enrique', 'Gerald', 'Kiefer', 'Manny', 'Efren', 'John Lloyd', 'Kevin', 'Clarence',
  'Benedict', 'Dheyan', 'Angel', 'Bea', 'Kathryn', 'Marian', 'Liza', 'Pia',
  'Catriona', 'Hidilyn', 'Alyssa', 'Marites', 'Janice', 'Elena', 'Danica', 'Kristine',
  'Sarah', 'Mae Ann', 'Rhea', 'Lorna', 'Rosario', 'Divina', 'Carmela', 'Rowena',
  'Jocelyn', 'Arlene', 'Mark', 'Renato', 'Gabriel', 'Vicente', 'Ferdinand', 'Leandro'
];

const FILIPINO_LAST_NAMES = [
  'Dela Cruz', 'Santos', 'Reyes', 'Garcia', 'Mendoza', 'Ramos', 'Flores', 'Gonzales',
  'Bautista', 'Villanueva', 'Fernandez', 'Cruz', 'De Leon', 'Lopez', 'Tolentino',
  'Aquino', 'Soriano', 'Navarro', 'Alvarez', 'Castillo', 'Mercado', 'Pacaldo',
  'Amparado', 'Pino', 'Mequiabas', 'Maglinao', 'Racal', 'Yulo', 'Pacquiao', 'Valdez',
  'Ravena', 'Alcantara', 'Salazar', 'Corpuz', 'Ocampo', 'Pascual', 'Manalo', 'Aguilar'
];

const FILIPINO_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'outlook.ph', 'up.edu.ph', 'ateneo.edu', 'dlsu.edu.ph', 'ust.edu.ph'
];

const GYM_TIERS = [
  'Standard Monthly',
  'Gold Annual Pass',
  'VIP Platinum All-Access',
  'Student / Youth Athlete'
];

const FACILITY_ZONES = [
  'Main Gym Floor (Free Weights & Machines)',
  'Cardio Deck (Treadmills & Ellipticals)',
  'High-Intensity HIIT Studio',
  'Olympic Swimming Pool',
  'Sauna & Steam Wellness Room',
  'Boxing & MMA Ring'
];

const CLINICAL_NOTES = [
  'Cleared for standard resistance and cardio; normal resting ECG.',
  'Hypertension Stage 1 noted; resting BP 145/95; requires cardiologist clearance letter.',
  'History of exertional chest tightness; flagged for 2D Echo stress evaluation.',
  'Post-viral respiratory check; resting heart rate 108 BPM (tachycardia); workout paused.',
  'Mild bronchial asthma; maintenance inhaler present; cleared for moderate exercise.',
  'Previous right knee ACL reconstruction; cleared for upper body and spin bike only.',
  'Type 2 diabetes managed with oral hypoglycemic; cleared with hydration protocol.',
  'Routine annual health screening complete; optimal cardiovascular vitals.',
  'Elevated resting pulse observed; referral issued to club physician for clearance.'
];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFormatDate(date) {
  const formats = [
    date.toISOString().split('T')[0], // YYYY-MM-DD
    `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`, // MM/DD/YYYY
    `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}` // DD-MM-YYYY
  ];
  return randomChoice(formats);
}

function generateFilipinoDatasets(count = 150) {
  const members = [];
  const screenings = [];
  const checkins = [];

  for (let i = 1; i <= count; i++) {
    const memberId = `MBR-${String(1000 + i)}`;

    // ─── SOURCE 1: Front-Desk CRM (Member Registration) ──────
    const firstName = randomChoice(FILIPINO_FIRST_NAMES);
    const lastName = randomChoice(FILIPINO_LAST_NAMES);
    let fullName = `${firstName} ${lastName}`;

    const birthYear = randomInt(1955, 2007);
    const birthMonth = randomInt(0, 11);
    const birthDay = randomInt(1, 28);
    const birthDate = new Date(birthYear, birthMonth, birthDay);
    let dobFormatted = randomFormatDate(birthDate);

    const emailUser = `${firstName.toLowerCase().replace(/\s+/g, '.')}.${lastName.toLowerCase().replace(/\s+/g, '')}${randomInt(1, 99)}`;
    let email = `${emailUser}@${randomChoice(FILIPINO_EMAIL_DOMAINS)}`;
    const tier = randomChoice(GYM_TIERS);

    // Intentional Source 1 DQM Anomalies (for classroom auditing):
    if (i % 22 === 0) fullName = firstName; // Single-token name (needs human review)
    if (i % 25 === 0) dobFormatted = ''; // Missing Date of Birth
    if (i % 18 === 0) email = email.replace('@', ''); // Malformed email syntax
    if (i % 14 === 0) fullName = fullName.toUpperCase(); // Inconsistent uppercase casing

    members.push({
      member_id: memberId,
      full_name: fullName,
      dob: dobFormatted,
      email: email,
      membership_tier: tier
    });

    // ─── SOURCE 2: Clinic Screenings (PAR-Q & Resting Heart Rate) ─
    // ~10% of members have not completed their PAR-Q screening (unperformed join)
    const hasScreening = i % 11 !== 0;
    if (hasScreening) {
      // Controlled vocab vs dirty abbreviations
      let parq = randomChoice([
        'Cleared', 'Cleared', 'Cleared', 'Flagged',
        'Clrd', 'Fla', 'Pending', 'Unknown', ''
      ]);

      let hr = randomInt(58, 98);
      const assessDaysAgo = randomInt(1, 300);
      const assessDateObj = new Date(Date.now() - assessDaysAgo * 86400000);
      let assessDate = randomFormatDate(assessDateObj);
      let note = randomChoice(CLINICAL_NOTES);

      // Intentional Source 2 DQM Anomalies:
      if (i % 30 === 0) hr = 260; // Physiologically impossible resting heart rate
      if (i % 28 === 0) assessDate = '2025-13-01'; // Impossible month
      if (parq === 'Flagged' || parq === 'Fla' || hr > 100) {
        parq = parq === 'Fla' ? 'Fla' : 'Flagged';
        note = 'Cardiovascular risk flagged on PAR-Q. Physical turnstile access restricted pending doctor sign-off.';
      }

      const isMedicalFlag = parq === 'Flagged' || parq === 'Fla' || hr > 100;

      screenings.push({
        member_id: memberId,
        parq_status: parq,
        resting_heart_rate: hr,
        assessment_date: assessDate,
        medical_flag: isMedicalFlag ? 'YES' : 'NO',
        notes: note
      });
    }

    // ─── SOURCE 3: Facility Turnstile IoT Check-ins ───────────
    const scanCount = randomInt(1, 3);
    for (let c = 0; c < scanCount; c++) {
      const checkinId = `CHK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const daysAgo = randomInt(0, 14);
      const scanDate = new Date(Date.now() - daysAgo * 86400000 - randomInt(0, 86400000));
      const zone = randomChoice(FACILITY_ZONES);

      let checkinMemberId = memberId;
      // Intentional Source 3 anomaly: Orphan check-in (ID not registered in CRM)
      if (i === 15 || i === 45 || i === 75 || i === 105) {
        checkinMemberId = `MBR-${randomInt(9000, 9999)}`;
      }

      checkins.push({
        checkin_id: checkinId,
        member_id: checkinMemberId,
        scan_time: scanDate.toISOString(),
        facility_zone: zone,
        access_granted: 'GRANTED',
        denial_reason: ''
      });
    }
  }

  return { members, screenings, checkins };
}

function writeDatasetsToDisk(targetDir) {
  const dir = targetDir || path.join(__dirname, 'data_sources');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const { members, screenings, checkins } = generateFilipinoDatasets(150);

  const membersCsv = stringify(members, { header: true });
  const screeningsCsv = stringify(screenings, { header: true });
  const checkinsCsv = stringify(checkins, { header: true });

  fs.writeFileSync(path.join(dir, 'source1_crm_members.csv'), membersCsv);
  fs.writeFileSync(path.join(dir, 'source2_clinic_screenings.csv'), screeningsCsv);
  fs.writeFileSync(path.join(dir, 'source3_turnstile_checkins.csv'), checkinsCsv);

  console.log(`✅ Filipino Multi-Source Datasets generated in: ${dir}`);
  console.log(`   • Source 1 (CRM Members): ${members.length} records`);
  console.log(`   • Source 2 (Clinic Screenings): ${screenings.length} records`);
  console.log(`   • Source 3 (Turnstile Scans): ${checkins.length} records`);

  return { members, screenings, checkins, dir };
}

if (require.main === module) {
  writeDatasetsToDisk();
}

module.exports = {
  generateFilipinoDatasets,
  generateMultiSourceDatasets: generateFilipinoDatasets,
  writeDatasetsToDisk
};
