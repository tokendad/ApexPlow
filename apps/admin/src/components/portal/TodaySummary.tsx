interface TodaySummaryProps {
  count: number;
  totalCents: number;
}

export function TodaySummary({ count, totalCents }: TodaySummaryProps) {
  const dollars = (totalCents / 100).toFixed(2);

  return (
    <div
      className="card"
      style={{
        marginBottom: 24,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 14,
        color: 'var(--color-slate-700)',
      }}
    >
      <span style={{ fontWeight: 600, color: 'var(--color-slate-900)' }}>Today:</span>
      <span>
        {count} job{count !== 1 ? 's' : ''} completed &middot; ${dollars} collected
      </span>
    </div>
  );
}
