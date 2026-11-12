'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';
import { ErrorLogItem } from '../types/dqm';

interface ErrorLogViewProps {
  errorLog: ErrorLogItem[];
}

export default function ErrorLogView({ errorLog = [] }: ErrorLogViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrinciple, setSelectedPrinciple] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSeverity, setSelectedSeverity] = useState('All');

  // Unique categories & principles
  const categories = useMemo(() => {
    const set = new Set<string>();
    errorLog.forEach((item) => set.add(item.issueCategory));
    return ['All', ...Array.from(set)];
  }, [errorLog]);

  const principles = useMemo(() => {
    const set = new Set<string>();
    errorLog.forEach((item) => {
      (item.dqmPrinciples || []).forEach((p) => set.add(p));
    });
    return ['All', ...Array.from(set)];
  }, [errorLog]);

  // Filtered log
  const filteredLog = useMemo(() => {
    return errorLog.filter((item) => {
      const matchSearch =
        searchTerm === '' ||
        String(item.rowNumber).includes(searchTerm) ||
        item.fieldName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.originalValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.issueCategory.toLowerCase().includes(searchTerm.toLowerCase());

      const matchPrinciple =
        selectedPrinciple === 'All' ||
        item.dqmPrinciples?.includes(selectedPrinciple) ||
        item.primaryPrinciple === selectedPrinciple;

      const matchCategory =
        selectedCategory === 'All' || item.issueCategory === selectedCategory;

      const matchSeverity =
        selectedSeverity === 'All' || item.severity === selectedSeverity;

      return matchSearch && matchPrinciple && matchCategory && matchSeverity;
    });
  }, [errorLog, searchTerm, selectedPrinciple, selectedCategory, selectedSeverity]);

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'Critical':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters & Search Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search row, field, or value..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  Category: {cat}
                </option>
              ))}
            </select>

            {/* Principle Filter */}
            <select
              value={selectedPrinciple}
              onChange={(e) => setSelectedPrinciple(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none"
            >
              {principles.map((p) => (
                <option key={p} value={p}>
                  Principle: {p}
                </option>
              ))}
            </select>

            {/* Severity Filter */}
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none"
            >
              <option value="All">Severity: All</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
          <span>
            Showing <strong className="text-slate-800">{filteredLog.length}</strong> of{' '}
            <strong className="text-slate-800">{errorLog.length}</strong> detected issue events
          </span>
          {errorLog.length > 0 && (
            <span className="text-[11px] text-slate-400">
              Classified across Accuracy, Consistency, Completeness, Timeliness, Reliability, Relevance
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-3">Row #</th>
                <th className="py-2.5 px-3">Field</th>
                <th className="py-2.5 px-3">Original Value</th>
                <th className="py-2.5 px-3">Issue Category</th>
                <th className="py-2.5 px-3">DQM Principles</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Action Route</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLog.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No issue events match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLog.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-900">
                      #{item.rowNumber}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {item.fieldName}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] max-w-[140px] truncate block">
                        {item.originalValue === '' ? (
                          <span className="italic text-slate-400">&lt;empty&gt;</span>
                        ) : (
                          item.originalValue
                        )}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {item.issueCategory}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {item.dqmPrinciples?.map((p) => (
                          <span
                            key={p}
                            className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-1.5 py-0.2 rounded font-medium"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block border px-2 py-0.5 rounded-full text-[10px] font-bold ${getSeverityBadge(
                          item.severity
                        )}`}
                      >
                        {item.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {item.autoFixable ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-semibold">
                          <CheckCircle className="h-3 w-3" />
                          <span>Auto-Fixable</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-semibold">
                          <HelpCircle className="h-3 w-3" />
                          <span>Human Review</span>
                        </span>
                      )}
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

