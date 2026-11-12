'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Play,
  Layers,
  Database,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileCode,
  UserCheck,
  Download
} from 'lucide-react';
import ErrorLogView from '../ErrorLogView';
import ReviewQueueView from '../ReviewQueueView';
import GovernanceView from '../GovernanceView';
import ExportView from '../ExportView';
import EdmMatrixView from '../EdmMatrixView';
import { ErrorLogItem } from '../../types/dqm';

interface StewardViewProps {
  sessionId: string | null;
  errorLog: ErrorLogItem[];
}

export default function StewardView({ sessionId, errorLog }: StewardViewProps) {
  const [sources, setSources] = useState<any | null>(null);
  const [etlRunning, setEtlRunning] = useState(false);
  const [etlResult, setEtlResult] = useState<any | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'pipeline' | 'errors' | 'review' | 'governance' | 'export' | 'matrix'>('pipeline');

  const fetchSourceStats = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/roles/steward/sources');
      const data = await res.json();
      if (data.success) {
        setSources(data.sources);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSourceStats();
  }, []);

  const handleRunEtl = async () => {
    setEtlRunning(true);
    setEtlResult(null);

    try {
      const res = await fetch('http://localhost:3000/api/roles/steward/run-etl', {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setEtlResult(data.etlResult);
        fetchSourceStats();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setEtlRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-rose-500/20 text-rose-300 text-xs font-semibold px-2 py-0.5 rounded border border-rose-500/30">
              Role: Data Quality Steward & Compliance Officer
            </span>
            <span className="text-slate-400 text-xs">• Domain: Multi-Source ETL & Governance</span>
          </div>
          <h1 className="text-xl font-bold mt-1.5 text-white">Enterprise Data Integration (ETL) & DQM Command Center</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Extract from disparate source systems, transform with DQM cleaning rules, load into PostgreSQL data warehouse, and govern policies.
          </p>
        </div>

        <button
          onClick={handleRunEtl}
          disabled={etlRunning}
          className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow transition duration-150 disabled:opacity-50 shrink-0"
        >
          <Play className={`h-4 w-4 ${etlRunning ? 'animate-spin' : 'fill-slate-950'}`} />
          <span>{etlRunning ? 'Running Integration Pipeline...' : '⚡ Run Multi-Source ETL Pipeline'}</span>
        </button>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold text-slate-600">
        {[
          { key: 'pipeline', label: '1. Multi-Source ETL Pipeline', icon: Layers },
          { key: 'errors', label: '2. DQM Error Audit Log', icon: AlertTriangle },
          { key: 'review', label: '3. Human Review Queue', icon: UserCheck },
          { key: 'governance', label: '4. Governance Policies', icon: ShieldAlert },
          { key: 'export', label: '5. Export Data Warehouse', icon: Download },
          { key: 'matrix', label: '6. Slide 18/19 EDM Matrix', icon: FileCode }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key as any)}
              className={`flex items-center space-x-1.5 py-2 px-3.5 rounded-lg whitespace-nowrap transition ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'hover:bg-slate-200/60 text-slate-700'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub Tab 1: Multi-Source ETL Pipeline Visualizer */}
      {activeSubTab === 'pipeline' && (
        <div className="space-y-6">
          {/* Sources Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
              <span className="text-[11px] font-semibold text-slate-500">Source 1: CRM Members</span>
              <div className="text-xl font-bold text-slate-900">
                {sources?.crm_members ?? 150} records
              </div>
              <span className="text-[10px] text-slate-400 block">Table: <code>crm_members</code></span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
              <span className="text-[11px] font-semibold text-slate-500">Source 2: Clinic Screenings</span>
              <div className="text-xl font-bold text-slate-900">
                {sources?.clinic_screenings ?? 133} records
              </div>
              <span className="text-[10px] text-slate-400 block">Table: <code>clinic_screenings</code></span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
              <span className="text-[11px] font-semibold text-slate-500">Source 3: Turnstile Check-ins</span>
              <div className="text-xl font-bold text-slate-900">
                {sources?.turnstile_scans ?? 296} scans
              </div>
              <span className="text-[10px] text-slate-400 block">Table: <code>turnstile_scans</code></span>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-sm space-y-2">
              <span className="text-[11px] font-semibold text-emerald-800">Target Data Warehouse</span>
              <div className="text-xl font-bold text-emerald-900">
                {sources?.target_warehouse_360 ?? 150} Member 360°
              </div>
              <span className="text-[10px] text-emerald-700 block">Table: <code>integrated_members_360</code></span>
            </div>
          </div>

          {/* Interactive ETL Flowchart Architecture */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-800 flex items-center space-x-2">
              <Layers className="h-4 w-4 text-emerald-600" />
              <span>Multi-Source ETL Pipeline Architecture (integration.pptx Slides 4–8)</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* EXTRACT */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-3">
                <div className="flex items-center space-x-2 text-blue-900 font-bold text-xs border-b border-blue-200 pb-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  <span>1. EXTRACT (Multi-Source Ingestion)</span>
                </div>
                <ul className="text-xs text-blue-800 space-y-1.5 leading-relaxed">
                  <li>• Ingests <strong>CRM Members</strong> (ID, Name, DOB, Email)</li>
                  <li>• Ingests <strong>Clinic Screenings</strong> (PAR-Q, Heart Rate)</li>
                  <li>• Ingests <strong>Turnstile RFID logs</strong> (Scans, Zone)</li>
                </ul>
              </div>

              {/* TRANSFORM */}
              <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 space-y-3">
                <div className="flex items-center space-x-2 text-teal-900 font-bold text-xs border-b border-teal-200 pb-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-600" />
                  <span>2. TRANSFORM (Integration & DQM)</span>
                </div>
                <ul className="text-xs text-teal-800 space-y-1.5 leading-relaxed">
                  <li>• <strong>System Joining:</strong> Merges sources on <code>member_id</code></li>
                  <li>• <strong>Orphan Detection:</strong> Flags unlinked turnstile check-ins</li>
                  <li>• <strong>DQM Standards:</strong> Expands abbreviations (<code>Clrd</code> $\rightarrow$ <code>Cleared</code>), formats ISO dates, standardizes names</li>
                  <li>• <strong>Gate Rules:</strong> Computes Turnstile Clearance status</li>
                </ul>
              </div>

              {/* LOAD */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
                <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs border-b border-emerald-200 pb-2">
                  <Database className="h-4 w-4 text-emerald-600" />
                  <span>3. LOAD (PostgreSQL / Neon DW)</span>
                </div>
                <ul className="text-xs text-emerald-800 space-y-1.5 leading-relaxed">
                  <li>• Writes clean records into <code>integrated_members_360</code></li>
                  <li>• Powers the real-time Turnstile Gate API</li>
                  <li>• Powers the General Manager Executive BI analytics</li>
                  <li>• Preserves full audit logs in <code>review_queue</code></li>
                </ul>
              </div>
            </div>
          </div>

          {/* ETL Execution Metrics (After button click) */}
          {etlResult && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>ETL Pipeline Execution Run Metrics</span>
                </h3>
                <span className="font-mono text-slate-500 text-[11px]">
                  Execution Time: {etlResult.executionTimeMs} ms
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 text-[11px]">Extracted Raw Records</span>
                  <div className="text-base font-bold text-slate-800 mt-0.5">
                    {etlResult.metrics?.extracted?.totalRawRecords}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 text-[11px]">DQM Standardizations</span>
                  <div className="text-base font-bold text-emerald-700 mt-0.5">
                    {etlResult.metrics?.transformations?.totalChanges} applied
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 text-[11px]">Turnstile Medical Blocks</span>
                  <div className="text-base font-bold text-rose-700 mt-0.5">
                    {etlResult.metrics?.transformations?.medicalBlocksApplied} flagged
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 text-[11px]">Orphan Check-ins Detected</span>
                  <div className="text-base font-bold text-amber-700 mt-0.5">
                    {etlResult.metrics?.transformations?.orphansDetected} unlinked
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sub Tab 2: DQM Error Audit Log */}
      {activeSubTab === 'errors' && (
        <ErrorLogView errorLog={errorLog} />
      )}

      {/* Sub Tab 3: Human Review Queue */}
      {activeSubTab === 'review' && (
        <ReviewQueueView sessionId={sessionId} />
      )}

      {/* Sub Tab 4: Governance Policies */}
      {activeSubTab === 'governance' && (
        <GovernanceView />
      )}

      {/* Sub Tab 5: Export Data Warehouse */}
      {activeSubTab === 'export' && (
        <ExportView sessionId={sessionId} fileName="integrated_member_360.csv" />
      )}

      {/* Sub Tab 6: Comparative EDM Matrix */}
      {activeSubTab === 'matrix' && (
        <EdmMatrixView />
      )}
    </div>
  );
}

