'use client';

import React, { useState, useEffect } from 'react';
import WorkspaceShell, { UserAccount } from '../components/WorkspaceShell';
import LoginPage from '../components/LoginPage';
import FrontDeskView from '../components/roles/FrontDeskView';
import ClinicView from '../components/roles/ClinicView';
import TurnstileView from '../components/roles/TurnstileView';
import StewardView from '../components/roles/StewardView';
import ManagerView from '../components/roles/ManagerView';
import { fetchLatestAudit } from '../lib/api';
import { ErrorLogItem } from '../types/dqm';

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [errorLog, setErrorLog] = useState<ErrorLogItem[]>([]);

  // Load audit session info for DQM engine
  const loadLatestAudit = async () => {
    try {
      const res = await fetchLatestAudit();
      if (res && res.hasData) {
        setSessionId(res.sessionId);
        setErrorLog(res.errorLog || []);
      }
    } catch (e) {
      console.warn('Could not load latest audit:', e);
    }
  };

  useEffect(() => {
    loadLatestAudit();
  }, []);

  // When not authenticated, show Sir Dan's Folio-style Login Page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  // When signed in, the user can ONLY access their designated dashboard
  return (
    <WorkspaceShell
      currentUser={currentUser}
      onLogout={() => setCurrentUser(null)}
    >
      {currentUser.role === 'FRONTDESK' && <FrontDeskView />}
      {currentUser.role === 'CLINIC' && <ClinicView />}
      {currentUser.role === 'TURNSTILE' && <TurnstileView />}
      {currentUser.role === 'STEWARD' && (
        <StewardView sessionId={sessionId} errorLog={errorLog} />
      )}
      {currentUser.role === 'MANAGER' && <ManagerView />}
    </WorkspaceShell>
  );
}
