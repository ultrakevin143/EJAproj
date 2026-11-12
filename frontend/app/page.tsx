'use client';

import React, { useState, useEffect } from 'react';
import Navbar, { UserRole } from '../components/Navbar';
import FrontDeskView from '../components/roles/FrontDeskView';
import ClinicView from '../components/roles/ClinicView';
import TurnstileView from '../components/roles/TurnstileView';
import StewardView from '../components/roles/StewardView';
import ManagerView from '../components/roles/ManagerView';
import { fetchLatestAudit } from '../lib/api';
import { ErrorLogItem } from '../types/dqm';
import { ShieldCheck, Lock, UserCheck, Stethoscope, Radio, Shield, BarChart3, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const [currentRole, setCurrentRole] = useState<UserRole>('frontdesk');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [errorLog, setErrorLog] = useState<ErrorLogItem[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  // Auto-load latest audit session on start (for Steward & System stats)
  const loadLatest = async () => {
    try {
      const res = await fetchLatestAudit();
      if (res && res.hasData) {
        setSessionId(res.sessionId);
        setErrorLog(res.errorLog || []);
        setStatus(res.status || 'Active');
      }
    } catch (e) {
      console.warn('Could not auto-load latest audit:', e);
    }
  };

  useEffect(() => {
    loadLatest();
  }, []);

  // Role metadata for strict access badge & demo context
  const roleInfo: Record<
    UserRole,
    {
      title: string;
      badge: string;
      color: string;
      icon: any;
      description: string;
      securityBoundary: string;
      stepNumber: number;
    }
  > = {
    frontdesk: {
      title: 'Front-Desk Reception Intake',
      badge: 'Role Account: FRONT_DESK_STAFF',
      color: 'bg-blue-50 text-blue-800 border-blue-200',
      icon: UserCheck,
      description: 'Customer registration, membership tier assignment, and real-time badge clearance verification.',
      securityBoundary: 'Strict Boundary: Cannot view confidential clinical notes or biometric heart rates (HIPAA/GDPR compliance).',
      stepNumber: 1
    },
    clinic: {
      title: 'Clinic & Fitness Assessment Station',
      badge: 'Role Account: CLINIC_ASSESSOR',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: Stethoscope,
      description: 'Physical Activity Readiness Questionnaire (PAR-Q) clinical evaluations, resting HR recording, and cardiac flags.',
      securityBoundary: 'Strict Boundary: Clinicians only record health assessments; cannot modify membership billing or grant turnstile overrides.',
      stepNumber: 2
    },
    turnstile: {
      title: 'Facility IoT RFID Turnstile Terminal',
      badge: 'Machine Account: TURNSTILE_GATE_01',
      color: 'bg-purple-50 text-purple-800 border-purple-200',
      icon: Radio,
      description: 'Automated physical access control gate querying the integrated warehouse for member safety clearance.',
      securityBoundary: 'Strict Boundary: Machine IoT agent. Unlocks barrier ONLY if member has ACTIVE_CLEARANCE. Blocks flagged or unassessed members.',
      stepNumber: 3
    },
    steward: {
      title: 'Data Governance & ETL Pipeline Control',
      badge: 'Role Account: DATA_STEWARD',
      color: 'bg-amber-50 text-amber-900 border-amber-200',
      icon: Shield,
      description: 'Multi-source data integration engine: extracts disparate CRM, Clinic, and IoT logs, applies DQM cleaning, and populates Member 360.',
      securityBoundary: 'Strict Boundary: Master data management authority. Controls ETL pipelines, resolves human review queues, and enforces governance rules.',
      stepNumber: 4
    },
    manager: {
      title: 'General Manager Executive 360 Dashboard',
      badge: 'Role Account: GENERAL_MANAGER',
      color: 'bg-slate-100 text-slate-900 border-slate-300',
      icon: BarChart3,
      description: 'Consolidated Member 360 warehouse analytics, health risk KPI metrics, and live facility gate monitoring.',
      securityBoundary: 'Strict Boundary: Read-only business intelligence view. No write access to CRM or raw clinical records.',
      stepNumber: 5
    }
  };

  const currentInfo = roleInfo[currentRole];
  const CurrentRoleIcon = currentInfo.icon;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased">
      {/* Top Navigation Bar with Role Switcher */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        currentSessionId={sessionId}
        status={status}
      />

      {/* Role Context & Strict Access Boundary Bar */}
      <section className="bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                <CurrentRoleIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Step {currentInfo.stepNumber} of 5 Demo Flow
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded border ${currentInfo.color}`}>
                    {currentInfo.badge}
                  </span>
                </div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  {currentInfo.title}
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
              <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-700">
                {currentInfo.securityBoundary}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* STRICT ROLE-GUARDED CONTENT AREA:
          Only the active role account's designated page/dashboard is mounted and accessible.
      */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentRole === 'frontdesk' && <FrontDeskView />}
        {currentRole === 'clinic' && <ClinicView />}
        {currentRole === 'turnstile' && <TurnstileView />}
        {currentRole === 'steward' && (
          <StewardView sessionId={sessionId} errorLog={errorLog} />
        )}
        {currentRole === 'manager' && <ManagerView />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold text-slate-700">FitQuality Multi-Source DQM &amp; Governance</span>
            <span className="text-slate-400">•</span>
            <span>Fitness Member Health Screening Integration</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Next.js 14 • Express.js • PostgreSQL / Neon DB • Role-Based Access Control
          </span>
        </div>
      </footer>
    </div>
  );
}
