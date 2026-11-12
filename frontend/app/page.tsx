'use client';

import React, { useState, useEffect } from 'react';
import WorkspaceShell, { UserAccount } from '../components/WorkspaceShell';
import LoginPage from '../components/LoginPage';
import FrontDeskView from '../components/roles/FrontDeskView';
import ClinicView from '../components/roles/ClinicView';
import TurnstileView from '../components/roles/TurnstileView';
import StewardView from '../components/roles/StewardView';
import ManagerView from '../components/roles/ManagerView';
import GovernanceView from '../components/GovernanceView';
import { fetchLatestAudit } from '../lib/api';
import { ErrorLogItem } from '../types/dqm';

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeSection, setActiveSection] = useState<string>('dashboard');
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

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    if (user.role === 'FRONTDESK') setActiveSection('frontdesk');
    else if (user.role === 'CLINIC') setActiveSection('clinic');
    else if (user.role === 'TURNSTILE') setActiveSection('turnstile');
    else if (user.role === 'STEWARD') setActiveSection('steward');
    else setActiveSection('dashboard');
  };

  // When not authenticated, show Login Page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // When signed in:
  return (
    <WorkspaceShell
      currentUser={currentUser}
      onLogout={() => setCurrentUser(null)}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      {activeSection === 'dashboard' && <ManagerView />}
      {activeSection === 'frontdesk' && <FrontDeskView />}
      {activeSection === 'clinic' && <ClinicView />}
      {activeSection === 'turnstile' && <TurnstileView />}
      {activeSection === 'steward' && (
        <StewardView sessionId={sessionId} errorLog={errorLog} />
      )}
      {activeSection === 'governance' && <GovernanceView />}
    </WorkspaceShell>
  );
}
