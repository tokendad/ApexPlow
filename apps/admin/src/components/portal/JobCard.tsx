import { useState } from 'react';
import { StatusBadge } from '../shared/StatusBadge.js';
import { Button } from '../shared/Button.js';
import { apiFetch } from '../../api/client.js';
import type { DashboardJob } from '../../hooks/useDashboard.js';

interface JobCardProps {
  job: DashboardJob;
  onRefresh: () => void;
  onRecordPayment: (job: DashboardJob) => void;
  onOverridePrice: (job: DashboardJob) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

async function patchStatus(jobId: string, status: string): Promise<void> {
  await apiFetch(`/api/v1/admin/jobs/${jobId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function JobCard({ job, onRefresh, onRecordPayment, onOverridePrice }: JobCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const displayPrice = job.finalPriceCents ?? job.quotedPriceCents;

  const handleAction = async (nextStatus: string) => {
    setActionLoading(true);
    try {
      await patchStatus(job.id, nextStatus);
      onRefresh();
    } catch {
      // silently fail; refresh anyway
      onRefresh();
    } finally {
      setActionLoading(false);
    }
  };

  const renderActionButton = () => {
    switch (job.status) {
      case 'pending':
        return (
          <Button
            variant="secondary"
            onClick={(e) => { e.stopPropagation(); void handleAction('assigned'); }}
            disabled={actionLoading}
            style={{ fontSize: 13, padding: '6px 14px' }}
          >
            Assign →
          </Button>
        );
      case 'assigned':
        return (
          <Button
            variant="secondary"
            onClick={(e) => { e.stopPropagation(); void handleAction('en_route'); }}
            disabled={actionLoading}
            style={{ fontSize: 13, padding: '6px 14px' }}
          >
            En Route →
          </Button>
        );
      case 'arrived':
        return (
          <Button
            variant="secondary"
            onClick={(e) => { e.stopPropagation(); void handleAction('in_progress'); }}
            disabled={actionLoading}
            style={{ fontSize: 13, padding: '6px 14px' }}
          >
            Start Job →
          </Button>
        );
      case 'in_progress':
        return (
          <Button
            variant="primary"
            onClick={(e) => { e.stopPropagation(); onRecordPayment(job); }}
            style={{ fontSize: 13, padding: '6px 14px' }}
          >
            Record Payment
          </Button>
        );
      case 'completed':
        return (
          <span style={{ fontSize: 12, color: 'var(--color-status-idle)', fontWeight: 600 }}>
            {job.paymentAmountCents != null
              ? `Paid $${(job.paymentAmountCents / 100).toFixed(2)}`
              : 'No payment recorded'}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="card"
      style={{ marginBottom: 12, cursor: 'pointer' }}
      onClick={() => setExpanded((e) => !e)}
      role="article"
      aria-expanded={expanded}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <StatusBadge status={job.status} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{job.customerName}</div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--color-slate-400)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {job.jobAddress}
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-slate-700)', marginTop: 2 }}>
            {job.tierLabel ?? 'Unknown tier'} &middot; ${(displayPrice / 100).toFixed(2)}
          </div>
        </div>

        <div
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <span style={{ fontSize: 12, color: 'var(--color-slate-400)' }}>
            {timeAgo(job.createdAt)}
          </span>
          {renderActionButton()}
        </div>
      </div>

      {expanded && (
        <div
          style={{
            borderTop: '1px solid var(--color-slate-100)',
            marginTop: 12,
            paddingTop: 12,
            fontSize: 13,
            color: 'var(--color-slate-700)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <p><strong>Address:</strong> {job.jobAddress}</p>
          {job.specialInstructions && (
            <p style={{ marginTop: 4 }}><strong>Notes:</strong> {job.specialInstructions}</p>
          )}
          {job.scheduledFor && (
            <p style={{ marginTop: 4 }}>
              <strong>Scheduled:</strong>{' '}
              {new Date(job.scheduledFor).toLocaleString()}
            </p>
          )}
          {job.customerPhone && (
            <p style={{ marginTop: 4 }}><strong>Phone:</strong> {job.customerPhone}</p>
          )}
          {job.customerEmail && !job.customerEmail.endsWith('@placeholder.invalid') && (
            <p style={{ marginTop: 4 }}><strong>Email:</strong> {job.customerEmail}</p>
          )}
          <button
            style={{
              marginTop: 10,
              fontSize: 13,
              color: 'var(--color-apex)',
              textDecoration: 'underline',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
            onClick={() => onOverridePrice(job)}
          >
            Override Price
          </button>
        </div>
      )}
    </div>
  );
}
