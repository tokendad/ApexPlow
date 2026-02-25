import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, id, className = '', ...rest }: InputProps) {
  return (
    <div className="form-group">
      {label && (
        <label className="form-label" htmlFor={id}>
          {label}
        </label>
      )}
      <input id={id} className={`input ${className}`} {...rest} />
      {error && (
        <span style={{ fontSize: 12, color: 'var(--color-status-error)' }}>{error}</span>
      )}
    </div>
  );
}
