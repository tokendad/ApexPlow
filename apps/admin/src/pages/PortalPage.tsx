import { useState, useCallback } from 'react';
import { Sidebar } from '../components/portal/Sidebar.js';
import { TodaySummary } from '../components/portal/TodaySummary.js';
import { JobBoard } from '../components/portal/JobBoard.js';
import { WaitlistSection } from '../components/portal/WaitlistSection.js';
import { NewJobModal } from '../components/portal/NewJobModal.js';
import { PaymentModal } from '../components/portal/PaymentModal.js';
import { PriceOverrideModal } from '../components/portal/PriceOverrideModal.js';
import { Spinner } from '../components/shared/Spinner.js';
import { useDashboard } from '../hooks/useDashboard.js';
import type { DashboardJob } from '../hooks/useDashboard.js';

export function PortalPage() {
  const { data, loading, error, refresh } = useDashboard();
  const [newJobOpen, setNewJobOpen] = useState(false);
  const [paymentJob, setPaymentJob] = useState<DashboardJob | null>(null);
  const [priceJob, setPriceJob] = useState<DashboardJob | null>(null);

  const handleRefresh = useCallback(() => refresh(), [refresh]);

  if (loading && !data) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spinner size={36} />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 12,
          color: 'var(--color-slate-400)',
        }}
      >
        <p style={{ fontWeight: 600 }}>Could not connect to API</p>
        <p style={{ fontSize: 14 }}>{error}</p>
        <button
          className="btn btn-primary"
          style={{ marginTop: 8 }}
          onClick={handleRefresh}
        >
          Retry
        </button>
      </div>
    );
  }

  const driverStatus = data?.driverStatus ?? 'offline';
  const activeJobs = data?.activeJobs ?? [];
  const waitlistedJobs = data?.waitlistedJobs ?? [];
  const todaySummary = data?.todaySummary ?? { count: 0, totalCents: 0 };

  return (
    <div className="portal-layout">
      <Sidebar driverStatus={driverStatus} onNewJob={() => setNewJobOpen(true)} />

      <main className="main-content">
        <TodaySummary count={todaySummary.count} totalCents={todaySummary.totalCents} />

        <JobBoard
          jobs={activeJobs}
          onRefresh={handleRefresh}
          onRecordPayment={(job) => setPaymentJob(job)}
          onOverridePrice={(job) => setPriceJob(job)}
        />

        <WaitlistSection jobs={waitlistedJobs} onRefresh={handleRefresh} />
      </main>

      <NewJobModal
        open={newJobOpen}
        onClose={() => setNewJobOpen(false)}
        onSuccess={handleRefresh}
      />

      {paymentJob && (
        <PaymentModal
          open={paymentJob !== null}
          onClose={() => setPaymentJob(null)}
          job={paymentJob}
          onSuccess={handleRefresh}
        />
      )}

      {priceJob && (
        <PriceOverrideModal
          open={priceJob !== null}
          onClose={() => setPriceJob(null)}
          jobId={priceJob.id}
          currentPriceCents={priceJob.finalPriceCents ?? priceJob.quotedPriceCents}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
}
