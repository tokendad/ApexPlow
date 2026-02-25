import { useState, useEffect } from 'react';
import { Button } from '../shared/Button.js';
import { Spinner } from '../shared/Spinner.js';
import { apiFetch } from '../../api/client.js';

interface PricingTier {
  id: string;
  tierLabel: string;
  priceCents: number;
}

interface StepPricingProps {
  onComplete: () => void;
}

const DEFAULT_TIERS: Omit<PricingTier, 'id'>[] = [
  { tierLabel: '1-Car Driveway', priceCents: 6500 },
  { tierLabel: '2-Car Driveway', priceCents: 8500 },
  { tierLabel: '3-Car Driveway', priceCents: 10500 },
  { tierLabel: '4-Car Driveway', priceCents: 12500 },
  { tierLabel: '5-Car Driveway', priceCents: 14500 },
  { tierLabel: '6-Car Driveway', priceCents: 16500 },
];

export function StepPricing({ onComplete }: StepPricingProps) {
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<PricingTier[]>('/api/v1/admin/pricing')
      .then((data) => {
        if (data.length > 0) {
          setTiers(data);
        } else {
          // Pre-populate with NE 2026 defaults
          setTiers(
            DEFAULT_TIERS.map((t, i) => ({ ...t, id: `new-${i}` })),
          );
        }
      })
      .catch(() => {
        setTiers(DEFAULT_TIERS.map((t, i) => ({ ...t, id: `new-${i}` })));
      })
      .finally(() => setLoading(false));
  }, []);

  const updateLabel = (idx: number, value: string) => {
    setTiers((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, tierLabel: value } : t)),
    );
  };

  const updatePrice = (idx: number, value: string) => {
    const dollars = parseFloat(value);
    setTiers((prev) =>
      prev.map((t, i) =>
        i === idx ? { ...t, priceCents: isNaN(dollars) ? 0 : Math.round(dollars * 100) } : t,
      ),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await apiFetch('/api/v1/admin/pricing', {
        method: 'PUT',
        body: JSON.stringify(
          tiers.map((t) => ({
            id: t.id.startsWith('new-') ? undefined : t.id,
            tierLabel: t.tierLabel,
            priceCents: t.priceCents,
          })),
        ),
      });
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save pricing');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        Pricing Tiers
      </h2>
      <p style={{ fontSize: 14, color: 'var(--color-slate-400)', marginBottom: 24 }}>
        Set your price per driveway size. Defaults are pre-filled with 2026 NE market rates.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr>
            <th
              style={{
                textAlign: 'left',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--color-slate-400)',
                paddingBottom: 8,
                paddingRight: 16,
              }}
            >
              Tier Label
            </th>
            <th
              style={{
                textAlign: 'left',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--color-slate-400)',
                paddingBottom: 8,
                width: 140,
              }}
            >
              Price ($)
            </th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((tier, idx) => (
            <tr key={tier.id} style={{ borderTop: '1px solid var(--color-slate-100)' }}>
              <td style={{ padding: '8px 16px 8px 0' }}>
                <input
                  className="input"
                  value={tier.tierLabel}
                  onChange={(e) => updateLabel(idx, e.target.value)}
                  aria-label={`Tier ${idx + 1} label`}
                />
              </td>
              <td style={{ padding: '8px 0' }}>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="1"
                  value={tier.priceCents / 100}
                  onChange={(e) => updatePrice(idx, e.target.value)}
                  aria-label={`Tier ${idx + 1} price`}
                  style={{ width: 130 }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {error && (
        <p style={{ fontSize: 13, color: 'var(--color-status-error)', marginBottom: 12 }}>
          {error}
        </p>
      )}

      <Button variant="primary" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save & Continue'}
      </Button>
    </div>
  );
}
