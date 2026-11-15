'use client';

import React, { useState, useEffect } from 'react';
import { Search, UserPlus, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { apiFetch } from '../../lib/api';

interface Member {
  member_id: string;
  full_name: string;
  dob: string;
  email: string;
  membership_tier: string;
}

export default function FrontDeskView() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [memberId, setMemberId] = useState('MBR-1151');
  const [fullName, setFullName] = useState('Carlos Alcantara');
  const [dob, setDob] = useState('1994-08-15');
  const [email, setEmail] = useState('carlos.alcantara@up.edu.ph');
  const [membershipTier, setMembershipTier] = useState('Gold Annual Pass');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Clearance Check State
  const [checkId, setCheckId] = useState('MBR-1150');
  const [clearanceResult, setClearanceResult] = useState<any | null>(null);
  const [checkingClearance, setCheckingClearance] = useState(false);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/roles/frontdesk/members');
      const data = await res.json();
      if (data.success) {
        setMembers(data.members || []);
      }
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await apiFetch('/roles/frontdesk/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          dob,
          email: email.trim(),
          membership_tier: membershipTier
        })
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: data.message });
        setMemberId(`MBR-${Math.floor(1152 + Math.random() * 800)}`);
        setFullName('');
        setEmail('');
        setDob('');
        fetchMembers();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to enroll member' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Network error connecting to backend' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckClearance = async (memberId = checkId) => {
    if (!memberId.trim()) return;
    setCheckingClearance(true);
    try {
      const res = await apiFetch(`/roles/frontdesk/clearance/${encodeURIComponent(memberId.trim())}`);
      const data = await res.json();
      if (data.success) {
        setClearanceResult(data.member);
      } else {
        setClearanceResult({ error: data.error });
      }
    } catch (err) {
      setClearanceResult({ error: 'Connection error' });
    } finally {
      setCheckingClearance(false);
    }
  };

  const filteredMembers = members.filter((m) =>
    m.member_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <span className="eyebrow">Source 01 · front-desk registration</span>
          <h1>Member intake</h1>
          <p>Register new club members and verify keycard safety clearance before physical gym entry.</p>
        </div>
        <button onClick={fetchMembers} className="btn btn-secondary">
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Summary Metrics Strip */}
      <dl className="dashboard-summary">
        <div>
          <dt>Total Enrolled Members</dt>
          <dd className="tabular-nums">{members.length}</dd>
          <span>Source 1: Front-Desk CRM Table</span>
        </div>
        <div>
          <dt>Gold / VIP Memberships</dt>
          <dd className="tabular-nums">{members.filter((m) => m.membership_tier.includes('Gold') || m.membership_tier.includes('VIP')).length}</dd>
          <span>All-access priority tiers</span>
        </div>
        <div>
          <dt>Standard Monthly</dt>
          <dd className="tabular-nums">{members.filter((m) => m.membership_tier.includes('Standard')).length}</dd>
          <span>Standard floor access</span>
        </div>
        <div>
          <dt>Data Privacy Act Boundary</dt>
          <dd className="text-sm font-semibold text-blue-900 mt-2">Active Isolation</dd>
          <span>Clinical records hidden from reception</span>
        </div>
      </dl>

      {/* Grid: Registration Form + Clearance Quick Check */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Registration Card (2 cols) */}
        <div className="lg:col-span-2 form-card">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">Enroll New Club Member</h2>
              <p className="text-xs text-slate-500">Inputs populate Source 1 (CRM) in PostgreSQL warehouse.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFullName('Carlos Alcantara');
                setDob('1994-08-15');
                setEmail('carlos.alcantara@up.edu.ph');
                setMembershipTier('Gold Annual Pass');
              }}
              className="text-xs text-blue-700 hover:underline font-semibold"
            >
              Autofill Sample (Carlos Alcantara)
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

          <form onSubmit={handleEnroll}>
            <div className="form-grid mb-4">
              <div className="form-group">
                <label>Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Carlos Alcantara"
                />
              </div>

              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="carlos.alcantara@up.edu.ph"
                />
              </div>

              <div className="form-group">
                <label>Membership Tier</label>
                <select
                  value={membershipTier}
                  onChange={(e) => setMembershipTier(e.target.value)}
                >
                  <option value="Standard Monthly">Standard Monthly (Php 2,200/mo)</option>
                  <option value="Gold Annual Pass">Gold Annual Pass (Php 22,000/yr)</option>
                  <option value="VIP Platinum All-Access">VIP Platinum All-Access</option>
                  <option value="Student / Youth Athlete">Student / Youth Athlete</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">New members default to RESTRICTED pending clinical PAR-Q.</span>
              <button type="submit" disabled={submitting} className="btn btn-primary">
                <UserPlus className="h-4 w-4" />
                <span>{submitting ? 'Enrolling...' : 'Enroll Member'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Badge Clearance Quick Checker (1 col) */}
        <div className="form-card flex flex-col justify-between">
          <div>
            <div className="mb-4 pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">Check Keycard Clearance</h2>
              <p className="text-xs text-slate-500">Query integrated warehouse without exposing clinical notes.</p>
            </div>

            <div className="form-group mb-3">
              <label>Member ID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={checkId}
                  onChange={(e) => setCheckId(e.target.value)}
                  placeholder="e.g. MBR-1150"
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => handleCheckClearance()}
                  disabled={checkingClearance}
                  className="btn btn-secondary px-3"
                >
                  {checkingClearance ? 'Checking...' : 'Check'}
                </button>
              </div>
            </div>

            {clearanceResult && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md mt-3">
                {clearanceResult.error ? (
                  <div className="text-xs text-red-600 font-medium">{clearanceResult.error}</div>
                ) : (
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Name:</span>
                      <strong className="text-slate-900">{clearanceResult.full_name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tier:</span>
                      <span className="font-semibold text-slate-700">{clearanceResult.membership_tier}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                      <span className="text-slate-500">Access Status:</span>
                      <span
                        className={`status-pill ${
                          clearanceResult.safety_clearance_status === 'ACTIVE_CLEARANCE'
                            ? 'positive'
                            : 'warning'
                        }`}
                      >
                        {clearanceResult.safety_clearance_status || 'RESTRICTED'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 p-2.5 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-500">
            <strong>Reception Notice:</strong> If access is restricted, direct the member to the club clinic for assistance.
          </div>
        </div>
      </div>

      {/* Members Directory Table */}
      <div className="data-table-container">
        <div className="table-toolbar">
          <div className="search-input">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search members by name, ID, or email..."
            />
          </div>
          <span className="text-xs text-slate-500 tabular-nums">
            Showing {filteredMembers.length} of {members.length} members
          </span>
        </div>

        <div className="table-scroll">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Member ID</th>
                <th>Full Name</th>
                <th>Date of Birth</th>
                <th>Email Address</th>
                <th>Membership Tier</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No matching member records found.
                  </td>
                </tr>
              ) : (
                filteredMembers.slice(0, 15).map((m) => (
                  <tr key={m.member_id}>
                    <td className="font-mono text-xs font-semibold text-slate-800">{m.member_id}</td>
                    <td className="font-medium text-slate-900">{m.full_name}</td>
                    <td className="tabular-nums text-slate-600">{m.dob || '—'}</td>
                    <td className="text-slate-600 text-xs">{m.email}</td>
                    <td>
                      <span className="status-pill neutral">{m.membership_tier}</span>
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          setCheckId(m.member_id);
                          handleCheckClearance(m.member_id);
                        }}
                        className="text-xs text-blue-700 hover:underline font-semibold"
                      >
                        Verify Clearance
                      </button>
                    </td>
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
