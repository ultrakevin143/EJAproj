'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  UserCheck,
  Stethoscope,
  Radio,
  Layers,
  ShieldCheck,
  ChevronRight,
  LogOut,
  Database,
  Lock,
  Building2,
  Users
} from 'lucide-react';
import TeamModal from './TeamModal';

export type UserRole = 'FRONTDESK' | 'CLINIC' | 'TURNSTILE' | 'STEWARD' | 'MANAGER';

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  title: string;
}

export const DEMO_ACCOUNTS: Record<UserRole, UserAccount> = {
  FRONTDESK: {
    id: 'usr_frontdesk',
    email: 'frontdesk@fitquality.local',
    name: 'Front-Desk Receptionist',
    role: 'FRONTDESK',
    title: 'Intake CRM & Badge Verification'
  },
  CLINIC: {
    id: 'usr_clinic',
    email: 'clinic@fitquality.local',
    name: 'Dr. Sarah Miller, PT',
    role: 'CLINIC',
    title: 'Lead Clinical Health Assessor'
  },
  TURNSTILE: {
    id: 'usr_turnstile',
    email: 'turnstile@fitquality.local',
    name: 'Facility Gate #01',
    role: 'TURNSTILE',
    title: 'IoT Turnstile RFID Terminal'
  },
  STEWARD: {
    id: 'usr_steward',
    email: 'steward@fitquality.local',
    name: 'Elena Rostova',
    role: 'STEWARD',
    title: 'Lead Data Steward & ETL Manager'
  },
  MANAGER: {
    id: 'usr_manager',
    email: 'manager@fitquality.local',
    name: 'Marcus Vance, GM',
    role: 'MANAGER',
    title: 'General Manager Executive 360'
  }
};

interface WorkspaceShellProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
  children: React.ReactNode;
}

