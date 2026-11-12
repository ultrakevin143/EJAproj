'use client';

import React, { useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { UserAccount } from './WorkspaceShell';

interface LoginPageProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('FitQuality!2026');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const demoAccounts = [
    { email: 'admin@fitquality.local', label: 'Engr. Ricardo Mendoza (Administrator / GM)', role: 'ADMIN' },
    { email: 'steward@fitquality.local', label: 'Danilo Fernandez (Lead Data Steward)', role: 'STEWARD' },
    { email: 'frontdesk@fitquality.local', label: 'Marites Dela Cruz (Front-Desk Officer)', role: 'FRONTDESK' },
    { email: 'clinic@fitquality.local', label: 'Dr. Maria Elena Reyes, MD (Clinical Assessor)', role: 'CLINIC' },
    { email: 'turnstile@fitquality.local', label: 'Turnstile Gate 01 (BGC Gym Floor)', role: 'TURNSTILE' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please select or enter your role account email.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await res.json();
      if (data.success && data.user) {
        onLoginSuccess(data.user);
      } else {
        setError(data.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      setError('Network error connecting to backend authentication service.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectDemoAccount = (accEmail: string) => {
    setEmail(accEmail);
    setPassword('FitQuality!2026');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-sm p-8">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded bg-blue-50 border border-blue-200 text-blue-700 font-bold flex items-center justify-center text-sm">
            F
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            fitquality<span className="text-blue-600">.</span>
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
          Your health screening data,<br />with clinical accountability.
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          Sign in to access the records, screenings, and integration pipelines assigned to your role account.
        </p>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded text-xs font-medium mb-4">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="text-xs font-semibold text-slate-700">Account Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. frontdesk@fitquality.local"
              className="w-full text-sm"
            />
          </div>

          <div className="form-group">
            <label className="text-xs font-semibold text-slate-700">Account Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn btn-primary flex items-center justify-center gap-2 py-2.5"
          >
            <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Security Note */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex items-start gap-2.5 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <span>
            Permissions are checked by the server. Each role account can only access its designated operations.
          </span>
        </div>

        {/* Classroom Demo Accounts */}
        <details className="mt-6 pt-3 border-t border-slate-200 text-xs text-slate-600" open>
          <summary className="font-semibold text-blue-700 cursor-pointer mb-2">
            Classroom Demo Accounts (1-Click Fill)
          </summary>
          <p className="text-[11px] text-slate-500 mb-3">
            Select an account below to sign in directly:
          </p>
          <div className="space-y-1.5">
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => selectDemoAccount(acc.email)}
                className={`w-full text-left p-2 rounded border transition text-xs flex items-center justify-between ${
                  email === acc.email
                    ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="font-medium">{acc.label}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{acc.email}</div>
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                  {acc.role}
                </span>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Front-Desk intakes; Clinicians screen; Turnstiles verify; Stewards integrate; Managers monitor.
          </p>
        </details>
      </div>
    </div>
  );
}
