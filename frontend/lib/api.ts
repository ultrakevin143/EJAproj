const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export async function fetchHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  return res.json();
}

export async function uploadDataset(file: File) {
  const formData = new FormData();
  formData.append('csvFile', file);
  const res = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    body: formData
  });
  return res.json();
}

export async function generateSampleDataset() {
  const res = await fetch(`${BASE_URL}/upload/generate-sample`, {
    method: 'POST'
  });
  return res.json();
}

export async function fetchLatestAudit() {
  const res = await fetch(`${BASE_URL}/audit/latest`);
  return res.json();
}

export async function fetchAuditBySession(sessionId: string) {
  const res = await fetch(`${BASE_URL}/audit/${sessionId}`);
  return res.json();
}

export async function applySafeCleaning(sessionId: string) {
  const res = await fetch(`${BASE_URL}/clean/${sessionId}`, {
    method: 'POST'
  });
  return res.json();
}

export async function fetchComparison(sessionId: string) {
  const res = await fetch(`${BASE_URL}/clean/${sessionId}/compare`);
  return res.json();
}

export async function fetchReviewQueue(sessionId: string) {
  const res = await fetch(`${BASE_URL}/review/${sessionId}`);
  return res.json();
}

export async function updateReviewItem(
  sessionId: string,
  data: { id: string; status?: string; notes?: string; manualValue?: string }
) {
  const res = await fetch(`${BASE_URL}/review/${sessionId}/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function fetchGovernanceRules() {
  const res = await fetch(`${BASE_URL}/governance`);
  return res.json();
}

export async function createGovernanceRule(rule: {
  rule_name: string;
  rule_description: string;
  dqm_principle: string;
  enforcement_level: string;
}) {
  const res = await fetch(`${BASE_URL}/governance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rule)
  });
  return res.json();
}

export async function toggleGovernanceRule(id: string) {
  const res = await fetch(`${BASE_URL}/governance/${id}/toggle`, {
    method: 'PUT'
  });
  return res.json();
}

export function getExportUrl(sessionId: string, type: string) {
  return `${BASE_URL}/export/${sessionId}/${type}`;
}

