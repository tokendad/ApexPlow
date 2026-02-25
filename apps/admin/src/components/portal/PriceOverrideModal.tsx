import { useState } from 'react';
import { Modal } from '../shared/Modal.js';
import { Button } from '../shared/Button.js';
import { apiFetch } from '../../api/client.js';

interface PriceOverrideModalProps {
  open: boolean;
  onClose: () => void;
  jobId: string;
  currentPriceCents: number;
  onSuccess: () => void;
}

export function PriceOverrideModal({
  open,
  onClose,
  jobId,
  currentPriceCents,
  onSuccess,
}: PriceOverrideModalProps) {
  const [newPrice, setNewPrice] = useState(String(currentPriceCents / 100));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const cents = Math.round(parseFloat(newPrice) * 100);
    if (isNaN(cents) || cents <= 0) {
      setError('Enter a valid price');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/api/v1/admin/jobs/${jobId}/price`, {
        method: 'PATCH',
        body: JSON.stringify({ priceCents: cents }),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update price');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Override Price">
      <p style={{ fontSize: 14, color: 'var(--color-slate-700)', marginBottom: 16 }}>
        Current price: ${(currentPriceCents / 100).toFixed(2)}
      </p>
      <div className="form-group">
        <label className="form-label" htmlFor="override-price">
          New Price ($)
        </label>
        <input
          id="override-price"
          className="input"
          type="number"
          min="0"
          step="0.01"
          value={newPrice}
          onChange={(e) => setNewPrice(e.target.value)}
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
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </Modal>
  );
}
