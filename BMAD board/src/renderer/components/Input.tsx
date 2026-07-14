import { type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  sunken?: boolean;
}

export default function Input({
  className = '',
  type = 'text',
  disabled,
  sunken,
  ...rest
}: InputProps) {
  const bg = sunken ? 'bg-surface-sunken' : 'bg-surface-elevated';
  const base =
    `w-full px-3 py-2 ${bg} border border-border-default rounded-md text-body text-foreground-primary placeholder-foreground-tertiary transition-colors duration-80 ease-out disabled:opacity-50 disabled:pointer-events-none`;

  return (
    <input
      type={type}
      className={`${base} ${className}`.trim()}
      disabled={disabled}
      {...rest}
    />
  );
}
