import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api/client.js';

export interface DashboardJob {
  id: string;
  status: string;
  jobType: 'asap' | 'scheduled';
  source: 'admin' | 'customer';
  jobAddress: string;
  quotedPriceCents: number;
  finalPriceCents: number | null;
  paymentAmountCents: number | null;
  scheduledFor: string | null;
  createdAt: string;
  updatedAt: string;
  tierLabel: string | null;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  specialInstructions: string | null;
}

export interface DashboardData {
  activeJobs: DashboardJob[];
  waitlistedJobs: DashboardJob[];
  driverStatus: string;
  todaySummary: { count: number; totalCents: number };
}

interface DashboardState {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useDashboard(): DashboardState {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    const fetchData = () => {
      apiFetch<DashboardData>('/api/v1/admin/dashboard')
        .then((d) => {
          if (!cancelled) {
            setData(d);
            setError(null);
            setLoading(false);
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : 'Failed to load dashboard');
            setLoading(false);
          }
        });
    };

    fetchData();
    const intervalId = setInterval(fetchData, 15000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [tick]);

  return { data, loading, error, refresh };
}
