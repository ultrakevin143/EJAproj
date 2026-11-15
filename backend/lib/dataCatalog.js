const DATA_CATALOG = [
  {
    field: 'Member name and ID',
    owner: 'Membership operations',
    source: 'Front desk CRM; integrated warehouse',
    classification: 'Personal',
    access: 'Front desk, clinic, manager, steward, administrator; turnstile receives member ID only',
    policy: 'Use for enrollment, identity matching, and approved operations.',
    handling: 'Used for member matching and operations. The manager view omits clinical details.'
  },
  {
    field: 'Date of birth and email',
    owner: 'Membership operations',
    source: 'Front desk CRM; CSV audit sessions',
    classification: 'Personal',
    access: 'Front desk, steward, administrator',
    policy: 'Collect only for member contact and age-related records; do not show in manager or access-control views.',
    handling: 'Not returned to the manager, clinic, or turnstile screens.'
  },
  {
    field: 'PAR-Q result, heart rate, medical flag, notes',
    owner: 'Clinic lead',
    source: 'Clinic screenings; uploaded CSVs',
    classification: 'Restricted health information',
    access: 'Clinic, steward, administrator',
    policy: 'Use for clinical assessment and safety decisions; restrict detailed values to approved roles.',
    handling: 'Manager and front desk receive a generic restricted/active outcome; turnstile receives an access decision.'
  },
  {
    field: 'Member clearance outcome',
    owner: 'Clinic lead and data steward',
    source: 'ETL-derived integrated warehouse',
    classification: 'Sensitive operational information',
    access: 'Front desk and manager receive active/restricted; turnstile receives granted/denied; clinic, steward, administrator can access more detail through their protected workflows',
    policy: 'Share only the decision required for the role; do not disclose the clinical reason to front desk, manager, or turnstile.',
    handling: 'Medical reason details are masked outside the clinic, steward, and administrator workflows.'
  },
  {
    field: 'Check-in time, zone, and access result',
    owner: 'Facility operations',
    source: 'Turnstile scan records',
    classification: 'Internal operational information',
    access: 'Turnstile, manager, steward, administrator',
    policy: 'Use for facility access and service monitoring; avoid exposing health details in scan history.',
    handling: 'Recent scan views omit member names and clinical denial reasons.'
  },
  {
    field: 'CSV findings and review values',
    owner: 'Data quality steward',
    source: 'Audit sessions, review queue, cleaning history',
    classification: 'Restricted when rows contain personal or health data',
    access: 'Steward and administrator',
    policy: 'Review corrections before applying them; retain actor, note, and cleaning history.',
    handling: 'Protected routes; read, review, cleaning, and export actions are recorded in the audit log.'
  },
  {
    field: 'ETL issues and field lineage',
    owner: 'Data quality steward',
    source: 'ETL pipeline runs',
    classification: 'Internal; issue values may contain personal data',
    access: 'Steward and administrator',
    policy: 'Retain run status and lineage; attribute issue decisions to the reviewing account.',
    handling: 'Review decisions require a note and are attributed to the signed-in account.'
  },
  {
    field: 'Audit events',
    owner: 'System administrator',
    source: 'Backend application actions',
    classification: 'Internal governance record',
    access: 'Steward and administrator',
    policy: 'Append actions for accountability; do not expose logs to operational roles.',
    handling: 'The API only appends events; no application route edits or deletes existing events.'
  },
  {
    field: 'Password hashes and database connection settings',
    owner: 'System administrator',
    source: 'Backend/.env.local',
    classification: 'Secret',
    access: 'Backend runtime only; never returned by an API route',
    policy: 'Store outside source control and rotate if exposed.',
    handling: 'Keep local environment files out of Git and do not put these values in frontend code.'
  }
];

module.exports = { DATA_CATALOG };
