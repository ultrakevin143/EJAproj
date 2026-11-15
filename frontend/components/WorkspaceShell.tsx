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
  Database
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
  const isAdmin = currentUser.role === 'ADMIN';

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
      allowedRoles: ['FRONTDESK', 'ADMIN']
    },
    {
      id: 'clinic',
      label: 'Clinical PAR-Q',
      icon: Stethoscope,
      subtitle: 'Source 2: Health Screening',
      allowedRoles: ['CLINIC', 'ADMIN']
    },
    {
      id: 'turnstile',
      label: 'Turnstile IoT Gate',
      icon: Radio,
      subtitle: 'Source 3: Physical Access',
      allowedRoles: ['TURNSTILE', 'ADMIN']
    },
    {
      id: 'steward',
      label: 'ETL & Quality Management',
      icon: Layers,
      subtitle: 'Multi-Source ETL Pipeline',
      allowedRoles: ['STEWARD', 'ADMIN']
    },
    {
      id: 'governance',
      label: 'Data Governance',
      icon: ShieldCheck,
      subtitle: 'EDM Rules & Ownership',
      allowedRoles: ['STEWARD', 'ADMIN']
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
            <span className="brand-name">FitQuality<span>.</span></span>
            <small className="brand-caption">Member data office</small>
          </div>
        </div>

        {/* Workspace Account Monogram Block */}
        <div className="workspace-label">
          <strong>{currentUser.name}</strong>
          <span>{currentUser.email}</span>
        </div>

        {/* Navigation Section */}
        <nav aria-label="Role workspaces">
          <span className="nav-section-label">
            {isAdmin ? 'System Navigation' : 'Assigned Station'}
          </span>

          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`nav-link ${
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
            {isAdmin
              ? 'Administrator access includes all protected role workspaces.'
              : currentUser.role === 'MANAGER'
                ? 'Manager access is limited to the operations summary and approved clearance checks.'
                : `Signed in as ${currentUser.role}. Restricted to the assigned operational station.`}
          </p>
        </div>

        {/* Database indicator */}
        <div className="sidebar-database">
          <Database className="h-3.5 w-3.5" />
          <div>
            <strong>PostgreSQL warehouse</strong>
            <div>Fitness health data integration</div>
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
              className="topbar-signout"
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
        <footer className="workspace-footer">
          <span>FitQuality · Fitness Club Member Health Screening Integration &amp; Data Quality Management</span>
          <span>PostgreSQL · multi-source warehouse</span>
        </footer>
      </div>
    </div>
  );
}
