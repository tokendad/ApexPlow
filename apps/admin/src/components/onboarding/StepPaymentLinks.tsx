import { useState, useEffect } from 'react';
import { Button } from '../shared/Button.js';
import { apiFetch } from '../../api/client.js';

interface PaymentLinks {
  paypalLink: string | null;
  venmoLink: string | null;
}

interface StepPaymentLinksProps {
  onComplete: () => void;
}

export function StepPaymentLinks({ onComplete }: StepPaymentLinksProps) {
  const [paypal, setPaypal] = useState('');
  const [venmo, setVenmo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<PaymentLinks>('/api/v1/admin/payment-links')
      .then((data) => {
        setPaypal(data.paypalLink ?? '');
        setVenmo(data.venmoLink ?? '');
      })
      .catch(() => {/* not yet configured */});
  }, []);

  const handleFinish = async () => {
    setSaving(true);
    setError(null);
    try {
      await apiFetch('/api/v1/admin/payment-links', {
        method: 'PUT',
        body: JSON.stringify({
          paypalLink: paypal.trim() || null,
          venmoLink: venmo.trim() || null,
        }),
      });
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save payment links');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          fontWeight: 700,
          marginBottom: 12,
        }}
      >
        Payment Collection
      </h2>

      <div
        style={{
          background: 'var(--color-apex-light)',
          border: '1px solid var(--color-apex)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          fontSize: 14,
          color: 'var(--color-slate-700)',
          marginBottom: 24,
        }}
      >
        These links are shown to customers on the job completion screen. They pay you directly.
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="paypal-link">
          PayPal.me link
        </label>
        <input
          id="paypal-link"
          className="input"
          type="url"
          value={paypal}
          onChange={(e) => setPaypal(e.target.value)}
          placeholder="https://paypal.me/yourusername"
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="venmo-link">
          Venmo username / link
        </label>
        <input
          id="venmo-link"
          className="input"
          type="url"
          value={venmo}
          onChange={(e) => setVenmo(e.target.value)}
          placeholder="https://venmo.com/yourusername"
        />
      </div>

      {error && (
        <p style={{ fontSize: 13, color: 'var(--color-status-error)', marginBottom: 12 }}>
          {error}
        </p>
      )}

      <Button variant="primary" onClick={handleFinish} disabled={saving}>
        {saving ? 'Saving...' : 'Finish Setup'}
      </Button>
    </div>
  );
}
