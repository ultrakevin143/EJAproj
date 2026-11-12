'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  ShieldCheck,
  AlertOctagon,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  RefreshCw,
  Activity,
  Layers
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

export default function ManagerView() {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [clearanceFilter, setClearanceFilter] = useState('All');

  const fetchOverview = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/roles/manager/overview');
      const resData = await res.json();
      if (resData.success) {
        setData(resData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const kpis = data?.kpis || {
    totalMembers: 0,
    clearedCount: 0,
    clearedPercent: 0,
    restrictedCount: 0,
    blockedCount: 0,
    highRiskCount: 0,
    medRiskCount: 0,
    lowRiskCount: 0
  };

  const chartData = [
    { name: 'Cleared for Workout', value: kpis.clearedCount, fill: '#10b981' },
    { name: 'Restricted (Pending PAR-Q)', value: kpis.restrictedCount, fill: '#f59e0b' },
    { name: 'Blocked (Medical Flag)', value: kpis.blockedCount, fill: '#ef4444' }
  ];

  const filteredMembers = (data?.members || []).filter((m: any) => {
    const matchSearch =
      m.member_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchClearance =
      clearanceFilter === 'All' || m.safety_clearance_status === clearanceFilter;
    return matchSearch && matchClearance;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-purple-500/20 text-purple-300 text-xs font-semibold px-2 py-0.5 rounded border border-purple-500/30">
              Role: Club General Manager & Executive BI
            </span>
            <span className="text-slate-400 text-xs">• Domain: Member 360° Data Warehouse & Analytics</span>
          </div>
          <h1 className="text-xl font-bold mt-1.5 text-white">Executive BI Dashboard & Consolidated Warehouse</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Holistic view of member health clearance compliance, facility safety ratios, and real-time operational check-ins.
          </p>
        </div>

        <button
          onClick={fetchOverview}
          disabled={isLoading}
          className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh BI Analytics</span>
        </button>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Total Enrolled Members</span>
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{kpis.totalMembers}</div>
          <span className="text-[10px] text-slate-400 block">Warehouse 360 Consolidated</span>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-800">Workout Clearance Rate</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-950">{kpis.clearedPercent}%</div>
          <span className="text-[10px] text-emerald-700 block">{kpis.clearedCount} members authorized</span>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-800">Pending PAR-Q Screenings</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-950">{kpis.restrictedCount}</div>
          <span className="text-[10px] text-amber-700 block">Restricted from high-intensity</span>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-800">Blocked Medical Risks</span>
            <AlertOctagon className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-950">{kpis.blockedCount}</div>
          <span className="text-[10px] text-rose-700 block">Immediate turnstile block enforced</span>
        </div>
      </div>

      {/* Middle Grid: Clearance Proportion Donut Chart & Recent Turnstile Scan Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-xs text-slate-800">Facility Health Clearance Distribution</span>
            <span className="font-mono text-[11px] text-slate-500">{kpis.totalMembers} Members</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`manager-cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val} members`, 'Count']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '11px' }}
                />
                <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Turnstile Scans Feed */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-xs text-slate-800">Live Turnstile Facility Access Log</span>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
              IoT Real-Time Feed
            </span>
          </div>

          <div className="overflow-x-auto flex-1 max-h-56 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Member</th>
                  <th className="py-2 px-3">Zone</th>
                  <th className="py-2 px-3">Gate Outcome</th>
                  <th className="py-2 px-3 font-mono">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data?.recentScans || []).map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="py-2 px-3 font-medium text-slate-800">
                      {s.full_name || s.member_id}
                    </td>
                    <td className="py-2 px-3 text-slate-600 text-[11px]">
                      {s.facility_zone}
                    </td>
                    <td className="py-2 px-3">
                      {s.access_granted ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                          GRANTED
                        </span>
                      ) : (
                        <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded text-[10px]">
                          DENIED
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-400 text-[10px]">
                      {new Date(s.scan_time).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Target Data Warehouse: Integrated Member 360 Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-bold text-slate-800 flex items-center space-x-2">
              <Layers className="h-4 w-4 text-emerald-600" />
              <span>Target Data Warehouse: Integrated Member 360° Table</span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Unified records consolidated from CRM, Clinic Screenings, and Turnstile RFID Scans in PostgreSQL.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={clearanceFilter}
              onChange={(e) => setClearanceFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
            >
              <option value="All">Clearance: All</option>
              <option value="ACTIVE_CLEARANCE">Clear for Workout</option>
              <option value="RESTRICTED_PENDING_PARQ">Restricted (Pending PAR-Q)</option>
              <option value="BLOCKED_MEDICAL_FLAG">Blocked (Medical Flag)</option>
            </select>

            <div className="relative w-48">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search member..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto flex-1 max-h-[500px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-3">Member ID</th>
                <th className="py-2.5 px-3">Full Legal Name</th>
                <th className="py-2.5 px-3">Tier</th>
                <th className="py-2.5 px-3">PAR-Q Status</th>
                <th className="py-2.5 px-3">Resting HR</th>
                <th className="py-2.5 px-3">Turnstile Clearance Status</th>
                <th className="py-2.5 px-3 text-right">Check-in Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No members match search criteria.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m: any) => (
                  <tr key={m.member_id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {m.member_id}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {m.full_name}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] px-2 py-0.5 rounded font-medium">
                        {m.membership_tier}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium">
                      {m.parq_status}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {m.resting_heart_rate ? `${m.resting_heart_rate} BPM` : 'N/A'}
                    </td>
                    <td className="py-2.5 px-3">
                      {m.safety_clearance_status === 'ACTIVE_CLEARANCE' ? (
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                          ACTIVE CLEARANCE
                        </span>
                      ) : m.safety_clearance_status === 'BLOCKED_MEDICAL_FLAG' ? (
                        <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[10px]">
                          BLOCKED - MEDICAL FLAG
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px]">
                          RESTRICTED - PENDING PAR-Q
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800">
                      {m.total_checkins} scans
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between">
          <span>Displaying {filteredMembers.length} warehouse records</span>
          <span>PostgreSQL Table: <code>integrated_members_360</code></span>
        </div>
      </div>
    </div>
  );
}

