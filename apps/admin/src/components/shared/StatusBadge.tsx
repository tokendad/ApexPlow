interface StatusBadgeProps {
  status: string;
}

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: 'var(--color-status-warn)', color: '#1A2233', label: 'Pending' },
  assigned: { bg: 'var(--color-apex)', color: '#fff', label: 'Assigned' },
  en_route: { bg: '#3B82F6', color: '#fff', label: 'En Route' },
  arrived: { bg: '#3B82F6', color: '#fff', label: 'Arrived' },
  in_progress: { bg: 'var(--color-status-active)', color: '#fff', label: 'In Progress' },
  completed: { bg: 'var(--color-status-idle)', color: '#fff', label: 'Completed' },
  cancelled: { bg: 'var(--color-status-error)', color: '#fff', label: 'Cancelled' },
  rejected: { bg: 'var(--color-status-error)', color: '#fff', label: 'Rejected' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    bg: 'var(--color-slate-400)',
    color: '#fff',
    label: status,
  };

  return (
    <span
      className="status-badge"
      style={{ background: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  );
}
