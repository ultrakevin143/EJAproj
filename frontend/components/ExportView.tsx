'use client';

import React from 'react';
import {
  Download,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { getExportUrl } from '../lib/api';

interface ExportViewProps {
  sessionId: string | null;
  fileName: string | null;
}

export default function ExportView({ sessionId, fileName }: ExportViewProps) {
  const exports = [
    {
      type: 'cleaned-csv',
      title: 'Standardized Cleaned Dataset',
      format: 'CSV',
      desc: 'Gym screening records with abbreviations expanded, valid dates in ISO YYYY-MM-DD, and whitespace trimmed.',
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
      btnColor: 'bg-emerald-600 hover:bg-emerald-500 text-white'
    },
    {
      type: 'error-log-csv',
      title: 'DQM Issue Event Log',
      format: 'CSV',
      desc: 'Granular log of every detected issue event, classified by 6 DQM principles, severity, and suggested action.',
      icon: AlertCircle,
      color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
      btnColor: 'bg-rose-600 hover:bg-rose-500 text-white'
    },
    {
      type: 'review-queue-csv',
      title: 'Human Review Queue Export',
      format: 'CSV',
      desc: 'All unresolved records requiring data steward verification, including current steward notes and manual values.',
      icon: ShieldCheck,
      color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
      btnColor: 'bg-amber-600 hover:bg-amber-500 text-white'
    },
    {
      type: 'raw-csv',
      title: 'Original Raw Dataset',
      format: 'CSV',
      desc: 'Exact replica of the originally uploaded/generated dataset preserving pristine raw file immutability.',
      icon: FileSpreadsheet,
      color: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
      btnColor: 'bg-slate-800 hover:bg-slate-700 text-white'
    },
    {
      type: 'summary-json',
      title: 'Executive Audit Summary Report',
      format: 'JSON',
      desc: 'Machine-readable comprehensive report of audit metrics, variance statistics, and active governance policies.',
      icon: FileCode,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
      btnColor: 'bg-indigo-600 hover:bg-indigo-500 text-white'
    },
    {
      type: 'sample-template',
      title: 'Classroom 500-Record Sample CSV',
      format: 'CSV',
      desc: 'Fresh synthetic gym member health screening template with intentional DQM errors for demonstration.',
      icon: FileSpreadsheet,
      color: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100',
      btnColor: 'bg-teal-600 hover:bg-teal-500 text-white'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 rounded-2xl p-6 text-white shadow-md">
        <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2.5 py-1 rounded border border-emerald-500/30">
          Tab 7 • Export & Governance Compliance
        </span>
        <h1 className="text-2xl font-bold mt-2">Export Data & Audit Artifacts</h1>
        <p className="text-emerald-100 text-xs mt-1 max-w-xl">
          Download standardized datasets, audit logs, and data steward queues for external reporting,
          auditing compliance, or downstream fitness analytics integration.
        </p>
      </div>

      {!sessionId && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-xs">
          Notice: Please upload or generate a dataset on Tab 1 to download session-specific exports.
        </div>
      )}

      {/* Grid of Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exports.map((item) => {
          const Icon = item.icon;
          const downloadUrl = sessionId ? getExportUrl(sessionId, item.type) : '#';

          return (
            <div
              key={item.type}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg border ${item.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase font-mono">
                    {item.format}
                  </span>
                </div>

                <h3 className="font-bold text-slate-800 text-sm">{item.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <a
                  href={downloadUrl}
                  download
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition ${
                    !sessionId && item.type !== 'sample-template'
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed pointer-events-none'
                      : item.btnColor
                  }`}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download {item.format}</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

