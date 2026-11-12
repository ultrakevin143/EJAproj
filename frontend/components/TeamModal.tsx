'use client';

import React from 'react';
import { Users, X, Award, CheckCircle2, Dumbbell } from 'lucide-react';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TeamModal({ isOpen, onClose }: TeamModalProps) {
  if (!isOpen) return null;

  const members = [
    { name: 'Kevin Mercado', role: 'Full Stack Integration & Architecture' },
    { name: 'Christian Glenn Pacaldo', role: 'DQM Engine & Classifier Design' },
    { name: 'Mae Ann Amparado', role: 'Data Governance & Validation Policies' },
    { name: 'Dheyan Pino', role: 'Database Modeling & PostgreSQL Pipelines' },
    { name: 'Benedict Mequiabas', role: 'Frontend UI/UX & Data Visualizations' },
    { name: 'Clarence Maglinao', role: 'Safe Cleaning & Transformation Engine' },
    { name: 'John Lloyd Racal', role: 'Audit Analytics & Testing Verification' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/30">
              <Dumbbell className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-bold text-base">Group 5 — Project Team</h2>
              <p className="text-xs text-emerald-200">
                FitQuality DQM • Fitness Member Health Screening System
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          <div className="flex items-center space-x-2 text-slate-700 font-bold border-b border-slate-100 pb-2">
            <Users className="h-4 w-4 text-emerald-600" />
            <span>Project Collaborators & Authors (Group 5)</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {members.map((m, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px]">
                    {i + 1}
                  </span>
                  <span className="font-semibold text-slate-900">{m.name}</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium bg-white px-2 py-0.5 rounded border border-slate-200">
                  {m.role}
                </span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-emerald-900">
            <div className="flex items-center space-x-1.5 font-bold text-[11px]">
              <Award className="h-3.5 w-3.5 text-emerald-600" />
              <span>Coursework & Requirements Full Compliance</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Enterprise Data Management (EDM) Integration • Data Quality Management (DQM) • Data
              Governance • Next.js 14 • Express.js • PostgreSQL &amp; Neon Cloud
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