export default function WorkspaceShell({
  currentRole,
  onRoleChange,
  activeSection,
  onSectionChange,
  children
}: WorkspaceShellProps) {
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const currentUser = DEMO_ACCOUNTS[currentRole] || DEMO_ACCOUNTS.STEWARD;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Executive 360',
      icon: LayoutDashboard,
      allowedRoles: ['MANAGER', 'STEWARD', 'FRONTDESK']
    },
    {
      id: 'frontdesk',
      label: 'Member Intake CRM',
      icon: UserCheck,
      allowedRoles: ['FRONTDESK', 'MANAGER', 'STEWARD']
    },
    {
      id: 'clinic',
      label: 'Clinical PAR-Q',
      icon: Stethoscope,
      allowedRoles: ['CLINIC', 'MANAGER', 'STEWARD']
    },
    {
      id: 'turnstile',
      label: 'Turnstile IoT Gate',
      icon: Radio,
      allowedRoles: ['TURNSTILE', 'MANAGER', 'STEWARD']
    },
    {
      id: 'steward',
      label: 'ETL Pipeline & DQM',
      icon: Layers,
      allowedRoles: ['STEWARD', 'MANAGER']
    },
    {
      id: 'governance',
      label: 'Data Governance',
      icon: ShieldCheck,
      allowedRoles: ['STEWARD', 'MANAGER']
    }
  ];

  const getSectionTitle = (id: string) => {
    const found = navItems.find((n) => n.id === id);
    return found ? found.label : 'Workspace';
  };

  const isAccessAllowed = (sectionId: string) => {
    const item = navItems.find((n) => n.id === sectionId);
    if (!item) return true;
    return item.allowedRoles.includes(currentRole);
  };

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
          <strong>FitQuality Athletic Club</strong>
          <span>Multi-Source Health EDM</span>
        </div>

        {/* Primary Navigation Links */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            const allowed = item.allowedRoles.includes(currentRole);

            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`nav-link text-left w-full flex items-center justify-between ${
                  isActive ? 'active' : ''
                } ${!allowed ? 'opacity-40 cursor-not-allowed' : ''}`}
                title={!allowed ? 'Restricted: Not authorized for your role' : ''}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {!allowed && <Lock className="h-3 w-3 text-slate-400" />}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Middle Note */}
        <div className="sidebar-footer">
          <strong>Integration with Accountability</strong>
          <p>
            Reception intakes members, Clinicians screen PAR-Q health, and Turnstiles query the integrated warehouse for immediate safety.
          </p>

          <button
            onClick={() => setIsTeamModalOpen(true)}
            className="mt-3 text-xs text-blue-700 hover:underline flex items-center gap-1.5 font-semibold"
          >
            <Users className="h-3.5 w-3.5" />
            <span>Group 5 Defense Team</span>
          </button>
        </div>

        {/* Sidebar Bottom Indicator */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-500">
          <Database className="h-3.5 w-3.5 text-slate-400" />
          <div>
            <span className="font-semibold text-slate-700">PostgreSQL Warehouse</span>
            <div className="text-[11px] text-slate-400">pg-mem / Neon Cloud Ready</div>
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
            <strong>{getSectionTitle(activeSection)}</strong>
          </div>

          <div className="topbar-controls">
            {/* Quick Demo Role Switcher Dropdown */}
            <div className="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 text-xs">
              <span className="text-slate-500 font-medium hidden sm:inline">Role Account:</span>
              <select
                value={currentRole}
                onChange={(e) => {
                  const newRole = e.target.value as UserRole;
                  onRoleChange(newRole);
                  // Auto-switch to their home view
                  if (newRole === 'FRONTDESK') onSectionChange('frontdesk');
                  else if (newRole === 'CLINIC') onSectionChange('clinic');
                  else if (newRole === 'TURNSTILE') onSectionChange('turnstile');
                  else if (newRole === 'STEWARD') onSectionChange('steward');
                  else if (newRole === 'MANAGER') onSectionChange('dashboard');
                }}
                className="bg-white border border-slate-300 text-slate-800 text-xs font-semibold py-1 px-2 rounded focus:outline-none"
              >
                <option value="FRONTDESK">Front-Desk (Receptionist)</option>
                <option value="CLINIC">Clinic (Health Assessor)</option>
                <option value="TURNSTILE">Turnstile Gate (IoT Terminal)</option>
                <option value="STEWARD">Data Steward (ETL &amp; DQM)</option>
                <option value="MANAGER">General Manager (Executive 360)</option>
              </select>
            </div>

            {/* Current User Pill */}
            <div className="flex items-center gap-2 text-xs pl-2 border-l border-slate-200">
              <span className="font-semibold text-slate-800 hidden md:inline">{currentUser.name}</span>
              <span className="status-pill neutral">{currentUser.role.toLowerCase()}</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="main-content">
          {!isAccessAllowed(activeSection) ? (
            <div className="bg-white border border-red-200 rounded-lg p-8 text-center max-w-xl mx-auto my-12">
              <div className="inline-flex p-3 rounded-full bg-red-50 text-red-700 mb-3">
                <Lock className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">Access Restricted by Data Governance</h2>
              <p className="text-sm text-slate-600 mb-4">
                Your active role account (<strong>{currentUser.role}</strong>) does not have permission to view this section.
                Under GDPR/HIPAA compliance, operational roles only access data strictly necessary for their function.
              </p>
              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded border border-slate-200 text-left">
                <strong>Enforced Security Policy:</strong>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  <li>Front-Desk cannot view confidential clinical notes or ECG heart rates.</li>
                  <li>Clinicians cannot modify membership billing or grant turnstile overrides.</li>
                  <li>Turnstile terminal is an automated machine-to-machine check-in agent.</li>
                </ul>
              </div>
            </div>
          ) : (
            children
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 py-3 px-8 text-xs text-slate-500 flex justify-between items-center bg-white">
          <span>FitQuality · Multi-Source Health Screening Integration · Group 5</span>
          <span className="font-mono text-[11px] text-slate-400">Next.js 14 • Express • PostgreSQL</span>
        </footer>
      </div>

      {/* Team Modal */}
      <TeamModal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} />
    </div>
  );
}
