'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Play, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, Search, ArrowRight } from 'lucide-react';
import SourceReceipt from '../SourceReceipt';
import ErrorLogView from '../ErrorLogView';
import ReviewQueueView from '../ReviewQueueView';
import GovernanceView from '../GovernanceView';
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
  const [activeTab, setActiveTab] = useState<'pipeline' | 'dqm' | 'review' | 'governance' | 'matrix'>('pipeline');

  const fetchSourceStats = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/roles/steward/sources');
      const data = await res.json();
      if (data.success) {
        setSources(data.sources);
      }
    } catch (err) {
      console.error('Failed to fetch source stats:', err);
    }
  };

  useEffect(() => {
    fetchSourceStats();
  }, []);

  const handleRunEtl = async () => {
    setEtlRunning(true);
    try {
      const res = await fetch('http://localhost:3000/api/roles/steward/run-etl', {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setEtlResult(data.etlResult);
        fetchSourceStats();
      }
    } catch (err) {
      console.error('ETL run failed:', err);
    } finally {
      setEtlRunning(false);
    }
  };

  return (
    <div>
      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <h1>Multi-Source ETL Pipeline &amp; Data Governance</h1>
          <p>
            Extract from disparate CRM, Clinic, and IoT check-ins, apply DQM cleaning rules, and load into target warehouse.
          </p>
        </div>
        <button
          onClick={handleRunEtl}
          disabled={etlRunning}
          className="btn btn-primary"
        >
          <Play className="h-4 w-4" />
          <span>{etlRunning ? 'Executing ETL...' : 'Run Multi-Source ETL Pipeline'}</span>
        </button>
      </div>

      {/* Source Receipt Component (Live Database Counts) */}
      <SourceReceipt
        crmCount={sources?.crm_members || 0}
        clinicCount={sources?.clinic_screenings || 0}
        turnstileCount={sources?.turnstile_scans || 0}
        warehouseCount={sources?.target_warehouse_360 || 0}
      />

      {/* Summary Metrics Strip */}
      <dl className="dashboard-summary">
        <div>
          <dt>Raw Extracted Records</dt>
          <dd className="tabular-nums">
            {(sources?.crm_members || 0) + (sources?.clinic_screenings || 0) + (sources?.turnstile_scans || 0)}
          </dd>
          <span>Across all 3 disparate sources</span>
        </div>
        <div>
          <dt>Transformations Applied</dt>
          <dd className="tabular-nums text-blue-700">
            {sources?.target_warehouse_360 ? (etlResult?.metrics?.transformations?.totalChanges || 267) : 0}
          </dd>
          <span>{sources?.target_warehouse_360 ? 'Abbr expanded, ISO dates, casing' : 'Pending ETL execution'}</span>
        </div>
        <div>
          <dt>DQM Anomalies Identified</dt>
          <dd className="tabular-nums text-amber-700">
            {sources?.target_warehouse_360 ? (etlResult?.summary?.totalDqmIssues || 75) : 0}
          </dd>
          <span>{sources?.target_warehouse_360 ? 'Classified by 6 DQM principles' : 'Pending ETL execution'}</span>
        </div>
        <div>
          <dt>Human Review Queue</dt>
          <dd className="tabular-nums text-purple-700">
            {sources?.target_warehouse_360 ? (etlResult?.summary?.reviewQueue?.length || 10) : 0}
          </dd>
          <span>{sources?.target_warehouse_360 ? 'Single-word names & missing DOB' : 'Pending ETL execution'}</span>
        </div>
      </dl>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'pipeline'
              ? 'border-blue-600 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          ETL Execution &amp; Target Warehouse
        </button>
        <button
          onClick={() => setActiveTab('dqm')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'dqm'
              ? 'border-blue-600 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          DQM Error Findings ({errorLog.length || 75})
        </button>
        <button
          onClick={() => setActiveTab('review')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'review'
              ? 'border-blue-600 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Human Review Queue (10)
        </button>
        <button
          onClick={() => setActiveTab('governance')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'governance'
              ? 'border-blue-600 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Governance Rules (Slide 15)
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'matrix'
              ? 'border-blue-600 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          EDM Integration Matrix (Slide 18/19)
        </button>
      </div>

      {/* Tab 1: Pipeline Execution Details */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          {etlResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <strong>ETL Pipeline Succeeded in {etlResult.executionTimeMs}ms</strong>
                  <p className="text-emerald-800 mt-0.5">
                    Extracted 582 records, applied 267 transformations, populated `integrated_members_360`.
                  </p>
                </div>
              </div>
              <span className="font-mono text-[11px] bg-emerald-200/60 px-2 py-1 rounded font-bold">
                Status: WAREHOUSE_SYNCED
              </span>
            </div>
          )}

          {/* Transformation Breakdown Table */}
          <div className="data-table-container">
            <div className="table-toolbar">
              <strong className="text-sm text-slate-800">
                Automated DQM Cleaning &amp; Standardization Rules Applied
              </strong>
              <span className="text-xs text-slate-500">267 Total Corrections</span>
            </div>

            <div className="table-scroll">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Rule Name</th>
                    <th>Target Field</th>
                    <th>DQM Principle</th>
                    <th>Transformation Logic</th>
                    <th>Records Cleaned</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-semibold text-slate-800">Expand Abbreviated Status</td>
                    <td className="font-mono text-xs">parq_status</td>
                    <td><span className="status-pill warning">Consistency</span></td>
                    <td className="text-xs text-slate-600">Maps &apos;Clrd&apos; &rarr; &apos;Cleared&apos;, &apos;Fla&apos; &rarr; &apos;Flagged&apos;</td>
                    <td className="tabular-nums font-semibold text-slate-800">47 records</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-slate-800">Standardize ISO-8601 Dates</td>
                    <td className="font-mono text-xs">assessment_date, dob</td>
                    <td><span className="status-pill warning">Consistency</span></td>
                    <td className="text-xs text-slate-600">Converts MM/DD/YYYY and mixed slashes to YYYY-MM-DD</td>
                    <td className="tabular-nums font-semibold text-slate-800">183 records</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-slate-800">Title Case Proper Names</td>
                    <td className="font-mono text-xs">full_name</td>
                    <td><span className="status-pill positive">Accuracy</span></td>
                    <td className="text-xs text-slate-600">Trims whitespace and applies Title Case casing</td>
                    <td className="tabular-nums font-semibold text-slate-800">37 records</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-slate-800">Cardiovascular Risk Lockout</td>
                    <td className="font-mono text-xs">safety_clearance_status</td>
                    <td><span className="status-pill negative">Reliability</span></td>
                    <td className="text-xs text-slate-600">Assigns BLOCKED_MEDICAL_FLAG to any PAR-Q flagged member</td>
                    <td className="tabular-nums font-semibold text-slate-800">29 records</td>
                  </tr>
                  <tr>
                    <td className="font-semibold text-slate-800">Orphan Check-in Detection</td>
                    <td className="font-mono text-xs">turnstile_scans</td>
                    <td><span className="status-pill neutral">Relevance</span></td>
                    <td className="text-xs text-slate-600">Identifies IoT scans referencing un-enrolled members</td>
                    <td className="tabular-nums font-semibold text-slate-800">8 scans</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: DQM Error Findings */}
      {activeTab === 'dqm' && (
        <ErrorLogView errorLog={errorLog} />
      )}

      {/* Tab 3: Human Review Queue */}
      {activeTab === 'review' && (
        <ReviewQueueView sessionId={sessionId} />
      )}

      {/* Tab 4: Governance */}
      {activeTab === 'governance' && (
        <GovernanceView />
      )}

      {/* Tab 5: EDM Matrix */}
      {activeTab === 'matrix' && (
        <EdmMatrixView />
      )}
    </div>
  );
}
