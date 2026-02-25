import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StepServiceArea } from '../components/onboarding/StepServiceArea.js';
import { StepPricing } from '../components/onboarding/StepPricing.js';
import { StepPaymentLinks } from '../components/onboarding/StepPaymentLinks.js';

const TOTAL_STEPS = 3;

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <p
        style={{
          fontSize: 13,
          color: 'var(--color-slate-400)',
          marginBottom: 10,
          fontWeight: 500,
        }}
      >
        Step {current} of {total}
      </p>
      <div
        style={{
          height: 4,
          background: 'var(--color-slate-100)',
          borderRadius: 99,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${(current / total) * 100}%`,
            background: 'var(--color-apex)',
            borderRadius: 99,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialStep = (() => {
    const param = searchParams.get('step');
    const parsed = param ? parseInt(param, 10) : 1;
    if (parsed >= 1 && parsed <= TOTAL_STEPS) return parsed;
    return 1;
  })();

  const [step, setStep] = useState(initialStep);

  // If navigating from settings with a ?step param, honour it on mount
  useEffect(() => {
    const param = searchParams.get('step');
    if (param) {
      const parsed = parseInt(param, 10);
      if (parsed >= 1 && parsed <= TOTAL_STEPS) setStep(parsed);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const advance = () => {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      navigate('/portal', { replace: true });
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-slate-100)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '48px 24px',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 640,
          boxShadow: 'var(--shadow-modal)',
          padding: 40,
        }}
      >
        <div style={{ marginBottom: 8 }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--color-apex)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>&#10052;</span> PlowDispatch Setup
          </span>
        </div>

        <ProgressBar current={step} total={TOTAL_STEPS} />

        {step === 1 && <StepServiceArea onComplete={advance} />}
        {step === 2 && <StepPricing onComplete={advance} />}
        {step === 3 && <StepPaymentLinks onComplete={advance} />}
      </div>
    </div>
  );
}
