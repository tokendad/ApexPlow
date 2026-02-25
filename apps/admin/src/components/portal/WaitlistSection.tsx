import { useState } from 'react';
import { Button } from '../shared/Button.js';
import { apiFetch } from '../../api/client.js';
import type { DashboardJob } from '../../hooks/useDashboard.js';

interface WaitlistSectionProps {
  jobs: DashboardJob[];
  onRefresh: () => void;
}

export function WaitlistSection({ jobs, onRefresh }: WaitlistSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const promote = async (id: string) => {
    setBusyId(id);
    try {
      await apiFetch(`/api/v1/admin/waitlist/${id}/promote`, { method: 'POST' });
    } finally {
      setBusyId(null);
      onRefresh();
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      await apiFetch(`/api/v1/admin/waitlist/${id}`, { method: 'DELETE' });
    } finally {
      setBusyId(null);
      onRefresh();
    }
  };

  return (
    <section style={{ marginTop: 32 }}>
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: 'var(--font-display)',
          fontSize: 18,
          fontWeight: 700,
          color: 'var(--color-slate-900)',
          marginBottom: expanded ? 16 : 0,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
        aria-expanded={expanded}
      >
        <span>Waitlist ({jobs.length})</span>
        <span style={{ fontSize: 14, color: 'var(--color-slate-400)' }}>
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {expanded &&
        (jobs.length === 0 ? (
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '32px 24px',
              color: 'var(--color-slate-400)',
              fontSize: 14,
            }}
          >
            Waitlist is empty
          </div>
        ) : (
          jobs.map((job) => (
            <div
              key={job.id}
              className="card"
              style={{
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{job.jobAddress}</div>
                <div style={{ fontSize: 13, color: 'var(--color-slate-400)' }}>
                  {job.tierLabel ?? 'Unknown tier'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <Button
                  variant="primary"
                  disabled={busyId === job.id}
                  onClick={() => void promote(job.id)}
                  style={{ fontSize: 13, padding: '6px 12px' }}
                >
                  Promote to Queue
                </Button>
                <Button
                  variant="ghost"
                  disabled={busyId === job.id}
                  onClick={() => void remove(job.id)}
                  style={{ fontSize: 13, padding: '6px 12px', color: 'var(--color-status-error)' }}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))
        ))}
    </section>
  );
}
