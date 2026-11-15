'use client';

import React, { useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { UserAccount } from './WorkspaceShell';
import { login } from '../lib/api';

interface LoginPageProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your account email and password.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const data = await login(email.trim(), password);
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

  return (
    <main className="login-page">
      <div className="login-frame">
        <section className="login-story" aria-label="FitQuality introduction">
          <div className="brand">
            <div className="brand-monogram">F</div>
            <div>
              <span className="brand-name">FitQuality<span>.</span></span>
              <small className="brand-caption">Member data office</small>
            </div>
          </div>

          <div className="login-story-copy">
            <span className="login-story-kicker">Fitness data, handled with care</span>
            <h1>Good records support safer decisions.</h1>
            <p>Member registration, clinical screening and access activity come together in one accountable workspace.</p>
          </div>

          <div className="login-story-foot">A role-based workspace for fitness operations</div>
        </section>

        <section className="login-panel" aria-labelledby="login-heading">
          <h2 id="login-heading">Welcome back</h2>
          <p className="login-panel-intro">Sign in with the account assigned to your role.</p>

          {error && <div className="login-alert" role="alert">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div>
              <label htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@fitquality.local"
              />
            </div>

            <div>
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>

            <button type="submit" disabled={submitting} className="login-submit">
              <span>{submitting ? 'Checking your account…' : 'Sign in to workspace'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="login-security">
            <ShieldCheck className="h-4 w-4" />
            <span>Role permissions are checked by the server. Your account only opens its assigned operations.</span>
          </div>
          <p className="login-private-note">Passwords are configured privately on the backend.</p>
        </section>
      </div>
    </main>
  );
}
