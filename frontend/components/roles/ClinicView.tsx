'use client';

import React, { useState, useEffect } from 'react';
import { Stethoscope, Heart, AlertOctagon, CheckCircle2, AlertTriangle, RefreshCw, Search } from 'lucide-react';
import { apiFetch } from '../../lib/api';

interface Screening {
  member_id: string;
  parq_status: string;
  resting_heart_rate: number | null;
  assessment_date: string;
  medical_flag: string | boolean | null;
  notes: string;
}

function hasMedicalFlag(value: Screening['medical_flag']) {
  return value === true || (typeof value === 'string' && ['yes', 'true', '1', 'flagged'].includes(value.trim().toLowerCase()));
}

export default function ClinicView() {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [memberId, setMemberId] = useState('MBR-1150');
  const [parqStatus, setParqStatus] = useState('Flagged');
  const [restingHr, setRestingHr] = useState('114');
  const [medicalFlag, setMedicalFlag] = useState(true);
  const [notes, setNotes] = useState('Exertional tachycardia noted during treadmill evaluation. Referred for cardiologist clearance before high-intensity gym floor access.');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchScreenings = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/roles/clinic/screenings');
      const data = await res.json();
      if (data.success) {
        setScreenings(data.screenings || []);
      }
    } catch (err) {
      console.error('Failed to load clinic screenings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScreenings();
  }, []);

  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await apiFetch('/roles/clinic/screenings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: memberId.trim(),
          parq_status: parqStatus,
          resting_heart_rate: restingHr ? parseInt(restingHr, 10) : null,
          medical_flag: medicalFlag,
          notes
        })
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: data.message });
        fetchScreenings();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to save assessment' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Connection error' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredScreenings = screenings.filter((s) =>
    s.member_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.notes && s.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <span className="eyebrow">Source 02 · clinic screening</span>
          <h1>Clinical screening</h1>
          <p>
            Evaluate Physical Activity Readiness (PAR-Q), monitor resting biometric vitals, and record physician risk flags.
          </p>
        </div>
        <button onClick={fetchScreenings} className="btn btn-secondary">
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Assessments</span>
        </button>
      </div>

      {/* Summary Metrics Strip */}
      <dl className="dashboard-summary">
        <div>
          <dt>Total Clinical Evaluations</dt>
          <dd className="tabular-nums">{screenings.length}</dd>
          <span>Source 2: Clinic Screenings Table</span>
        </div>
        <div>
          <dt>Cleared for Exercise</dt>
          <dd className="tabular-nums text-emerald-700">
            {screenings.filter((s) => s.parq_status === 'Cleared').length}
          </dd>
          <span>Normal biometric profile</span>
        </div>
        <div>
          <dt>Cardiovascular / Medical Flags</dt>
          <dd className="tabular-nums text-red-700">
            {screenings.filter((s) => hasMedicalFlag(s.medical_flag) || s.parq_status === 'Flagged').length}
          </dd>
          <span>Turnstile access blocked</span>
        </div>
        <div>
          <dt>Clinical Role Boundary</dt>
          <dd className="text-sm font-semibold text-blue-900 mt-2">Active Isolation</dd>
          <span>No access to member billing or overrides</span>
        </div>
      </dl>

      {/* Form Card */}
      <div className="form-card mb-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900">Record Member Health Screening</h2>
            <p className="text-xs text-slate-500">
              Evaluations directly determine safety clearance status in the integrated warehouse.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setMemberId('MBR-1150');
              setParqStatus('Flagged');
              setRestingHr('114');
              setMedicalFlag(true);
              setNotes('Exertional tachycardia noted during treadmill evaluation. Referred for cardiologist clearance before high-intensity gym floor access.');
            }}
            className="text-xs text-blue-700 hover:underline font-semibold"
          >
            Autofill Sample (Danilo Mercado - Flagged)
          </button>
        </div>

        {feedback && (
          <div
            className={`p-3 rounded-md mb-4 text-xs font-medium flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSaveAssessment}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="form-group">
              <label>Member ID *</label>
              <input
                type="text"
                required
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                placeholder="MBR-1150"
                className="font-mono font-semibold"
              />
            </div>

            <div className="form-group">
              <label>PAR-Q Screening Outcome *</label>
              <select
                value={parqStatus}
                onChange={(e) => {
                  setParqStatus(e.target.value);
                  if (e.target.value === 'Flagged') setMedicalFlag(true);
                }}
              >
                <option value="Cleared">Cleared (Safe for Full Gym Access)</option>
                <option value="Flagged">Flagged (Medical Risk Detected)</option>
                <option value="Pending">Pending (Doctor Referral Required)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Resting Heart Rate (BPM)</label>
              <div className="relative">
                <input
                  type="number"
                  min="30"
                  max="250"
                  value={restingHr}
                  onChange={(e) => setRestingHr(e.target.value)}
                  placeholder="e.g. 72"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400">Normal: 60-100</span>
              </div>
            </div>
          </div>

          <div className="form-group mb-4">
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <input
                type="checkbox"
                id="medical_flag_chk"
                checked={medicalFlag}
                onChange={(e) => setMedicalFlag(e.target.checked)}
                className="h-4 w-4 text-red-600 rounded"
              />
              <label htmlFor="medical_flag_chk" className="text-xs font-semibold text-red-900 cursor-pointer">
                Medical &amp; Cardiovascular Risk Flag (Immediate Turnstile Lockout)
              </label>
            </div>
          </div>

          <div className="form-group mb-4">
            <label>Clinical Assessor Notes &amp; Observations</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. History of hypertension, ECG rhythm normal, cleared for light cardio only."
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              Evaluations are encrypted and stored in PostgreSQL table `clinic_screenings`.
            </span>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              <Stethoscope className="h-4 w-4" />
              <span>{submitting ? 'Saving...' : 'Save Assessment'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Screenings Directory Table */}
      <div className="data-table-container">
        <div className="table-toolbar">
          <div className="search-input">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search screenings by member ID or notes..."
            />
          </div>
          <span className="text-xs text-slate-500 tabular-nums">
            Showing {filteredScreenings.length} of {screenings.length} clinical evaluations
          </span>
        </div>

        <div className="table-scroll">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Member ID</th>
                <th>PAR-Q Status</th>
                <th>Resting HR</th>
                <th>Assessment Date</th>
                <th>Medical Flag</th>
                <th>Clinical Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredScreenings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No clinical screenings recorded yet.
                  </td>
                </tr>
              ) : (
                filteredScreenings.slice(0, 15).map((s, idx) => (
                  <tr key={`${s.member_id}-${idx}`}>
                    <td className="font-mono text-xs font-semibold text-slate-800">{s.member_id}</td>
                    <td>
                      <span
                        className={`status-pill ${
                          s.parq_status === 'Cleared'
                            ? 'positive'
                            : s.parq_status === 'Flagged'
                            ? 'negative'
                            : 'warning'
                        }`}
                      >
                        {s.parq_status}
                      </span>
                    </td>
                    <td className="tabular-nums font-semibold text-slate-700">
                      {s.resting_heart_rate ? `${s.resting_heart_rate} BPM` : '—'}
                    </td>
                    <td className="tabular-nums text-slate-600 text-xs">{s.assessment_date || '—'}</td>
                    <td>
                      {hasMedicalFlag(s.medical_flag) ? (
                        <span className="status-pill negative">FLAGGED</span>
                      ) : (
                        <span className="status-pill positive">CLEAR</span>
                      )}
                    </td>
                    <td className="text-xs text-slate-600 max-w-xs truncate">{s.notes || 'No notes'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
