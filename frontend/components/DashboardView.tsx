'use client';

import React from 'react';
import {
  FileText,
  AlertCircle,
  Users,
  Calendar,
  Copy,
  PieChart as PieIcon,
  BarChart3,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { AuditSummary } from '../types/dqm';

interface DashboardViewProps {
  summary: AuditSummary | null;
  baseline: Record<string, any> | null;
  fileName: string | null;
}

const DQM_COLORS: Record<string, string> = {
  Accuracy: '#ef4444',
  Consistency: '#3b82f6',
  Completeness: '#f59e0b',
  Timeliness: '#8b5cf6',
  Reliability: '#10b981',
  Relevance: '#06b6d4'
};

const CATEGORY_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'
];

export default function DashboardView({ summary, baseline, fileName }: DashboardViewProps) {
  if (!summary) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto space-y-3 shadow-sm">
        <FileText className="h-10 w-10 text-slate-300 mx-auto" />
        <h3 className="font-bold text-slate-700 text-sm">No Active Audit Data</h3>
        <p className="text-xs text-slate-500">
          Upload a gym screening CSV or load the synthetic dataset on Tab 1 to populate the dashboard.
        </p>
      </div>
    );
  }

  // Baseline comparison rows
  const comparisonRows = [
    { label: 'Total Records', actual: summary.totalRecords, baseline: baseline?.totalRecords ?? 500 },
    { label: 'Total Fields Evaluated', actual: summary.totalFields, baseline: 2500 },
    { label: 'Individual Issue Events', actual: summary.issueEvents, baseline: baseline?.totalIssueEvents ?? 410 },
    { label: 'Unique Affected Records', actual: summary.uniqueAffectedRecords, baseline: baseline?.uniqueAffectedRecords ?? 345 },
    { label: 'Affected Records %', actual: `${summary.affectedRecordsPercent}%`, baseline: `${baseline?.affectedRecordsPercent ?? 69.0}%` },
    { label: 'Abbr. Screening Results', actual: summary.categoryCounts['Abbreviated Screening Result'] || 0, baseline: baseline?.abbrScreeningCount ?? 178 },
    { label: 'Blank Screening Results', actual: summary.categoryCounts['Blank Screening Result'] || 0, baseline: baseline?.blankScreeningCount ?? 105 },
    { label: 'Unknown Screening Results', actual: summary.categoryCounts['Unknown Screening Result'] || 0, baseline: baseline?.unknownScreeningCount ?? 27 },
    { label: 'Incomplete Names (Single Word)', actual: summary.categoryCounts['Incomplete Name'] || 0, baseline: baseline?.incompleteNameCount ?? 28 },
    { label: 'Missing DOB Values', actual: summary.categoryCounts['Missing DOB'] || 0, baseline: baseline?.missingDOBCount ?? 26 },
    { label: 'Malformed Email Addresses', actual: summary.categoryCounts['Malformed Email'] || 0, baseline: baseline?.malformedEmailCount ?? 26 },
    { label: 'Invalid Recorded Dates', actual: summary.categoryCounts['Invalid Recorded Date'] || 0, baseline: baseline?.invalidRecordedDateCount ?? 20 },
    { label: 'Mixed Date Format Patterns', actual: summary.consistencyPatternsCount || 0, baseline: baseline?.mixedFormatDateCount ?? 457 },
    { label: 'Exact Duplicate Records', actual: summary.duplicateRowsCount || 0, baseline: baseline?.duplicateRowCount ?? 0 }
  ];

  // Recharts data preparation
  const dqmChartData = Object.entries(summary.dqmCounts || {}).map(([name, value]) => ({
    name,
    value: Number(value),
    fill: DQM_COLORS[name] || '#10b981'
  }));

  const categoryChartData = Object.entries(summary.categoryCounts || {}).map(([name, count], idx) => ({
    name: name.replace(' Screening Result', '').replace(' Addresses', ''),
    fullName: name,
    count: Number(count),
    fill: CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
  }));

  return (
    <div className="space-y-6">
      {/* 6 Top Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Records', value: summary.totalRecords, sub: `${summary.totalFields} fields`, icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-200' },
          { label: 'Issue Events', value: summary.issueEvents, sub: 'Field-level errors', icon: AlertCircle, color: 'text-rose-600 bg-rose-50 border-rose-200' },
          { label: 'Affected Records', value: summary.uniqueAffectedRecords, sub: `${summary.affectedRecordsPercent}% of rows`, icon: AlertCircle, color: 'text-amber-600 bg-amber-50 border-amber-200' },
          { label: 'Date Patterns', value: summary.consistencyPatternsCount, sub: 'Auto-standardizable', icon: Calendar, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
          { label: 'Duplicate Rows', value: summary.duplicateRowsCount, sub: 'Exact matches', icon: Copy, color: 'text-slate-600 bg-slate-50 border-slate-200' },
          { label: 'Audit Status', value: 'Audited', sub: 'PostgreSQL Synced', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' }
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className={`p-4 rounded-xl border ${card.color} shadow-sm`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-600">{card.label}</span>
                <Icon className="h-4 w-4 opacity-75" />
              </div>
              <div className="mt-2 text-xl font-bold text-slate-900">{card.value}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{card.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Visual Graphs Section (Interactive Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Category Bar Chart */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-800">
                Issue Events Distribution by Category
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Total {summary.issueEvents} events
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                <XAxis
                  dataKey="name"
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 10, fill: '#475569' }}
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any, name: any, item: any) => [`${val} issue events`, item.payload.fullName]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '11px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Interactive DQM Principles Donut Chart */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center space-x-2">
              <PieIcon className="h-4 w-4 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-800">
                DQM Principles Proportion
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              6 Core Principles
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dqmChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {dqmChartData.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val} principle hits`, 'Impact']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '11px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconSize={8}
                  wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Grid: Baseline Comparison Table & Progress Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Baseline Comparison Table */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Live Audit vs. Classroom Baseline Reference
              </h2>
              <p className="text-xs text-slate-500">
                Comparison of actual findings against the standard reference dataset of 500 records.
              </p>
            </div>
            <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-600">
              {fileName}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-y border-slate-200">
                <tr>
                  <th className="py-2 px-3">Metric / Issue Category</th>
                  <th className="py-2 px-3 text-right">Actual Found</th>
                  <th className="py-2 px-3 text-right">Classroom Baseline</th>
                  <th className="py-2 px-3 text-center">Variance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {comparisonRows.map((row, i) => {
                  const isMatch = String(row.actual) === String(row.baseline);
                  return (
                    <tr key={i} className="hover:bg-slate-50/60 transition">
                      <td className="py-2 px-3 font-medium text-slate-800">{row.label}</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                        {row.actual}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-500">
                        {row.baseline}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isMatch
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isMatch ? 'Exact Match' : 'Statistical Variance'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: DQM Principles Impact Breakdown */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-2">
              <PieIcon className="h-4 w-4 text-emerald-600" />
              <span>DQM Principles Breakdown (Detailed Impact)</span>
            </div>

            <div className="space-y-3">
              {Object.entries(summary.dqmCounts || {}).map(([principle, count]) => {
                const max = Math.max(...Object.values(summary.dqmCounts || { a: 1 }));
                const pct = max > 0 ? Math.round(((count as number) / max) * 100) : 0;
                const color = DQM_COLORS[principle] || '#10b981';

                return (
                  <div key={principle} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700 flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
                        <span>{principle}</span>
                      </span>
                      <span className="font-mono text-slate-500 font-medium">{count as number} hits</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
