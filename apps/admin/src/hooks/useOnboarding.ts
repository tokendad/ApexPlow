import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api/client.js';

interface OnboardingStatus {
  serviceAreaComplete: boolean;
  pricingComplete: boolean;
  paymentLinksComplete: boolean;
  isComplete: boolean;
}

interface OnboardingState {
  status: OnboardingStatus | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const DEFAULT_STATUS: OnboardingStatus = {
  serviceAreaComplete: false,
  pricingComplete: false,
  paymentLinksComplete: false,
  isComplete: false,
};

export function useOnboarding(): OnboardingState {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiFetch<OnboardingStatus>('/api/v1/admin/onboarding/status')
      .then((data) => {
        if (!cancelled) setStatus(data);
      })
      .catch(() => {
        if (!cancelled) {
          // API not available yet — use defaults so onboarding can proceed
          setStatus(DEFAULT_STATUS);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tick]);

  return { status, loading, error, refresh };
}
