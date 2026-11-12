'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Tabs, { TabKey } from '../components/Tabs';
import UploadView from '../components/UploadView';
import DashboardView from '../components/DashboardView';
import ErrorLogView from '../components/ErrorLogView';
import CleaningView from '../components/CleaningView';
import ReviewQueueView from '../components/ReviewQueueView';
import GovernanceView from '../components/GovernanceView';
import ExportView from '../components/ExportView';
import EdmMatrixView from '../components/EdmMatrixView';
import { fetchLatestAudit, fetchReviewQueue } from '../lib/api';
import { AuditSummary, ErrorLogItem } from '../types/dqm';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('upload');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [errorLog, setErrorLog] = useState<ErrorLogItem[]>([]);
  const [baseline, setBaseline] = useState<Record<string, any> | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [reviewCount, setReviewCount] = useState<number>(0);

  // Auto-load latest audit session on start
  const loadLatest = async () => {
    try {
      const res = await fetchLatestAudit();
      if (res && res.hasData) {
        setSessionId(res.sessionId);
        setFileName(res.fileName);
        setSummary(res.summary);
        setErrorLog(res.errorLog || []);
        setBaseline(res.baseline || null);
        setStatus(res.status || 'Active');

        // Check review queue count
        if (res.sessionId) {
          const rev = await fetchReviewQueue(res.sessionId);
          if (rev && rev.success) {
            setReviewCount(rev.reviewQueue?.length || 0);
          }
        }
      }
    } catch (e) {
      console.warn('Could not auto-load latest audit:', e);
    }
  };

  useEffect(() => {
    loadLatest();
  }, []);

  const handleDatasetLoaded = (res: any) => {
    setSessionId(res.sessionId);
    setFileName(res.fileName);
    setSummary(res.audit?.summary || null);
    setErrorLog(res.audit?.errorLog || []);
    setBaseline(res.audit?.baselineComparison?.baseline || null);
    setStatus('Active');

    // Automatically transition to Tab 2: Dashboard after load
    setActiveTab('dashboard');

    if (res.sessionId) {
      fetchReviewQueue(res.sessionId).then((rev) => {
        if (rev && rev.success) {
          setReviewCount(rev.reviewQueue?.length || 0);
        }
      });
    }
  };

  const handleCleaningComplete = () => {
    setStatus('Cleaned');
    if (sessionId) {
      fetchReviewQueue(sessionId).then((rev) => {
        if (rev && rev.success) {
          setReviewCount(rev.reviewQueue?.length || 0);
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation Bar */}
      <Navbar currentSessionId={sessionId} fileName={fileName} status={status} />

      {/* 7 Workflow Tabs */}
      <Tabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        errorCount={errorLog.length}
        reviewCount={reviewCount}
      />

      {/* Main Tab Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'upload' && (
          <UploadView onDatasetLoaded={handleDatasetLoaded} />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView summary={summary} baseline={baseline} fileName={fileName} />
        )}

        {activeTab === 'errors' && (
          <ErrorLogView errorLog={errorLog} />
        )}

        {activeTab === 'cleaning' && (
          <CleaningView
            sessionId={sessionId}
            onCleaningComplete={handleCleaningComplete}
          />
        )}

        {activeTab === 'review' && (
          <ReviewQueueView sessionId={sessionId} />
        )}

        {activeTab === 'governance' && (
          <GovernanceView />
        )}

        {activeTab === 'export' && (
          <ExportView sessionId={sessionId} fileName={fileName} />
        )}

        {activeTab === 'edm' && (
          <EdmMatrixView />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            🏋️ FitQuality DQM • Fitness Member Health Screening Data Quality Management
          </span>
          <span className="text-[11px] text-slate-400">
            Next.js 14 • Express.js • PostgreSQL & Neon Ready • Group 5 EJA Project
          </span>
        </div>
      </footer>
    </div>
  );
}

