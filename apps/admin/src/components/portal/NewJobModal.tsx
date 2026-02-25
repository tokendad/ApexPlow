import { useState, useEffect } from 'react';
import { Modal } from '../shared/Modal.js';
import { Button } from '../shared/Button.js';
import { apiFetch } from '../../api/client.js';

interface PricingTier {
  id: string;
  tierLabel: string;
  priceCents: number;
}

interface NewJobModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewJobModal({ open, onClose, onSuccess }: NewJobModalProps) {
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [jobAddress, setJobAddress] = useState('');
  const [tierId, setTierId] = useState('');
  const [jobType, setJobType] = useState<'asap' | 'scheduled'>('asap');
  const [scheduledFor, setScheduledFor] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    apiFetch<PricingTier[]>('/api/v1/admin/pricing')
      .then((data) => {
        setTiers(data);
        if (data.length > 0 && data[0]) setTierId(data[0].id);
      })
      .catch(() => setTiers([]));
  }, [open]);

  const handleSubmit = async () => {
    if (!customerName.trim()) { setError('Customer name is required'); return; }
    if (!jobAddress.trim()) { setError('Job address is required'); return; }
    if (!tierId) { setError('Select a driveway size'); return; }

    setSaving(true);
    setError(null);
    try {
      await apiFetch('/api/v1/admin/jobs', {
        method: 'POST',
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: phone.trim() || null,
          customerEmail: email.trim() || null,
          jobAddress: jobAddress.trim(),
          lat: 0,
          lng: 0,
          pricingTierId: tierId,
          jobType,
          scheduledFor: jobType === 'scheduled' && scheduledFor ? scheduledFor : null,
          specialInstructions: notes.trim() || null,
        }),
      });
      // reset form
      setCustomerName('');
      setPhone('');
      setEmail('');
      setJobAddress('');
      setTierId(tiers[0]?.id ?? '');
      setJobType('asap');
      setScheduledFor('');
      setNotes('');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Job">
      <div className="form-group">
        <label className="form-label" htmlFor="nj-name">
          Customer Name *
        </label>
        <input
          id="nj-name"
          className="input"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Jane Smith"
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="nj-phone">
          Phone
        </label>
        <input
          id="nj-phone"
          className="input"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 555-000-0000"
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="nj-email">
          Email
        </label>
        <input
          id="nj-email"
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@example.com"
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="nj-address">
          Job Address *
        </label>
        <input
          id="nj-address"
          className="input"
          value={jobAddress}
          onChange={(e) => setJobAddress(e.target.value)}
          placeholder="123 Main St, Anytown, MA"
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="nj-tier">
          Driveway Size *
        </label>
        <select
          id="nj-tier"
          className="input"
          value={tierId}
          onChange={(e) => setTierId(e.target.value)}
        >
          {tiers.length === 0 && <option value="">Loading...</option>}
          {tiers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.tierLabel} — ${(t.priceCents / 100).toFixed(0)}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <span className="form-label">Job Type *</span>
        <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
          {(['asap', 'scheduled'] as const).map((type) => (
            <label
              key={type}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}
            >
              <input
                type="radio"
                name="jobType"
                value={type}
                checked={jobType === type}
                onChange={() => setJobType(type)}
              />
              {type === 'asap' ? 'ASAP' : 'Scheduled'}
            </label>
          ))}
        </div>
      </div>

      {jobType === 'scheduled' && (
        <div className="form-group">
          <label className="form-label" htmlFor="nj-scheduled">
            Scheduled For
          </label>
          <input
            id="nj-scheduled"
            className="input"
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
          />
        </div>
      )}

      <div className="form-group">
        <label className="form-label" htmlFor="nj-notes">
          Notes
        </label>
        <textarea
          id="nj-notes"
          className="input"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Gate code, dogs, etc."
          style={{ resize: 'vertical' }}
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
        <Button variant="primary" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Creating...' : 'Create Job'}
        </Button>
      </div>
    </Modal>
  );
}
