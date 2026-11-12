'use client';

import React, { useState } from 'react';
import { Dumbbell, Database, ShieldCheck, Activity, Users } from 'lucide-react';
import TeamModal from './TeamModal';

interface NavbarProps {
  currentSessionId?: string | null;
  fileName?: string | null;
  status?: string | null;
}

export default function Navbar({ currentSessionId, fileName, status }: NavbarProps) {
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/30 text-emerald-400">
                <Dumbbell className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg tracking-tight text-white">FitQuality DQM</span>
                  <span className="bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-2 py-0.5 rounded border border-emerald-500/20">
                    Gym Screening
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Fitness Member Health Screening • Data Quality &amp; Governance Detective
                </p>
              </div>
            </div>

            {/* Right Status Indicators & Team Button */}
            <div className="flex items-center space-x-3 text-xs">
              <button
                onClick={() => setIsTeamModalOpen(true)}
                className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-md border border-slate-700 transition"
              >
                <Users className="h-3.5 w-3.5 text-emerald-400" />
                <span className="font-medium">Group 5 Team</span>
              </button>

              <div className="hidden sm:flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-md border border-slate-700/60 text-slate-300">
                <Database className="h-3.5 w-3.5 text-cyan-400" />
                <span>PostgreSQL / Neon Engine</span>
              </div>

              {fileName ? (
                <div className="flex items-center space-x-2 bg-emerald-950/60 px-3 py-1.5 rounded-md border border-emerald-800/60 text-emerald-300">
                  <Activity className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="truncate max-w-[130px] font-medium">{fileName}</span>
                  <span className="text-[10px] bg-emerald-800/60 px-1.5 py-0.2 rounded uppercase tracking-wider font-semibold">
                    {status || 'Active'}
                  </span>
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-2 bg-slate-800/40 px-3 py-1.5 rounded-md text-slate-400">
                  <span>No dataset loaded</span>
                </div>
              )}
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
