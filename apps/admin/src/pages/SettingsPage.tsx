import { Link } from 'react-router-dom';
import { Sidebar } from '../components/portal/Sidebar.js';
import { useDashboard } from '../hooks/useDashboard.js';

interface SettingsCardProps {
  title: string;
  description: string;
  step: number;
}

function SettingsCard({ title, description, step }: SettingsCardProps) {
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px',
        marginBottom: 12,
      }}
    >
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{title}</h3>
        <p style={{ fontSize: 13, color: 'var(--color-slate-400)' }}>{description}</p>
      </div>
      <Link
        to={`/onboarding?step=${step}`}
        className="btn btn-ghost"
        style={{ color: 'var(--color-apex)', fontWeight: 600, fontSize: 14, flexShrink: 0 }}
      >
        Edit &rarr;
      </Link>
    </div>
  );
}

export function SettingsPage() {
  const { data } = useDashboard();
  const driverStatus = data?.driverStatus ?? 'offline';

  return (
    <div className="portal-layout">
      <Sidebar driverStatus={driverStatus} onNewJob={() => {}} />

      <main className="main-content">
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 24,
            fontWeight: 700,
            marginBottom: 24,
            color: 'var(--color-slate-900)',
          }}
        >
          Settings
        </h1>

        <SettingsCard
          title="Service Area"
          description="Home base address and service radius"
          step={1}
        />
        <SettingsCard
          title="Pricing Tiers"
          description="Per-driveway-size pricing configuration"
          step={2}
        />
        <SettingsCard
          title="Payment Links"
          description="PayPal and Venmo links shown to customers"
          step={3}
        />
      </main>
    </div>
  );
}
