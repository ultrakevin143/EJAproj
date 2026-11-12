'use client';

import React, { useState } from 'react';
import { Sparkles, CheckCircle2, ShieldCheck, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { applySafeCleaning, fetchComparison } from '../lib/api';
import { ChangelogItem, ComparisonData } from '../types/dqm';

interface CleaningViewProps {
  sessionId: string | null;
  onCleaningComplete: () => void;
}

export default function CleaningView({ sessionId, onCleaningComplete }: CleaningViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [changelog, setChangelog] = useState<ChangelogItem[]>([]);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [cleanSummary, setCleanSummary] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApplyClean = async () => {
    if (!sessionId) {
      setError('Please upload a dataset on Tab 1 first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await applySafeCleaning(sessionId);
      if (res.success) {
        setChangelog(res.changelog || []);
        setCleanSummary(res.summary);

        // Fetch comparison data
        const compRes = await fetchComparison(sessionId);
        if (compRes.success) {
          setComparison(compRes.comparison);
        }
        onCleaningComplete();
      } else {
        setError(res.error || 'Safe cleaning failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Error running safe cleaning.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-emerald-900 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="bg-teal-500/20 text-teal-300 text-xs font-semibold px-2.5 py-1 rounded border border-teal-500/30">
              Tab 4 • Safe Standardization Engine
            </span>
            <h1 className="text-2xl font-bold mt-2">Deterministic Safe Data Cleaning</h1>
            <p className="text-teal-100 text-xs mt-1 max-w-xl">
              Standardizes deterministic patterns: abbreviations (e.g. <code>Clrd</code> → <code>Cleared</code>),
              valid date variations to standard ISO <code>YYYY-MM-DD</code>, and trims leading/trailing whitespace.
            </p>
          </div>

          <button
            onClick={handleApplyClean}
            disabled={isLoading || !sessionId}
            className="flex items-center space-x-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold px-5 py-3 rounded-xl shadow-lg transition duration-150 disabled:opacity-50 text-xs shrink-0"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span>⚡ Apply Safe Standardizations</span>
          </button>
        </div>
      </div>

      {/* Zero Hallucination Rule Alert */}
      <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl flex items-start space-x-3 text-xs shadow-sm">
        <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold block text-amber-950">
            Strict Zero Hallucination Principle in Fitness Data Governance
          </strong>
          <span>
            The algorithm refuses to guess, fabricate, or impute missing names, dates of birth,
            unusable emails, or blank PAR-Q screening outcomes. All ambiguous items are safely preserved
            and dispatched to the <strong>Human Review Queue (Tab 5)</strong> for gym data steward verification.
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Comparison Grid (After Cleaning Triggered) */}
      {comparison && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Before vs. After Cleaning Audit Comparison</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-500">Initial Issue Events</span>
              <div className="text-xl font-bold text-slate-800 mt-1">
                {comparison.originalIssueEvents}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100">
              <span className="text-[11px] text-emerald-700">Standardized & Resolved</span>
              <div className="text-xl font-bold text-emerald-800 mt-1">
                {comparison.issueEventsResolved}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
              <span className="text-[11px] text-amber-700">Remaining for Human Review</span>
              <div className="text-xl font-bold text-amber-800 mt-1">
                {comparison.newIssueEvents}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-teal-50 border border-teal-100">
              <span className="text-[11px] text-teal-700">Automated Reduction Rate</span>
              <div className="text-xl font-bold text-teal-800 mt-1">
                {comparison.percentReduction}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Changelog */}
      {changelog.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Automated Transformations Changelog
              </h2>
              <p className="text-xs text-slate-500">
                Audit trail of all non-destructive, deterministic modifications executed on the dataset.
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              {changelog.length} transformations applied
            </span>
          </div>

          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="py-2 px-3">Row #</th>
                  <th className="py-2 px-3">Field</th>
                  <th className="py-2 px-3">Original Value</th>
                  <th className="py-2 px-3"></th>
                  <th className="py-2 px-3">Standardized Value</th>
                  <th className="py-2 px-3">Rule Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {changelog.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50/70 transition">
                    <td className="py-2 px-3 font-mono font-medium text-slate-900">
                      #{c.rowNumber}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{c.field}</td>
                    <td className="py-2 px-3 font-mono text-rose-700 bg-rose-50/50 px-2 py-0.5 rounded">
                      {c.originalValue}
                    </td>
                    <td className="py-2 px-1 text-slate-400 text-center">
                      <ArrowRight className="h-3 w-3 inline" />
                    </td>
                    <td className="py-2 px-3 font-mono text-emerald-700 bg-emerald-50/50 px-2 py-0.5 rounded font-semibold">
                      {c.newValue}
                    </td>
                    <td className="py-2 px-3 text-slate-500">{c.rule}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

