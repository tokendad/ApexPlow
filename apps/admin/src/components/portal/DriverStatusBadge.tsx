interface DriverStatusBadgeProps {
  status: string;
}

function dotColor(status: string): string {
  if (status === 'available') return 'var(--color-status-active)';
  if (status === 'offline') return 'var(--color-status-idle)';
  return 'var(--color-apex)'; // busy, en_route, on_job
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    available: 'Available',
    offline: 'Offline',
    busy: 'Busy',
    en_route: 'En Route',
    on_job: 'On Job',
  };
  return labels[status] ?? status;
}

export function DriverStatusBadge({ status }: DriverStatusBadgeProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 0',
        fontSize: 14,
        color: 'var(--color-slate-100)',
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: dotColor(status),
          flexShrink: 0,
        }}
        aria-hidden="true"
      />
      <span>Driver: {statusLabel(status)}</span>
    </div>
  );
}
