'use client';

import React from 'react';
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
  Lock
} from 'lucide-react';

export type UserRole = 'FRONTDESK' | 'CLINIC' | 'TURNSTILE' | 'STEWARD' | 'MANAGER' | 'ADMIN';

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
  activeSection: string;
  onSectionChange: (section: string) => void;
  children: React.ReactNode;
}

export default function WorkspaceShell({
  currentUser,
  onLogout,
  activeSection,
  onSectionChange,
  children
}: WorkspaceShellProps) {
  const isAdministrator = currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN';

  // Navigation configuration with role-based permissions
  const allNavItems = [
    {
      id: 'dashboard',
      label: 'Executive 360',
      icon: LayoutDashboard,
      subtitle: 'Target Warehouse Overview',
      allowedRoles: ['MANAGER', 'ADMIN']
    },
    {
      id: 'frontdesk',
      label: 'Member Intake CRM',
      icon: UserCheck,
      subtitle: 'Source 1: Member Registration',
      allowedRoles: ['FRONTDESK', 'MANAGER', 'ADMIN']
    },
    {
      id: 'clinic',
      label: 'Clinical PAR-Q',
      icon: Stethoscope,
      subtitle: 'Source 2: Health Screening',
      allowedRoles: ['CLINIC', 'MANAGER', 'ADMIN']
    },
    {
      id: 'turnstile',
      label: 'Turnstile IoT Gate',
      icon: Radio,
      subtitle: 'Source 3: Physical Access',
      allowedRoles: ['TURNSTILE', 'MANAGER', 'ADMIN']
    },
    {
      id: 'steward',
      label: 'ETL & Quality Management',
      icon: Layers,
      subtitle: 'Multi-Source ETL Pipeline',
      allowedRoles: ['STEWARD', 'MANAGER', 'ADMIN']
    },
    {
      id: 'governance',
      label: 'Data Governance',
      icon: ShieldCheck,
      subtitle: 'EDM Rules & Ownership',
      allowedRoles: ['STEWARD', 'MANAGER', 'ADMIN']
    }
  ];

  // Filter items visible to this account
  const visibleNavItems = allNavItems.filter((item) =>
    item.allowedRoles.includes(currentUser.role)
  );

  const currentItem = allNavItems.find((n) => n.id === activeSection) || visibleNavItems[0];

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

        {/* Workspace Account Monogram Block */}
        <div className="workspace-label">
          <strong>{currentUser.name}</strong>
          <span className="text-[12px] text-slate-500 font-mono truncate block">
            {currentUser.email}
          </span>
        </div>

        {/* Navigation Section */}
        <nav className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
            {isAdministrator ? 'System Navigation' : 'Assigned Station'}
          </span>

          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`nav-link text-left w-full flex items-center justify-between ${
                  isActive ? 'active' : ''
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Middle Note */}
        <div className="sidebar-footer">
          <strong>Role Authority</strong>
          <p className="text-xs text-slate-600 mt-1">
            {isAdministrator
              ? 'Administrator has full visibility across all 3 source systems and target warehouse.'
              : `Signed in as ${currentUser.role}. Restricted strictly to assigned operational station.`}
          </p>
        </div>

        {/* Database indicator */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-500">
          <Database className="h-3.5 w-3.5 text-slate-400" />
          <div>
            <span className="font-semibold text-slate-700">PostgreSQL Warehouse</span>
            <div className="text-[11px] text-slate-400">Fitness Health Data Integration</div>
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
            <strong>{currentItem ? currentItem.label : 'Dashboard'}</strong>
          </div>

          <div className="topbar-controls">
            {/* Authenticated Account Profile */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-800 hidden md:inline">{currentUser.name}</span>
              <span className="status-pill neutral font-mono font-bold">{currentUser.role}</span>
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
