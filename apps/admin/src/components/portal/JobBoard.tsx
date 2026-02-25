import { useEffect, useRef } from 'react';
import { JobCard } from './JobCard.js';
import type { DashboardJob } from '../../hooks/useDashboard.js';

interface JobBoardProps {
  jobs: DashboardJob[];
  onRefresh: () => void;
  onRecordPayment: (job: DashboardJob) => void;
  onOverridePrice: (job: DashboardJob) => void;
}

export function JobBoard({ jobs, onRefresh, onRecordPayment, onOverridePrice }: JobBoardProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(onRefresh, 15000);
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [onRefresh]);

  return (
    <section>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 18,
          fontWeight: 700,
          marginBottom: 16,
          color: 'var(--color-slate-900)',
        }}
      >
        Active Jobs
        <span
          style={{
            marginLeft: 8,
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--color-slate-400)',
            fontFamily: 'var(--font-ui)',
          }}
        >
          ({jobs.length})
        </span>
      </h2>

      {jobs.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            color: 'var(--color-slate-400)',
            fontSize: 15,
          }}
        >
          No active jobs
        </div>
      ) : (
        jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onRefresh={onRefresh}
            onRecordPayment={onRecordPayment}
            onOverridePrice={onOverridePrice}
          />
        ))
      )}
    </section>
  );
}
