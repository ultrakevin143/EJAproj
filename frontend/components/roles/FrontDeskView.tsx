'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, Search, CheckCircle2, AlertOctagon, Clock, User, ShieldCheck, RefreshCw } from 'lucide-react';

export default function FrontDeskView() {
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Member Form
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [tier, setTier] = useState('Standard');
  const [formMsg, setFormMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Keycard Lookup
  const [lookupId, setLookupId] = useState('');
  const [clearanceResult, setClearanceResult] = useState<any | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/roles/frontdesk/members');
      const data = await res.json();
      if (data.success) {
        setMembers(data.members || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setIsSubmitting(true);
    setFormMsg(null);

    try {
      const res = await fetch('http://localhost:3000/api/roles/frontdesk/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          dob,
          email,
          membership_tier: tier
        })
      });
      const data = await res.json();

      if (data.success) {
        setFormMsg({ text: `Member enrolled with ID: ${data.member.member_id}`, type: 'success' });
        setFullName('');
        setDob('');
        setEmail('');
        fetchMembers();
      } else {
        setFormMsg({ text: data.error || 'Enrollment failed', type: 'error' });
      }
    } catch (err: any) {
      setFormMsg({ text: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLookup = async (idToLookup?: string) => {
    const id = idToLookup || lookupId;
    if (!id.trim()) return;

    setLookupLoading(true);
    setClearanceResult(null);

    try {
      const res = await fetch(`http://localhost:3000/api/roles/frontdesk/clearance/${id.trim()}`);
      const data = await res.json();
      if (data.success) {
        setClearanceResult(data.member);
      } else {
        setClearanceResult({ notFound: true, message: data.error });
      }
    } catch (e) {
      setClearanceResult({ notFound: true, message: 'Lookup error' });
    } finally {
      setLookupLoading(false);
    }
  };

  const filteredMembers = members.filter(m =>
    m.member_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-2 py-0.5 rounded border border-emerald-500/30">
              Role: Front-Desk Receptionist
            </span>
            <span className="text-slate-400 text-xs">• Source 1 Domain: CRM Intake</span>
          </div>
          <h1 className="text-xl font-bold mt-1.5 text-white">Member Registration & Intake Desk</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage front-desk registrations and inspect entry clearance status without accessing confidential clinical files.
          </p>
        </div>

        <button
          onClick={fetchMembers}
          disabled={isLoading}
          className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Quick Clearance Lookup + Enroll Form */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Clearance Checker */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs border-b border-slate-100 pb-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Front-Desk Member Badge Clearance Lookup</span>
            </div>

            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="e.g. MBR-1001"
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono uppercase focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
              <button
                onClick={() => handleLookup()}
                disabled={lookupLoading}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
              >
                Check
              </button>
            </div>

            {clearanceResult && (
              <div className="pt-2 border-t border-slate-100">
                {clearanceResult.notFound ? (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    {clearanceResult.message || 'Member ID not found in database.'}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg border text-xs space-y-2 bg-slate-50 border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{clearanceResult.full_name}</span>
                      <span className="font-mono text-[11px] text-slate-500">{clearanceResult.member_id}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-500 text-[11px]">Turnstile Clearance:</span>
                      {clearanceResult.safety_clearance_status === 'ACTIVE_CLEARANCE' ? (
                        <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px]">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>CLEAR TO ENTER</span>
                        </span>
                      ) : clearanceResult.safety_clearance_status === 'BLOCKED_MEDICAL_FLAG' ? (
                        <span className="inline-flex items-center space-x-1 bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[11px]">
                          <AlertOctagon className="h-3 w-3" />
                          <span>BLOCKED - MEDICAL FLAG</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[11px]">
                          <Clock className="h-3 w-3" />
                          <span>RESTRICTED - PENDING PAR-Q</span>
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-400 italic pt-1">
                      *Note: Clinical screening diagnosis details are restricted from front-desk staff.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* New Member Enrollment Form */}
          <form onSubmit={handleEnroll} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs border-b border-slate-100 pb-2">
              <UserPlus className="h-4 w-4 text-emerald-600" />
              <span>Enroll New Member (Source 1 Intake)</span>
            </div>

            {formMsg && (
              <div
                className={`p-2.5 rounded-lg text-xs ${
                  formMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {formMsg.text}
              </div>
            )}

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Miller"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Contact Email</label>
                <input
                  type="email"
                  placeholder="jordan.miller@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Membership Tier</label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 bg-white"
                >
                  <option value="Standard">Standard Gym Floor</option>
                  <option value="Premium">Premium Access (Includes Classes)</option>
                  <option value="VIP All-Access">VIP All-Access (Pool, Spa & Private Box)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-lg text-xs transition duration-150 disabled:opacity-50 mt-2"
            >
              {isSubmitting ? 'Registering...' : 'Register Member & Sync DB'}
            </button>
          </form>
        </div>

        {/* Right Column: CRM Registered Members Database Table */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xs font-bold text-slate-800">
                Source 1: Front-Desk CRM Members Table
              </h2>
              <p className="text-[11px] text-slate-500">
                Live membership intake records stored in PostgreSQL.
              </p>
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search member or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1 max-h-[580px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3">Member ID</th>
                  <th className="py-2.5 px-3">Full Legal Name</th>
                  <th className="py-2.5 px-3">DOB</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Tier</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No members match search.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((m) => (
                    <tr key={m.member_id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {m.member_id}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {m.full_name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {m.dob || <em className="text-slate-400">&lt;missing&gt;</em>}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 truncate max-w-[150px]">
                        {m.email}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] px-2 py-0.5 rounded font-medium">
                          {m.membership_tier}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            setLookupId(m.member_id);
                            handleLookup(m.member_id);
                          }}
                          className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold"
                        >
                          Check Badge
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between">
            <span>Showing {filteredMembers.length} member profiles</span>
            <span>PostgreSQL: <code>crm_members</code></span>
          </div>
        </div>
      </div>
    </div>
  );
}

