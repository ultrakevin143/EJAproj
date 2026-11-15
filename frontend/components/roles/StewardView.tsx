'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Play, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, Search, ArrowRight } from 'lucide-react';
import SourceReceipt from '../SourceReceipt';
import ErrorLogView from '../ErrorLogView';
import ReviewQueueView from '../ReviewQueueView';
import GovernanceView from '../GovernanceView';
import EdmMatrixView from '../EdmMatrixView';
import { ErrorLogItem } from '../../types/dqm';
import { apiFetch, fetchLatestEtlRun, updateEtlIssue } from '../../lib/api';

interface StewardViewProps {
  sessionId: string | null;
  errorLog: ErrorLogItem[];
}

export default function StewardView({ sessionId, errorLog }: StewardViewProps) {
  const [sources, setSources] = useState<any | null>(null);
  const [etlRunning, setEtlRunning] = useState(false);
  const [pipelineRun, setPipelineRun] = useState<any | null>(null);
  const [pipelineIssues, setPipelineIssues] = useState<any[]>([]);
  const [savingIssue, setSavingIssue] = useState<string | null>(null);
  const [issueNotes, setIssueNotes] = useState<Record<string, string>>({});
  const [issueStatuses, setIssueStatuses] = useState<Record<string, 'Open' | 'Resolved' | 'Quarantined'>>({});
  const [activeTab, setActiveTab] = useState<'pipeline' | 'dqm' | 'review' | 'governance' | 'matrix'>('pipeline');

  const fetchSourceStats = async () => {
    try {
      const res = await apiFetch('/roles/steward/sources');
      const data = await res.json();
      if (data.success) {
        setSources(data.sources);
      }
    } catch (err) {
      console.error('Failed to fetch source stats:', err);
    }
  };

  const fetchLatestPipelineRun = async () => {
    try {
      const data = await fetchLatestEtlRun();
      if (data.success) {
        setPipelineRun(data.run || null);
        setPipelineIssues(data.issues || []);
      }
    } catch (err) {
      console.error('Failed to fetch ETL history:', err);
    }
  };

  useEffect(() => {
    fetchSourceStats();
    fetchLatestPipelineRun();
  }, []);

  const handleRunEtl = async () => {
    setEtlRunning(true);
    try {
      const res = await apiFetch('/roles/steward/run-etl', {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        await Promise.all([fetchSourceStats(), fetchLatestPipelineRun()]);
      }
    } catch (err) {
      console.error('ETL run failed:', err);
    } finally {
      setEtlRunning(false);
    }
  };

  const saveIssueReview = async (issueId: string, status: 'Open' | 'Resolved' | 'Quarantined') => {
    setSavingIssue(issueId);
    try {
      const result = await updateEtlIssue(issueId, { status, note: issueNotes[issueId] || '' });
      if (result.success) await fetchLatestPipelineRun();
      else console.error(result.error || 'Issue review could not be saved.');
    } catch (err) {
      console.error('Issue review could not be saved:', err);
    } finally {
      setSavingIssue(null);
    }
  };

  const latestRun = pipelineRun;
  const rawCount = latestRun
    ? Number(latestRun.crm_rows || 0) + Number(latestRun.clinic_rows || 0) + Number(latestRun.turnstile_rows || 0)
    : 0;

  return (
    <div>
      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <span className="eyebrow">Integration · quality · lineage</span>
          <h1>Pipeline &amp; data quality</h1>
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
            {latestRun?.status === 'succeeded' ? Number(latestRun.transformation_count || 0) : 0}
          </dd>
          <span>{latestRun?.status === 'succeeded' ? 'Recorded for the latest run' : 'Run the pipeline to calculate'}</span>
        </div>
        <div>
          <dt>DQM Anomalies Identified</dt>
          <dd className="tabular-nums text-amber-700">
            {latestRun?.status === 'succeeded' ? Number(latestRun.issue_count || 0) : 0}
          </dd>
          <span>{latestRun?.status === 'succeeded' ? 'Saved with the pipeline run' : 'Run the pipeline to calculate'}</span>
        </div>
        <div>
          <dt>Human Review Queue</dt>
          <dd className="tabular-nums text-purple-700">
            {latestRun?.status === 'succeeded' ? Number(latestRun.review_queue_count || 0) : 0}
          </dd>
          <span>{latestRun?.status === 'succeeded' ? 'Steward review items from the latest run' : 'Run the pipeline to calculate'}</span>
        </div>
      </dl>

      {/* Sub-navigation Tabs */}
      <nav className="steward-tabs" aria-label="Data steward sections">
        <button
          aria-current={activeTab === 'pipeline' ? 'page' : undefined}
          onClick={() => setActiveTab('pipeline')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'pipeline'
              ? 'border-blue-600 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Pipeline &amp; warehouse
        </button>
        <button
          aria-current={activeTab === 'dqm' ? 'page' : undefined}
          onClick={() => setActiveTab('dqm')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'dqm'
              ? 'border-blue-600 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Quality issues ({pipelineIssues.length})
        </button>
        <button
          aria-current={activeTab === 'review' ? 'page' : undefined}
          onClick={() => setActiveTab('review')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'review'
              ? 'border-blue-600 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          CSV Review Queue
        </button>
        <button
          aria-current={activeTab === 'governance' ? 'page' : undefined}
          onClick={() => setActiveTab('governance')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'governance'
              ? 'border-blue-600 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Governance register
        </button>
        <button
          aria-current={activeTab === 'matrix' ? 'page' : undefined}
          onClick={() => setActiveTab('matrix')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'matrix'
              ? 'border-blue-600 text-blue-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          EDM matrix
        </button>
      </nav>

      {/* Tab 1: Pipeline Execution Details */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          {latestRun ? (
            <div className="data-table-container p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">Latest saved pipeline run</h2>
                  <p className="text-xs text-slate-500 mt-1">Run ID: {latestRun.run_id}</p>
                </div>
                <span className={`status-pill ${latestRun.status === 'succeeded' ? 'positive' : latestRun.status === 'failed' ? 'negative' : 'warning'}`}>
                  {latestRun.status}
                </span>
              </div>
              <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><dt className="text-slate-500">Source rows</dt><dd className="font-semibold">{rawCount}</dd></div>
                <div><dt className="text-slate-500">Warehouse rows</dt><dd className="font-semibold">{latestRun.loaded_rows || 0}</dd></div>
                <div><dt className="text-slate-500">Quality issues</dt><dd className="font-semibold">{latestRun.issue_count || 0}</dd></div>
                <div><dt className="text-slate-500">Orphan scans</dt><dd className="font-semibold">{latestRun.orphan_count || 0}</dd></div>
                <div><dt className="text-slate-500">Transformations</dt><dd className="font-semibold">{latestRun.transformation_count || 0}</dd></div>
                <div><dt className="text-slate-500">Steward review items</dt><dd className="font-semibold">{latestRun.review_queue_count || 0}</dd></div>
                <div><dt className="text-slate-500">Started</dt><dd className="font-semibold">{new Date(latestRun.started_at).toLocaleString()}</dd></div>
                <div><dt className="text-slate-500">Finished</dt><dd className="font-semibold">{latestRun.finished_at ? new Date(latestRun.finished_at).toLocaleString() : 'Still running'}</dd></div>
              </dl>
              {latestRun.error_message && <p className="text-sm text-red-700">{latestRun.error_message}</p>}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              No saved pipeline runs yet. Run the pipeline to create the first run record.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: DQM Error Findings */}
      {activeTab === 'dqm' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-semibold text-slate-900 mb-3">Multi-source ETL issues</h2>
            {pipelineIssues.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                No saved ETL issues for the latest run.
              </div>
            ) : (
              <div className="data-table-container overflow-x-auto">
                <table className="enterprise-table min-w-[900px]">
                  <thead>
                    <tr><th>Source / Member</th><th>Field</th><th>Finding</th><th>Severity</th><th>Current Value</th><th>Review</th></tr>
                  </thead>
                  <tbody>
                    {pipelineIssues.map((issue) => (
                      <tr key={issue.id}>
                        <td className="text-xs">{issue.source_name}<br /><span className="font-mono text-slate-500">{issue.member_id || '—'}</span></td>
                        <td className="font-mono text-xs">{issue.field_name}</td>
                        <td><strong>{issue.issue_category}</strong><br /><span className="text-xs text-slate-500">{issue.dqm_principle}</span></td>
                        <td>{issue.severity}</td>
                        <td className="max-w-[180px] truncate" title={issue.issue_value}>{issue.issue_value || '—'}</td>
                        <td className="min-w-[230px]">
                          <select
                            aria-label={`Review status for ${issue.issue_category}`}
                            value={issueStatuses[issue.id] || issue.review_status}
                            onChange={(event) => setIssueStatuses((current) => ({ ...current, [issue.id]: event.target.value as 'Open' | 'Resolved' | 'Quarantined' }))}
                            className="mb-2 w-full rounded border border-slate-300 px-2 py-1 text-xs"
                          >
                            <option>Open</option><option>Resolved</option><option>Quarantined</option>
                          </select>
                          <input
                            value={issueNotes[issue.id] ?? issue.review_note ?? ''}
                            onChange={(event) => setIssueNotes((current) => ({ ...current, [issue.id]: event.target.value }))}
                            placeholder="Required note for resolution"
                            maxLength={500}
                            className="mb-2 w-full rounded border border-slate-300 px-2 py-1 text-xs"
                          />
                          <button
                            type="button"
                            disabled={savingIssue === issue.id}
                            onClick={() => saveIssueReview(issue.id, issueStatuses[issue.id] || issue.review_status)}
                            className="btn btn-secondary text-xs"
                          >
                            {savingIssue === issue.id ? 'Saving…' : 'Save review'}
                          </button>
                          {issue.reviewed_by && <p className="mt-1 text-[10px] text-slate-500">Reviewed by {issue.reviewed_by}</p>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 mb-3">CSV upload findings</h2>
            <ErrorLogView errorLog={errorLog} />
          </div>
        </div>
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
