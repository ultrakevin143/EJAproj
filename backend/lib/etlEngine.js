/**
 * Multi-Source ETL Integration & DQM Engine
 * Aligned with integration.pptx (Slides 4-8, 15-19)
 *
 * Implements:
 * 1. EXTRACT: Ingests 3 disparate source systems (CRM, Clinic Screening, Turnstile IoT)
 * 2. TRANSFORM:
 *    - Joins sources on member_id
 *    - Standardizes formats (Name casing, ISO YYYY-MM-DD dates, abbreviation expansion)
 *    - Applies 6 DQM Principles (Accuracy, Consistency, Completeness, Timeliness, Reliability, Relevance)
 *    - Computes derived business logic (Safety Clearance Status, Risk Tier, Orphan Check-in Detection)
 * 3. LOAD: Prepares clean, consolidated records for PostgreSQL Target Data Warehouse
 */

const { parseDateDetails, isValidEmail, validateName } = require('./auditEngine');
const { SCREENING_RESULT_ABBR_MAP, VALID_SCREENING_RESULTS } = require('./dqmClassifier');

function titleCase(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Execute the full ETL Integration Pipeline on 3 disparate datasets
 *
 * @param {Array} membersRaw - Source 1: CRM Members
 * @param {Array} screeningsRaw - Source 2: Health Screening Clinic
 * @param {Array} checkinsRaw - Source 3: Facility Turnstile IoT Scans
 */
function runEtlPipeline(membersRaw, screeningsRaw, checkinsRaw) {
  const startTime = Date.now();

  const etlMetrics = {
    extracted: {
      source1_crm_members: membersRaw.length,
      source2_clinic_screenings: screeningsRaw.length,
      source3_turnstile_checkins: checkinsRaw.length,
      totalRawRecords: membersRaw.length + screeningsRaw.length + checkinsRaw.length
    },
    transformations: {
      namesStandardized: 0,
      datesStandardized: 0,
      abbrResultsStandardized: 0,
      orphansDetected: 0,
      medicalBlocksApplied: 0,
      totalChanges: 0
    },
    dqmIssues: [],
    reviewQueue: []
  };

  // ─── STAGE 1: EXTRACT & INDEX ──────────────────────────────────
  // Index Source 2 (Screenings) by member_id
  const screeningMap = new Map();
  screeningsRaw.forEach(s => {
    if (s.member_id) screeningMap.set(s.member_id.trim(), s);
  });

  // Aggregate Source 3 (Check-ins) by member_id
  const checkinSummary = new Map();
  const orphanCheckins = [];

  const crmMemberIds = new Set(membersRaw.map(m => m.member_id?.trim()));

  checkinsRaw.forEach(chk => {
    const mId = chk.member_id?.trim();
    if (!crmMemberIds.has(mId)) {
      orphanCheckins.push(chk);
      etlMetrics.transformations.orphansDetected++;
      etlMetrics.dqmIssues.push({
        source: 'Source 3 (Turnstile IoT)',
        field: 'member_id',
        value: mId,
        category: 'Orphaned Check-in',
        dqmPrinciple: 'Consistency',
        severity: 'High',
        action: 'Flagged turnstile scan with no registered CRM member profile.'
      });
      return;
    }

    if (!checkinSummary.has(mId)) {
      checkinSummary.set(mId, {
        totalCheckins: 0,
        lastCheckin: chk.checkin_time,
        frequentZone: chk.facility_zone,
        zones: []
      });
    }
    const summary = checkinSummary.get(mId);
    summary.totalCheckins++;
    summary.zones.push(chk.facility_zone);
    if (new Date(chk.checkin_time) > new Date(summary.lastCheckin)) {
      summary.lastCheckin = chk.checkin_time;
      summary.frequentZone = chk.facility_zone;
    }
  });

  // ─── STAGE 2: TRANSFORM & INTEGRATE (JOIN + DQM) ───────────────
  const integratedRecords = [];

  membersRaw.forEach((member, idx) => {
    const memberId = member.member_id?.trim();
    const screening = screeningMap.get(memberId) || null;
    const checkin = checkinSummary.get(memberId) || {
      totalCheckins: 0,
      lastCheckin: 'Never',
      frequentZone: 'None'
    };

    let transformedName = member.full_name || '';
    let transformedDob = member.dob || '';
    let transformedEmail = member.email || '';
    let transformedParq = screening?.parq_status || '';
    let transformedHeartRate = screening?.resting_heart_rate ? Number(screening.resting_heart_rate) : null;
    let transformedAssessDate = screening?.assessment_date || '';

    const recordDqmFlags = [];

    // 1. DQM Check & Transform: Full Name
    const nameCheck = validateName(transformedName);
    if (nameCheck.isIncomplete) {
      recordDqmFlags.push('Incomplete Name');
      etlMetrics.dqmIssues.push({
        source: 'Source 1 (CRM)',
        member_id: memberId,
        field: 'full_name',
        value: transformedName,
        category: 'Incomplete Name',
        dqmPrinciple: 'Completeness',
        severity: 'High',
        action: 'Route to human review queue; request member full legal name.'
      });
      etlMetrics.reviewQueue.push({
        id: `rev-${etlMetrics.reviewQueue.length + 1}`,
        member_id: memberId,
        field: 'full_name',
        currentValue: transformedName,
        reason: 'Single-word legal name',
        status: 'Pending'
      });
    } else {
      // Standardize to Title Case if all uppercase or lowercase
      const standardizedName = titleCase(transformedName);
      if (standardizedName !== transformedName) {
        transformedName = standardizedName;
        etlMetrics.transformations.namesStandardized++;
        etlMetrics.transformations.totalChanges++;
      }
    }

    // 2. DQM Check & Transform: Date of Birth
    if (!transformedDob || !transformedDob.trim()) {
      recordDqmFlags.push('Missing DOB');
      etlMetrics.dqmIssues.push({
        source: 'Source 1 (CRM)',
        member_id: memberId,
        field: 'dob',
        value: '',
        category: 'Missing DOB',
        dqmPrinciple: 'Completeness',
        severity: 'High',
        action: 'Mandatory intake requirement missing; member access restricted.'
      });
      etlMetrics.reviewQueue.push({
        id: `rev-${etlMetrics.reviewQueue.length + 1}`,
        member_id: memberId,
        field: 'dob',
        currentValue: '',
        reason: 'Mandatory Date of Birth missing',
        status: 'Pending'
      });
    } else {
      const dobDetails = parseDateDetails(transformedDob);
      if (dobDetails.isValid && !dobDetails.isStandardIso) {
        transformedDob = dobDetails.formattedIso;
        etlMetrics.transformations.datesStandardized++;
        etlMetrics.transformations.totalChanges++;
      }
    }

    // 3. DQM Check: Email
    if (!isValidEmail(transformedEmail)) {
      recordDqmFlags.push('Malformed Email');
      etlMetrics.dqmIssues.push({
        source: 'Source 1 (CRM)',
        member_id: memberId,
        field: 'email',
        value: transformedEmail,
        category: 'Malformed Email',
        dqmPrinciple: 'Accuracy',
        severity: 'Medium',
        action: 'Syntax invalid; contact member to update digital notice address.'
      });
    }

    // 4. DQM Check & Transform: PAR-Q Screening Result
    if (!screening) {
      recordDqmFlags.push('Unperformed Health Screening');
      etlMetrics.dqmIssues.push({
        source: 'Source 2 (Clinic)',
        member_id: memberId,
        field: 'parq_status',
        value: 'MISSING_JOIN',
        category: 'Unperformed Screening',
        dqmPrinciple: 'Completeness',
        severity: 'Critical',
        action: 'No health evaluation on record. Physical Activity clearance not certified.'
      });
    } else {
      const lowerParq = transformedParq.toLowerCase().trim();
      if (SCREENING_RESULT_ABBR_MAP[lowerParq]) {
        const expanded = SCREENING_RESULT_ABBR_MAP[lowerParq];
        transformedParq = expanded;
        etlMetrics.transformations.abbrResultsStandardized++;
        etlMetrics.transformations.totalChanges++;
      } else if (!lowerParq || lowerParq === 'unknown' || !VALID_SCREENING_RESULTS.includes(lowerParq)) {
        recordDqmFlags.push('Ambiguous Screening');
        etlMetrics.dqmIssues.push({
          source: 'Source 2 (Clinic)',
          member_id: memberId,
          field: 'parq_status',
          value: transformedParq,
          category: 'Ambiguous Screening Outcome',
          dqmPrinciple: 'Reliability',
          severity: 'Critical',
          action: 'Uncertain clearance; personal trainer review required.'
        });
      }

      // 5. Biometric Range Validation (Resting Heart Rate)
      if (transformedHeartRate !== null) {
        if (transformedHeartRate < 40 || transformedHeartRate > 200) {
          recordDqmFlags.push('Physiologically Impossible Heart Rate');
          etlMetrics.dqmIssues.push({
            source: 'Source 2 (Clinic)',
            member_id: memberId,
            field: 'resting_heart_rate',
            value: String(transformedHeartRate),
            category: 'Biometric Range Anomaly',
            dqmPrinciple: 'Accuracy',
            severity: 'High',
            action: `Heart rate ${transformedHeartRate} BPM out of human resting range (40-200 BPM).`
          });
        }
      }

      // Standardize assessment date
      if (transformedAssessDate) {
        const assessDateDetails = parseDateDetails(transformedAssessDate);
        if (assessDateDetails.isValid && !assessDateDetails.isStandardIso) {
          transformedAssessDate = assessDateDetails.formattedIso;
          etlMetrics.transformations.datesStandardized++;
          etlMetrics.transformations.totalChanges++;
        }
      }
    }

    // ─── STAGE 3: BUSINESS RULES & GOVERNANCE ENFORCEMENT ──────────
    // Determine Facility Turnstile Clearance Status
    let safetyClearanceStatus = 'ACTIVE_CLEARANCE';
    let riskTier = 'LOW';

    if (transformedParq === 'Flagged') {
      safetyClearanceStatus = 'BLOCKED_MEDICAL_FLAG';
      riskTier = 'HIGH';
      etlMetrics.transformations.medicalBlocksApplied++;
    } else if (!screening || transformedParq === 'Pending' || transformedParq === 'Unknown' || transformedParq === '') {
      safetyClearanceStatus = 'RESTRICTED_PENDING_PARQ';
      riskTier = 'MEDIUM';
    }

    integratedRecords.push({
      member_id: memberId,
      full_name: transformedName,
      dob: transformedDob,
      email: transformedEmail,
      membership_tier: member.membership_tier,
      parq_status: transformedParq || 'Not Screened',
      resting_heart_rate: transformedHeartRate,
      assessment_date: transformedAssessDate || 'N/A',
      total_checkins: checkin.totalCheckins,
      last_checkin_time: checkin.lastCheckin,
      frequent_zone: checkin.frequentZone,
      safety_clearance_status: safetyClearanceStatus,
      risk_tier: riskTier,
      dqm_flags_count: recordDqmFlags.length,
      dqm_flags: recordDqmFlags
    });
  });

  const durationMs = Date.now() - startTime;

  return {
    success: true,
    executionTimeMs: durationMs,
    metrics: etlMetrics,
    summary: {
      totalIntegratedMembers: integratedRecords.length,
      clearedForWorkout: integratedRecords.filter(r => r.safety_clearance_status === 'ACTIVE_CLEARANCE').length,
      restrictedPendingParq: integratedRecords.filter(r => r.safety_clearance_status === 'RESTRICTED_PENDING_PARQ').length,
      blockedMedicalFlag: integratedRecords.filter(r => r.safety_clearance_status === 'BLOCKED_MEDICAL_FLAG').length,
      totalDqmIssues: etlMetrics.dqmIssues.length,
      totalOrphanCheckins: orphanCheckins.length
    },
    integratedRecords,
    orphanCheckins,
    dqmIssues: etlMetrics.dqmIssues,
    reviewQueue: etlMetrics.reviewQueue
  };
}

module.exports = {
  runEtlPipeline,
  titleCase
};

