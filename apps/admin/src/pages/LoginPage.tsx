import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { apiFetch } from '../api/client.js';

interface OnboardingStatus {
  isComplete: boolean;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);

      // Check onboarding status to decide where to navigate
      let onboardingComplete = false;
      try {
        const status = await apiFetch<OnboardingStatus>('/api/v1/admin/onboarding-status');
        onboardingComplete = status.isComplete;
      } catch {
        // API might not be running yet; go to onboarding
      }

      navigate(onboardingComplete ? '/portal' : '/onboarding', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-slate-100)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        className="card"
        style={{ width: '100%', maxWidth: 400, boxShadow: 'var(--shadow-modal)', padding: 40 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 28, color: 'var(--color-apex)', marginBottom: 8 }}>&#10052;</div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 32,
              fontWeight: 700,
              color: 'var(--color-slate-900)',
              lineHeight: 1.1,
            }}
          >
            PlowDispatch
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-slate-400)', marginTop: 6 }}>
            Admin Portal
          </p>
        </div>

        <form onSubmit={(e) => { void handleSubmit(e); }} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p
              style={{
                fontSize: 13,
                color: 'var(--color-status-error)',
                marginBottom: 16,
                textAlign: 'center',
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full"
            style={{ height: 48, fontSize: 15 }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
