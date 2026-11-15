const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export function apiFetch(path: string, init: RequestInit = {}) {
  return fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: 'include'
  });
}

export async function login(email: string, password: string) {
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return res.json();
}

export async function fetchCurrentUser() {
  const res = await apiFetch('/auth/me');
  if (res.status === 401) return { success: false, user: null };
  return res.json();
}

export async function logout() {
  const res = await apiFetch('/auth/logout', { method: 'POST' });
  return res.json();
}

export async function fetchLatestEtlRun() {
  const res = await apiFetch('/roles/steward/latest-run');
  return res.json();
}

export async function updateEtlIssue(
  issueId: string,
  data: { status: 'Open' | 'Resolved' | 'Quarantined'; note?: string }
) {
  const res = await apiFetch(`/roles/steward/issues/${encodeURIComponent(issueId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function fetchHealth() {
  const res = await apiFetch('/health');
  return res.json();
}

export async function uploadDataset(file: File) {
  const formData = new FormData();
  formData.append('csvFile', file);
  const res = await apiFetch('/upload', {
    method: 'POST',
    body: formData
  });
  return res.json();
}

export async function generateSampleDataset() {
  const res = await apiFetch('/upload/generate-sample', {
    method: 'POST'
  });
  return res.json();
}

export async function fetchLatestAudit() {
  const res = await apiFetch('/audit/latest');
  return res.json();
}

export async function fetchAuditEvents() {
  const res = await apiFetch('/audit/events');
  return res.json();
}

export async function fetchAuditBySession(sessionId: string) {
  const res = await apiFetch(`/audit/${encodeURIComponent(sessionId)}`);
  return res.json();
}

export async function applySafeCleaning(sessionId: string) {
  const res = await apiFetch(`/clean/${encodeURIComponent(sessionId)}`, {
    method: 'POST'
  });
  return res.json();
}

export async function fetchComparison(sessionId: string) {
  const res = await apiFetch(`/clean/${encodeURIComponent(sessionId)}/compare`);
  return res.json();
}

export async function fetchReviewQueue(sessionId: string) {
  const res = await apiFetch(`/review/${encodeURIComponent(sessionId)}`);
  return res.json();
}

export async function updateReviewItem(
  sessionId: string,
  data: { id: string; status?: string; notes?: string; manualValue?: string }
) {
  const res = await apiFetch(`/review/${encodeURIComponent(sessionId)}/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function fetchGovernanceRules() {
  const res = await apiFetch('/governance');
  return res.json();
}

export async function fetchDataCatalog() {
  const res = await apiFetch('/governance/catalog');
  return res.json();
}

export async function createGovernanceRule(rule: {
  rule_name: string;
  rule_description: string;
  dqm_principle: string;
  enforcement_level: string;
}) {
  const res = await apiFetch('/governance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rule)
  });
  return res.json();
}

export async function toggleGovernanceRule(id: string) {
  const res = await apiFetch(`/governance/${encodeURIComponent(id)}/toggle`, {
    method: 'PUT'
  });
  return res.json();
}

export function getExportUrl(sessionId: string, type: string) {
  return `${BASE_URL}/export/${sessionId}/${type}`;
}

