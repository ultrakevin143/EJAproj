'use client';

import React from 'react';
import {
  UploadCloud,
  LayoutDashboard,
  AlertTriangle,
  Sparkles,
  UserCheck,
  ShieldAlert,
  Download,
  Network
} from 'lucide-react';

export type TabKey =
  | 'upload'
  | 'dashboard'
  | 'errors'
  | 'cleaning'
  | 'review'
  | 'governance'
  | 'export'
  | 'edm';

interface TabsProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  errorCount?: number;
  reviewCount?: number;
}

export default function Tabs({
  activeTab,
  onTabChange,
  errorCount = 0,
  reviewCount = 0
}: TabsProps) {
  const tabs = [
    { key: 'upload' as TabKey, label: '1. Ingestion', icon: UploadCloud },
    { key: 'dashboard' as TabKey, label: '2. Executive Dashboard', icon: LayoutDashboard },
    {
      key: 'errors' as TabKey,
      label: '3. DQM Error Log',
      icon: AlertTriangle,
      badge: errorCount > 0 ? errorCount : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
    },
    { key: 'cleaning' as TabKey, label: '4. Safe Cleaning', icon: Sparkles },
    {
      key: 'review' as TabKey,
      label: '5. Human Review',
      icon: UserCheck,
      badge: reviewCount > 0 ? reviewCount : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    },
    { key: 'governance' as TabKey, label: '6. Governance Rules', icon: ShieldAlert },
    { key: 'export' as TabKey, label: '7. Export Hub', icon: Download },
    { key: 'edm' as TabKey, label: '8. EDM Matrix', icon: Network }
  ];

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 overflow-x-auto py-2.5 no-scrollbar" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`flex items-center space-x-2 py-2 px-3.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[11px] font-bold border ${
                      isActive
                        ? 'bg-white/20 text-white border-white/30'
                        : tab.badgeColor || 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

