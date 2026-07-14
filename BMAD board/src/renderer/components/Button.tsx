import { type ReactNode, type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

export default function Button({
  variant = 'primary',
  iconLeft,
  iconRight,
  children,
  className = '',
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-80 ease-out disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';

  const variants = {
    primary: 'bg-accent text-foreground-on-accent hover:bg-accent-hover',
    secondary: 'bg-surface-sunken text-foreground-primary border border-border-default hover:bg-border-default',
  };

  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${className}`.trim()}
      disabled={disabled}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
