'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  PlusCircle,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  AlertOctagon,
  RefreshCw
} from 'lucide-react';
import { fetchGovernanceRules, createGovernanceRule, toggleGovernanceRule } from '../lib/api';
import { GovernanceRule } from '../types/dqm';

export default function GovernanceView() {
  const [rules, setRules] = useState<GovernanceRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleDesc, setNewRuleDesc] = useState('');
  const [newRulePrinciple, setNewRulePrinciple] = useState('Accuracy');
  const [newRuleEnforcement, setNewRuleEnforcement] = useState('Mandatory');
  const [saving, setSaving] = useState(false);

  const loadRules = async () => {
    setIsLoading(true);
    try {
      const res = await fetchGovernanceRules();
      if (res.success) {
        setRules(res.rules || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleToggle = async (rule: GovernanceRule) => {
    try {
      const res = await toggleGovernanceRule(rule.id);
      if (res.success) {
        setRules((prev) =>
          prev.map((r) => (r.id === rule.id ? { ...r, is_active: !r.is_active } : r))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    setSaving(true);
    try {
      const res = await createGovernanceRule({
        rule_name: newRuleName,
        rule_description: newRuleDesc,
        dqm_principle: newRulePrinciple,
        enforcement_level: newRuleEnforcement
      });
      if (res.success) {
        setRules((prev) => [res.rule, ...prev]);
        setNewRuleName('');
        setNewRuleDesc('');
        setShowAddForm(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-indigo-500/20 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded border border-indigo-500/30">
            Tab 6 • Data Governance & Policies
          </span>
          <h1 className="text-2xl font-bold mt-2">Data Quality Prevention Policies</h1>
          <p className="text-slate-300 text-xs mt-1 max-w-xl">
            Active organizational policies enforced during gym member registration, ingestion validation,
            and automated sanitization pipelines.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-4 py-2.5 rounded-xl shadow transition duration-150 text-xs shrink-0"
        >
          <PlusCircle className="h-4 w-4" />
          <span>{showAddForm ? 'Close Form' : 'Define New Policy'}</span>
        </button>
      </div>

      {/* Add New Rule Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateRule}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 text-xs"
        >
          <h3 className="font-bold text-slate-800 text-sm">Add New Governance Prevention Policy</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Policy / Rule Name</label>
              <input
                type="text"
                required
                value={newRuleName}
                onChange={(e) => setNewRuleName(e.target.value)}
                placeholder="e.g. Phone Number Mandatory Standard"
                className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">DQM Principle</label>
              <select
                value={newRulePrinciple}
                onChange={(e) => setNewRulePrinciple(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 bg-white"
              >
                <option value="Accuracy">Accuracy</option>
                <option value="Consistency">Consistency</option>
                <option value="Completeness">Completeness</option>
                <option value="Timeliness">Timeliness</option>
                <option value="Reliability">Reliability</option>
                <option value="Relevance">Relevance</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">
                Detailed Policy Description & Operational Enforcement
              </label>
              <textarea
                rows={2}
                value={newRuleDesc}
                onChange={(e) => setNewRuleDesc(e.target.value)}
                placeholder="Explain the prevention mechanism and schema checks..."
                className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Enforcement Level</label>
              <select
                value={newRuleEnforcement}
                onChange={(e) => setNewRuleEnforcement(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 bg-white"
              >
                <option value="Mandatory">Mandatory (Hard Block / Auto-Standardize)</option>
                <option value="Advisory">Advisory (Human Review Alert)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Policy'}
            </button>
          </div>
        </form>
      )}

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`border rounded-xl p-5 shadow-sm transition bg-white flex flex-col justify-between space-y-3 ${
              rule.is_active ? 'border-slate-200' : 'border-slate-200/60 opacity-60 bg-slate-50/50'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{rule.rule_name}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
                      {rule.dqm_principle}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        rule.enforcement_level === 'Mandatory'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {rule.enforcement_level}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggle(rule)}
                  className="text-slate-500 hover:text-slate-800 transition"
                  title={rule.is_active ? 'Deactivate policy' : 'Activate policy'}
                >
                  {rule.is_active ? (
                    <ToggleRight className="h-6 w-6 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-slate-400" />
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                {rule.rule_description}
              </p>
            </div>

            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span>Policy Status: {rule.is_active ? 'Active Enforced' : 'Inactive'}</span>
              <span>PostgreSQL Persisted</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

