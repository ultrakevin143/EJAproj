'use client';

import React from 'react';
import {
  LayoutDashboard,
  UserCheck,
  Stethoscope,
  Radio,
  Layers,
  ChevronRight,
  LogOut,
  Database
} from 'lucide-react';

export type UserRole = 'FRONTDESK' | 'CLINIC' | 'TURNSTILE' | 'STEWARD' | 'MANAGER';

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  title: string;
}

interface WorkspaceShellProps {
  currentUser: UserAccount;
  onLogout: () => void;
  children: React.ReactNode;
}

export default function WorkspaceShell({
  currentUser,
  onLogout,
  children
}: WorkspaceShellProps) {
  // Map each role strictly to its designated dashboard configuration
  const roleConfig: Record<
    UserRole,
    { label: string; icon: any; subtitle: string; scope: string }
  > = {
    FRONTDESK: {
      label: 'Member Intake CRM',
      icon: UserCheck,
      subtitle: 'Source 1: Front-Desk Ingestion',
      scope: 'Member Registration & Badge Clearance'
    },
    CLINIC: {
      label: 'Clinical Health Screening',
      icon: Stethoscope,
      subtitle: 'Source 2: Clinic Screenings',
      scope: 'PAR-Q Assessments & Resting HR'
    },
    TURNSTILE: {
      label: 'Turnstile Gate Terminal',
      icon: Radio,
      subtitle: 'Source 3: IoT Physical Access',
      scope: 'Automated RFID Scan & Gate Control'
    },
    STEWARD: {
      label: 'ETL & Quality Management',
      icon: Layers,
      subtitle: 'Multi-Source Integration Engine',
      scope: 'ETL Pipeline, DQM Rules & Review Queue'
    },
    MANAGER: {
      label: 'Executive 360 Dashboard',
      icon: LayoutDashboard,
      subtitle: 'Target Warehouse Analytics',
      scope: 'Consolidated Member 360 & Operations'
    }
  };

  const currentConfig = roleConfig[currentUser.role];
  const CurrentIcon = currentConfig.icon;

  return (
    <div className="app-shell">
      {/* ─── Left Sidebar Navigation ─── */}
      <aside className="sidebar">
        {/* Brand Header */}
        <div className="brand">
          <div className="brand-monogram">F</div>
          <div>
            <span>fitquality<span className="text-blue-600">.</span></span>
          </div>
        </div>

        {/* Workspace Monogram Block */}
        <div className="workspace-label">
          <strong>{currentUser.name}</strong>
          <span className="text-[12px] text-slate-500 font-mono truncate block">
            {currentUser.email}
          </span>
        </div>

        {/* Role's Single Exclusive Navigation Item */}
        <nav className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
            Designated Dashboard
          </span>
          <div className="nav-link active">
            <CurrentIcon className="h-4 w-4 shrink-0 text-blue-700" />
            <span className="font-semibold">{currentConfig.label}</span>
          </div>
        </nav>

        {/* Sidebar Middle Note */}
        <div className="sidebar-footer">
          <strong>Access Scope</strong>
          <p className="text-xs text-slate-600 mt-1">
            {currentConfig.scope}
          </p>
        </div>

        {/* Database indicator */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-500">
          <Database className="h-3.5 w-3.5 text-slate-400" />
          <div>
            <span className="font-semibold text-slate-700">PostgreSQL Database</span>
            <div className="text-[11px] text-slate-400">Fitness Health Data Warehouse</div>
          </div>
        </div>
      </aside>

      {/* ─── Main Workspace Area ─── */}
      <div className="workspace-body">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-breadcrumbs">
            <span>Workspace</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <strong>{currentConfig.label}</strong>
          </div>

          <div className="topbar-controls">
            {/* Authenticated Account Profile */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-800 hidden md:inline">{currentUser.name}</span>
              <span className="status-pill neutral font-mono">{currentUser.role}</span>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-red-700 hover:bg-red-50 border border-slate-300 px-2.5 py-1.5 rounded transition font-medium"
              title="Sign out of this account"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Strict Role-Guarded Content Body */}
        <main className="main-content">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 py-3 px-8 text-xs text-slate-500 flex justify-between items-center bg-white">
          <span>FitQuality · Fitness Club Member Health Screening Integration &amp; Data Quality Management</span>
          <span className="font-mono text-[11px] text-slate-400">PostgreSQL Multi-Source Warehouse</span>
        </footer>
      </div>
    </div>
  );
}
