'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Stethoscope, AlertTriangle, CheckCircle, Clock, Heart, Search, RefreshCw } from 'lucide-react';

export default function ClinicView() {
  const [screenings, setScreenings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Form states
  const [memberId, setMemberId] = useState('');
  const [parqStatus, setParqStatus] = useState('Cleared');
  const [heartRate, setHeartRate] = useState<number | ''>(72);
  const [medicalFlag, setMedicalFlag] = useState('NO');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchScreenings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/roles/clinic/screenings');
      const data = await res.json();
      if (data.success) {
        setScreenings(data.screenings || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScreenings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId.trim()) return;

    setIsSubmitting(true);
    setFormMsg(null);

    try {
      const res = await fetch('http://localhost:3000/api/roles/clinic/screenings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: memberId.trim().toUpperCase(),
          parq_status: parqStatus,
          resting_heart_rate: heartRate === '' ? null : Number(heartRate),
          assessment_date: new Date().toISOString().split('T')[0],
          medical_flag: medicalFlag,
          notes
        })
      });
      const data = await res.json();

      if (data.success) {
        setFormMsg({ text: `Screening for ${memberId} recorded. Gate rules updated.`, type: 'success' });
        setMemberId('');
        setNotes('');
        fetchScreenings();
      } else {
        setFormMsg({ text: data.error || 'Failed to record screening', type: 'error' });
      }
    } catch (err: any) {
      setFormMsg({ text: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = screenings.filter((s) => {
    const matchSearch =
      s.member_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'All' || s.parq_status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-teal-500/20 text-teal-300 text-xs font-semibold px-2 py-0.5 rounded border border-teal-500/30">
              Role: Clinical Assessor / Personal Trainer
            </span>
            <span className="text-slate-400 text-xs">• Source 2 Domain: Health Screening Clinic</span>
          </div>
          <h1 className="text-xl font-bold mt-1.5 text-white">Physical Activity Readiness (PAR-Q) Evaluations</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Conduct cardio assessments, record biometric vitals, and issue medical clearance decisions before workout floor access.
          </p>
        </div>

        <button
          onClick={fetchScreenings}
          disabled={isLoading}
          className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Screenings</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Record Evaluation Form */}
        <div className="lg:col-span-4">
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 text-xs">
            <div className="flex items-center space-x-2 text-slate-800 font-bold border-b border-slate-100 pb-2">
              <Stethoscope className="h-4 w-4 text-teal-600" />
              <span>Record PAR-Q Assessment (Source 2)</span>
            </div>

            {formMsg && (
              <div
                className={`p-2.5 rounded-lg ${
                  formMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {formMsg.text}
              </div>
            )}

            <div className="space-y-2.5">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Target Member ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MBR-1001"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">PAR-Q Clinical Outcome *</label>
                <select
                  value={parqStatus}
                  onChange={(e) => {
                    setParqStatus(e.target.value);
                    if (e.target.value === 'Flagged') setMedicalFlag('YES');
                  }}
                  className="w-full border border-slate-200 rounded-lg p-2 bg-white"
                >
                  <option value="Cleared">Cleared (Unrestricted Workout Clearance)</option>
                  <option value="Flagged">Flagged (Cardiovascular / Medical Risk Detected)</option>
                  <option value="Pending">Pending (Incomplete Medical History)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Resting Heart Rate (BPM)</label>
                <input
                  type="number"
                  placeholder="e.g. 68"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg p-2 font-mono focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Normal human resting range: 40–100 BPM</span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Medical Flag Restriction</label>
                <select
                  value={medicalFlag}
                  onChange={(e) => setMedicalFlag(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 bg-white"
                >
                  <option value="NO">NO — Safe to exercise</option>
                  <option value="YES">YES — Restrict turnstile entry until doctor clears</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Clinician Notes</label>
                <textarea
                  rows={2}
                  placeholder="Physician notes, blood pressure observations..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 px-3 rounded-lg text-xs transition duration-150 disabled:opacity-50 mt-2"
            >
              {isSubmitting ? 'Recording...' : 'Save Evaluation & Sync Gate Status'}
            </button>
          </form>
        </div>

        {/* Right: Screenings Database Table */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xs font-bold text-slate-800">
                Source 2: Clinic Screenings Database Table
              </h2>
              <p className="text-[11px] text-slate-500">
                PAR-Q outcomes and physiological vitals recorded in PostgreSQL.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700"
              >
                <option value="All">Status: All</option>
                <option value="Cleared">Cleared</option>
                <option value="Flagged">Flagged</option>
                <option value="Pending">Pending</option>
              </select>

              <div className="relative w-44">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto flex-1 max-h-[580px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3">Member ID</th>
                  <th className="py-2.5 px-3">Member Name</th>
                  <th className="py-2.5 px-3">PAR-Q Status</th>
                  <th className="py-2.5 px-3">Resting HR</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Medical Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No clinical evaluations match filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {s.member_id}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {s.full_name || <em className="text-slate-400">Unmatched</em>}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            s.parq_status === 'Cleared'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.parq_status === 'Flagged' || s.parq_status === 'Fla'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {s.parq_status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {s.resting_heart_rate ? (
                          <span
                            className={
                              s.resting_heart_rate > 200 || s.resting_heart_rate < 40
                                ? 'text-rose-600 font-bold'
                                : 'text-slate-700'
                            }
                          >
                            {s.resting_heart_rate} BPM
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">N/A</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                        {s.assessment_date}
                      </td>
                      <td className="py-2.5 px-3">
                        {s.medical_flag === 'YES' ? (
                          <span className="text-rose-700 font-bold bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded text-[10px]">
                            RESTRICTED
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">None</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between">
            <span>Showing {filtered.length} clinical evaluations</span>
            <span>PostgreSQL: <code>clinic_screenings</code></span>
          </div>
        </div>
      </div>
    </div>
  );
}

