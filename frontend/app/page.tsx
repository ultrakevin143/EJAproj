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
import { fetchCurrentUser, fetchLatestAudit, logout } from '../lib/api';
import { ErrorLogItem } from '../types/dqm';

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
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
    let mounted = true;

    fetchCurrentUser()
      .then((result) => {
        if (!mounted || !result.success || !result.user) return;
        setCurrentUser(result.user);
        if (result.user.role === 'FRONTDESK') setActiveSection('frontdesk');
        else if (result.user.role === 'CLINIC') setActiveSection('clinic');
        else if (result.user.role === 'TURNSTILE') setActiveSection('turnstile');
        else if (result.user.role === 'STEWARD') setActiveSection('steward');
        else setActiveSection('dashboard');

        if (['STEWARD', 'ADMIN'].includes(result.user.role)) {
          loadLatestAudit();
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) setAuthLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    if (user.role === 'FRONTDESK') setActiveSection('frontdesk');
    else if (user.role === 'CLINIC') setActiveSection('clinic');
    else if (user.role === 'TURNSTILE') setActiveSection('turnstile');
    else if (user.role === 'STEWARD') setActiveSection('steward');
    else setActiveSection('dashboard');
    if (['STEWARD', 'ADMIN'].includes(user.role)) loadLatestAudit();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setCurrentUser(null);
      setSessionId(null);
      setErrorLog([]);
      setActiveSection('dashboard');
    }
  };

  if (authLoading) {
    return <main className="min-h-screen grid place-items-center text-slate-500">Checking your session…</main>;
  }

  // When not authenticated, show Login Page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // When signed in:
  return (
    <WorkspaceShell
      currentUser={currentUser}
      onLogout={handleLogout}
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
