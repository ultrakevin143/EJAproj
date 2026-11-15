'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  PlusCircle,
  ToggleLeft,
  ToggleRight,
  RefreshCw
} from 'lucide-react';
import { fetchGovernanceRules, fetchDataCatalog, createGovernanceRule, toggleGovernanceRule, fetchAuditEvents } from '../lib/api';
import { GovernanceRule } from '../types/dqm';

interface CatalogField {
  field: string;
  owner: string;
  source: string;
  classification: string;
  access: string;
  policy: string;
  handling: string;
}

export default function GovernanceView() {
  const [rules, setRules] = useState<GovernanceRule[]>([]);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [catalogFields, setCatalogFields] = useState<CatalogField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleDesc, setNewRuleDesc] = useState('');
  const [newRulePrinciple, setNewRulePrinciple] = useState('Accuracy');
  const [saving, setSaving] = useState(false);

  const loadRules = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const [rulesResult, eventsResult, catalogResult] = await Promise.all([
        fetchGovernanceRules(),
        fetchAuditEvents(),
        fetchDataCatalog()
      ]);
      if (rulesResult.success) setRules(rulesResult.rules || []);
      if (eventsResult.success) setAuditEvents(eventsResult.events || []);
      if (catalogResult.success) setCatalogFields(catalogResult.fields || []);
    } catch (e) {
      console.error(e);
      setLoadError('Governance information could not be loaded. Refresh to try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleToggle = async (rule: GovernanceRule) => {
    if (rule.enforcement_level === 'Mandatory') return;
    setActionError('');
    try {
      const res = await toggleGovernanceRule(rule.id);
      if (res.success) {
        setRules((prev) =>
          prev.map((r) => (r.id === rule.id
            ? { ...r, is_active: res.rule?.is_active ?? !r.is_active }
            : r))
        );
      } else setActionError(res.error || 'The policy state could not be changed.');
    } catch (e) {
      console.error(e);
      setActionError('The policy state could not be changed. Try again.');
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    setSaving(true);
    setActionError('');
    try {
      const res = await createGovernanceRule({
        rule_name: newRuleName,
        rule_description: newRuleDesc,
        dqm_principle: newRulePrinciple,
        enforcement_level: 'Advisory'
      });
      if (res.success) {
        setRules((prev) => [res.rule, ...prev]);
        setNewRuleName('');
        setNewRuleDesc('');
        setShowAddForm(false);
      } else setActionError(res.error || 'The policy could not be saved.');
    } catch (e) {
      console.error(e);
      setActionError('The policy could not be saved. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="governance-heading">
        <div>
          <span className="governance-kicker">Ownership · access · accountability</span>
          <h1>Governance register</h1>
          <p>
            Review field ownership and access, then record optional guidance. Required checks run in the backend; custom policy descriptions are advisory.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary"
          aria-expanded={showAddForm}
        >
          <PlusCircle className="h-4 w-4" />
          <span>{showAddForm ? 'Close form' : 'Add advisory policy'}</span>
        </button>
      </header>

      {loadError && <div className="login-alert" role="alert">{loadError}</div>}
      {actionError && <div className="login-alert" role="alert">{actionError}</div>}

      <section className="data-table-container">
        <div className="table-toolbar">
          <div>
            <h2>Data catalog</h2>
            <p>Field ownership, source, classification, and access enforced by protected API routes.</p>
          </div>
        </div>
        <div className="table-scroll">
          <table className="enterprise-table">
            <thead>
              <tr><th>Data fields</th><th>Owner</th><th>Source</th><th>Classification</th><th>Role access</th><th>Policy</th><th>Handling</th></tr>
            </thead>
            <tbody>
              {catalogFields.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center text-slate-500">{isLoading ? 'Loading catalog…' : 'No catalog fields are available.'}</td></tr>
              )}
              {catalogFields.map((item) => (
                <tr key={item.field}>
                  <td className="font-semibold">{item.field}</td>
                  <td className="text-xs">{item.owner}</td>
                  <td className="text-xs">{item.source}</td>
                  <td><span className="status-pill neutral">{item.classification}</span></td>
                  <td className="text-xs">{item.access}</td>
                  <td className="text-xs">{item.policy}</td>
                  <td className="text-xs">{item.handling}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add New Rule Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateRule}
          className="form-card space-y-4 text-xs"
        >
          <div>
            <span className="governance-kicker">Human review guidance</span>
            <h2 className="font-bold text-slate-800 text-sm">Add an advisory policy</h2>
            <p className="mt-1 text-xs text-slate-600">This register records guidance for staff. It does not create a new automatic backend validation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Policy / Rule Name</label>
              <input
                type="text"
                required
                value={newRuleName}
                onChange={(e) => setNewRuleName(e.target.value)}
                placeholder="e.g. Confirm emergency contact details"
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
                Guidance for staff
              </label>
              <textarea
                rows={2}
                value={newRuleDesc}
                onChange={(e) => setNewRuleDesc(e.target.value)}
                placeholder="Describe the review step staff should follow."
                className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
            </div>

            <div className="governance-level-note">
              <ShieldAlert className="h-4 w-4" />
              <span><strong>Advisory only.</strong> Backend rules cannot be created or changed from this form.</span>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
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
            className={`policy-card ${rule.is_active ? '' : 'policy-card-inactive'}`}
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
                      className={`status-pill ${
                        rule.enforcement_level === 'Mandatory'
                          ? 'warning'
                          : 'neutral'
                      }`}
                    >
                      {rule.enforcement_level}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle(rule)}
                  disabled={rule.enforcement_level === 'Mandatory'}
                  className="policy-toggle"
                  aria-pressed={rule.is_active}
                  aria-label={`${rule.is_active ? 'Deactivate' : 'Activate'} ${rule.rule_name}`}
                  title={rule.enforcement_level === 'Mandatory' ? 'Required backend check' : rule.is_active ? 'Deactivate policy' : 'Activate policy'}
                >
                  {rule.is_active ? (
                    <ToggleRight className="h-6 w-6 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-slate-400" />
                  )}
                </button>
              </div>

              <p>
                {rule.rule_description}
              </p>
            </div>

            <div className="policy-card-footer">
              <span>{rule.enforcement_level === 'Mandatory' ? 'Required backend check' : rule.is_active ? 'Active advisory' : 'Inactive advisory'}</span>
              <span>Saved in workspace</span>
            </div>
          </div>
        ))}
      </div>

      {rules.length === 0 && !isLoading && (
        <div className="form-card text-sm text-slate-600">No governance policies are registered yet.</div>
      )}

      <section className="data-table-container">
        <div className="table-toolbar">
          <div>
            <h2>Recent governance activity</h2>
            <p>Account actions written to the backend audit log.</p>
          </div>
          <button onClick={loadRules} className="btn btn-secondary text-xs" disabled={isLoading}>
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
        <div className="table-scroll">
          <table className="enterprise-table">
            <thead><tr><th>When</th><th>Account</th><th>Action</th><th>Record</th><th>Details</th></tr></thead>
            <tbody>
              {auditEvents.length === 0 ? (
                <tr><td colSpan={5} className="py-6 text-center text-slate-500">{isLoading ? 'Loading activity…' : 'No recorded activity yet.'}</td></tr>
              ) : auditEvents.map((event) => (
                <tr key={event.id}>
                  <td className="text-xs">{new Date(event.created_at).toLocaleString()}</td>
                  <td className="text-xs">{event.actor_id}<br /><span className="text-slate-500">{event.actor_role}</span></td>
                  <td className="font-mono text-xs">{event.action}</td>
                  <td className="text-xs">{event.entity_type}<br /><span className="font-mono text-slate-500">{event.entity_id || '—'}</span></td>
                  <td className="text-xs">{event.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

