import { useState } from 'react';
import { Modal } from '../shared/Modal.js';
import { Button } from '../shared/Button.js';
import { apiFetch } from '../../api/client.js';
import type { DashboardJob } from '../../hooks/useDashboard.js';

type PaymentMethod = 'cash' | 'card' | 'paypal' | 'venmo' | 'other';

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'venmo', label: 'Venmo' },
  { value: 'other', label: 'Other' },
];

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  job: DashboardJob;
  onSuccess: () => void;
}

export function PaymentModal({ open, onClose, job, onSuccess }: PaymentModalProps) {
  const defaultCents = job.finalPriceCents ?? job.quotedPriceCents;
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [amount, setAmount] = useState(String(defaultCents / 100));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRecord = async () => {
    const cents = Math.round(parseFloat(amount) * 100);
    if (isNaN(cents) || cents <= 0) {
      setError('Enter a valid amount');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/api/v1/admin/jobs/${job.id}/payment`, {
        method: 'POST',
        body: JSON.stringify({ paymentMethod: method, amountCents: cents }),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Record Payment">
      <p style={{ fontSize: 14, color: 'var(--color-slate-700)', marginBottom: 4 }}>
        <strong>{job.customerName}</strong>
      </p>
      <p
        style={{
          fontSize: 13,
          color: 'var(--color-slate-400)',
          marginBottom: 20,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {job.jobAddress}
      </p>

      <div className="form-group">
        <span className="form-label">Payment Method</span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PAYMENT_METHODS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMethod(m.value)}
              className="btn"
              style={{
                background:
                  method === m.value ? 'var(--color-apex)' : 'var(--color-slate-100)',
                color: method === m.value ? '#fff' : 'var(--color-slate-900)',
                padding: '8px 16px',
                fontSize: 13,
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="payment-amount">
          Amount ($)
        </label>
        <input
          id="payment-amount"
          className="input"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      {error && (
        <p style={{ fontSize: 13, color: 'var(--color-status-error)', marginBottom: 12 }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleRecord} disabled={saving}>
          {saving ? 'Recording...' : 'Record Payment'}
        </Button>
      </div>
    </Modal>
  );
}
