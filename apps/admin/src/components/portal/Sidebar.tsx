import { NavLink } from 'react-router-dom';
import { DriverStatusBadge } from './DriverStatusBadge.js';
import { Button } from '../shared/Button.js';

interface SidebarProps {
  driverStatus: string;
  onNewJob: () => void;
}

export function Sidebar({ driverStatus, onNewJob }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ color: 'var(--color-apex)', fontSize: 22 }}>&#10052;</span>
          PlowDispatch
        </div>
        <DriverStatusBadge status={driverStatus} />
      </div>

      <Button variant="primary" fullWidth onClick={onNewJob} style={{ marginBottom: 8 }}>
        + New Job
      </Button>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
        <NavLink
          to="/portal"
          style={({ isActive }) => ({
            padding: '9px 12px',
            borderRadius: 'var(--radius-md)',
            fontSize: 14,
            fontWeight: 500,
            color: isActive ? 'var(--color-apex)' : 'var(--color-slate-100)',
            background: isActive ? 'rgba(245,124,32,0.15)' : 'transparent',
            transition: 'background 0.15s',
          })}
        >
          Job Board
        </NavLink>
        <NavLink
          to="/settings"
          style={({ isActive }) => ({
            padding: '9px 12px',
            borderRadius: 'var(--radius-md)',
            fontSize: 14,
            fontWeight: 500,
            color: isActive ? 'var(--color-apex)' : 'var(--color-slate-100)',
            background: isActive ? 'rgba(245,124,32,0.15)' : 'transparent',
            transition: 'background 0.15s',
          })}
        >
          Settings
        </NavLink>
      </nav>
    </aside>
  );
}
