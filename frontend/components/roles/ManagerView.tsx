'use client';

import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, BarChart3, Database, AlertCircle, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface Member360 {
  member_id: string;
  full_name: string;
  dob: string;
  email: string;
  membership_tier: string;
  parq_status: string;
  resting_heart_rate: number | null;
  assessment_date: string;
  total_checkins: number;
  last_checkin_time: string | null;
  frequent_zone: string;
  safety_clearance_status: string;
  risk_tier: string;
  dqm_flags_count: number;
}

export default function ManagerView() {
  const [kpis, setKpis] = useState<any | null>(null);
  const [warehouse, setWarehouse] = useState<Member360[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3000/api/roles/manager/overview');
      const data = await res.json();
      if (data.success) {
        setKpis(data.kpis);
        setWarehouse(data.warehouse || data.members || []);
      }
    } catch (err) {
      console.error('Failed to load manager overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const totalMembers = kpis?.totalMembers || 0;
  const clearedCount = kpis?.clearedCount || 0;
  const restrictedCount = kpis?.restrictedCount || 0;
  const blockedCount = kpis?.blockedCount || 0;

  // Real database pie chart values (no made-up fallback numbers)
  const clearancePieData = totalMembers > 0 ? [
    { name: 'Active Clearance', value: clearedCount, color: '#16a34a' },
    { name: 'Restricted Pending PAR-Q', value: restrictedCount, color: '#d97706' },
    { name: 'Blocked Medical Flag', value: blockedCount, color: '#dc2626' }
  ].filter(d => d.value > 0) : [];

  // Real database zone throughput (from turnstile_scans table)
  const zoneThroughputData = kpis?.zoneBreakdown || [];

  const filteredMembers = warehouse.filter((m) =>
    m.member_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.safety_clearance_status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <h1>Executive BI 360 Dashboard</h1>
          <p>
            Consolidated Member 360 profile integrating Front-Desk CRM, Clinical PAR-Q screenings, and Turnstile IoT check-ins.
          </p>
        </div>
        <button onClick={fetchOverview} className="btn btn-secondary">
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* 5-Stage System Flow Map */}
      <div className="form-card mb-6 bg-slate-50 border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
          <strong className="text-xs uppercase tracking-wider text-slate-600 font-bold">
            End-to-End System Integration Flow (Fitness Health Data Architecture)
          </strong>
          <span className="text-xs text-blue-800 font-semibold font-mono">5-Stage Pipeline</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <div className="p-3 bg-white rounded border border-slate-200">
            <span className="text-[11px] font-bold text-blue-700 block mb-1">Stage 1: Intake CRM</span>
            <strong className="text-slate-800 block text-xs">Source 1: Front-Desk</strong>
            <p className="text-[11px] text-slate-500 mt-1">
              Member registers. Initial safety status defaults to Restricted pending doctor screening.
            </p>
          </div>
          <div className="p-3 bg-white rounded border border-slate-200">
            <span className="text-[11px] font-bold text-emerald-700 block mb-1">Stage 2: Health Screening</span>
            <strong className="text-slate-800 block text-xs">Source 2: Clinic Station</strong>
            <p className="text-[11px] text-slate-500 mt-1">
              Doctor conducts PAR-Q and measures resting HR. Flags cardiac risk (e.g. &gt;100 BPM).
            </p>
          </div>
          <div className="p-3 bg-white rounded border border-slate-200">
            <span className="text-[11px] font-bold text-purple-700 block mb-1">Stage 3: Turnstile IoT</span>
            <strong className="text-slate-800 block text-xs">Source 3: IoT RFID Gates</strong>
            <p className="text-[11px] text-slate-500 mt-1">
              Machine queries warehouse: unlocks if Cleared; locks immediately if Flagged.
            </p>
          </div>
          <div className="p-3 bg-white rounded border border-slate-200">
            <span className="text-[11px] font-bold text-amber-700 block mb-1">Stage 4: Data Steward ETL</span>
            <strong className="text-slate-800 block text-xs">DQM Cleaning Engine</strong>
            <p className="text-[11px] text-slate-500 mt-1">
              Normalizes dirty dates, expands &apos;Clrd&apos;, and manages single-name review queue.
            </p>
          </div>
          <div className="p-3 bg-white rounded border border-slate-200">
            <span className="text-[11px] font-bold text-slate-800 block mb-1">Stage 5: Target Warehouse</span>
            <strong className="text-slate-800 block text-xs">integrated_members_360</strong>
            <p className="text-[11px] text-slate-500 mt-1">
              Consolidated 360 profile driving health safety and operations analytics.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Metrics Strip (Real Database Values) */}
      <dl className="dashboard-summary">
        <div>
          <dt>Total Integrated Members</dt>
          <dd className="tabular-nums">{totalMembers}</dd>
          <span>Target: integrated_members_360</span>
        </div>
        <div>
          <dt>Cleared for Workout</dt>
          <dd className="tabular-nums text-emerald-700">
            {clearedCount}{' '}
            {totalMembers > 0 && (
              <span className="text-xs text-slate-500 font-normal">
                ({kpis?.clearedPercent}%)
              </span>
            )}
          </dd>
          <span>Active turnstile access</span>
        </div>
        <div>
          <dt>Restricted Pending PAR-Q</dt>
          <dd className="tabular-nums text-amber-700">{restrictedCount}</dd>
          <span>Requires health screening</span>
        </div>
        <div>
          <dt>Blocked Medical Flags</dt>
          <dd className="tabular-nums text-red-700">{blockedCount}</dd>
          <span>Cardiovascular risk lockout</span>
        </div>
      </dl>

      {/* If Warehouse is Empty before ETL */}
      {totalMembers === 0 && (
        <div className="p-8 bg-amber-50 border border-amber-200 rounded-lg text-center mb-6">
          <Database className="h-10 w-10 text-amber-600 mx-auto mb-3" />
          <h2 className="text-base font-bold text-amber-900 mb-1">
            Target Warehouse Awaiting Multi-Source ETL Integration
          </h2>
          <p className="text-xs text-amber-800 max-w-lg mx-auto mb-4">
            The 3 disparate data sources (Front-Desk CRM, Clinic Screenings, and Turnstile IoT check-ins) are currently in the staging tables.
            To populate the consolidated 360 profile, switch to the <strong>Data Steward</strong> station and execute the <strong>Multi-Source ETL Pipeline</strong>.
          </p>
        </div>
      )}

      {/* Visual Analytics Grid (Shown when real data exists) */}
      {totalMembers > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Safety Clearance Distribution */}
          <div className="form-card">
            <div className="mb-4 pb-3 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-slate-900">Health Safety Clearance Proportion</h2>
                <p className="text-xs text-slate-500">Real database counts from integrated warehouse.</p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                Live KPI
              </span>
            </div>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={clearancePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {clearancePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [`${value} members`, name]}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: 6, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex justify-center gap-6 text-xs mt-2 pt-2 border-t border-slate-200">
              {clearancePieData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-slate-600 font-medium">{d.name}</span>
                  <span className="tabular-nums font-bold text-slate-800">({d.value})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Facility Zone Throughput (Real database counts) */}
          <div className="form-card">
            <div className="mb-4 pb-3 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-slate-900">Turnstile Throughput by Facility Zone</h2>
                <p className="text-xs text-slate-500">Live query from turnstile_scans table.</p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                IoT Scans
              </span>
            </div>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zoneThroughputData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="zone" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: 6, fontSize: 12 }}
                    formatter={(val: any) => [`${val} scans`, 'Scans']}
                  />
                  <Bar dataKey="scans" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200">
              <span>Real IoT gate events logged</span>
              <span className="text-blue-700 font-semibold">Strict PAR-Q at High-Intensity Zone</span>
            </div>
          </div>
        </div>
      )}

      {/* Consolidated Member 360 Table */}
      {totalMembers > 0 && (
        <div className="data-table-container">
          <div className="table-toolbar">
            <div className="search-input">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Member 360 by name, ID, or safety status..."
              />
            </div>
            <span className="text-xs text-slate-500 tabular-nums">
              Showing {filteredMembers.length} of {warehouse.length} integrated warehouse records
            </span>
          </div>

          <div className="table-scroll">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Member ID</th>
                  <th>Full Name</th>
                  <th>Tier</th>
                  <th>PAR-Q Status</th>
                  <th>Resting HR</th>
                  <th>Check-ins</th>
                  <th>Frequent Zone</th>
                  <th>Safety Clearance</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400">
                      No matching Member 360 records found.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.slice(0, 20).map((m) => (
                    <tr key={m.member_id}>
                      <td className="font-mono text-xs font-semibold text-slate-800">{m.member_id}</td>
                      <td className="font-medium text-slate-900">{m.full_name}</td>
                      <td>
                        <span className="status-pill neutral">{m.membership_tier}</span>
                      </td>
                      <td>
                        <span
                          className={`status-pill ${
                            m.parq_status === 'Cleared'
                              ? 'positive'
                              : m.parq_status === 'Flagged'
                              ? 'negative'
                              : 'warning'
                          }`}
                        >
                          {m.parq_status || 'Pending'}
                        </span>
                      </td>
                      <td className="tabular-nums font-semibold text-slate-700">
                        {m.resting_heart_rate ? `${m.resting_heart_rate} BPM` : '—'}
                      </td>
                      <td className="tabular-nums text-slate-700">{m.total_checkins}</td>
                      <td className="text-xs text-slate-600">{m.frequent_zone || 'None'}</td>
                      <td>
                        <span
                          className={`status-pill ${
                            m.safety_clearance_status === 'ACTIVE_CLEARANCE'
                              ? 'positive'
                              : m.safety_clearance_status === 'BLOCKED_MEDICAL_FLAG'
                              ? 'negative'
                              : 'warning'
                          }`}
                        >
                          {m.safety_clearance_status || 'RESTRICTED'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
