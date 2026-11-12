'use client';

import React, { useState } from 'react';
import {
  Dumbbell,
  Database,
  Users,
  Shield,
  Stethoscope,
  Radio,
  BarChart3,
  UserCheck
} from 'lucide-react';
import TeamModal from './TeamModal';

export type UserRole = 'frontdesk' | 'clinic' | 'turnstile' | 'steward' | 'manager';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  currentSessionId?: string | null;
  fileName?: string | null;
  status?: string | null;
}

export default function Navbar({
  currentRole,
  onRoleChange,
  currentSessionId,
  fileName,
  status
}: NavbarProps) {
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  const roles = [
    { key: 'frontdesk' as UserRole, label: 'Front-Desk', icon: Users, desc: 'Intake CRM' },
    { key: 'clinic' as UserRole, label: 'Clinic Assessor', icon: Stethoscope, desc: 'PAR-Q Assessments' },
    { key: 'turnstile' as UserRole, label: 'Turnstile IoT', icon: Radio, desc: 'Live RFID Scanner' },
    { key: 'steward' as UserRole, label: 'Data Steward', icon: Shield, desc: 'ETL & Governance' },
    { key: 'manager' as UserRole, label: 'General Manager', icon: BarChart3, desc: 'Executive BI 360' }
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo & Title */}
            <div className="flex items-center space-x-3 shrink-0">
              <div className="bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/30 text-emerald-400">
                <Dumbbell className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-base tracking-tight text-white">FitQuality DQM</span>
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-500/20">
                    Multi-Source ETL
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Enterprise Data Management &amp; Role-Based Governance System
                </p>
              </div>
            </div>

            {/* Middle: Active Role Switcher Segmented Control */}
            <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 overflow-x-auto text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 hidden lg:inline">
                Active Account:
              </span>
              <div className="flex space-x-1">
                {roles.map((r) => {
                  const Icon = r.icon;
                  const isActive = currentRole === r.key;
                  return (
                    <button
                      key={r.key}
                      onClick={() => onRoleChange(r.key)}
                      className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                      title={r.desc}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Team Modal & DB Engine Tag */}
            <div className="flex items-center space-x-2 text-xs shrink-0">
              <button
                onClick={() => setIsTeamModalOpen(true)}
                className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition"
              >
                <Users className="h-3.5 w-3.5 text-emerald-400" />
                <span className="font-medium hidden sm:inline">Group 5 Team</span>
              </button>

              <div className="hidden xl:flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60 text-slate-300">
                <Database className="h-3.5 w-3.5 text-cyan-400" />
                <span>PostgreSQL / Neon</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Group 5 Team Modal */}
      <TeamModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
      />
    </>
  );
}
