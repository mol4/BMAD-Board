import { type ReactNode, type HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
}

export default function Card({ children, className = '', hoverable = true, ...rest }: CardProps) {
  const base = 'bg-surface-elevated border border-border-default rounded-lg shadow-card transition-all duration-150 ease-out';
  const hover = hoverable ? 'hover:shadow-card-hover hover:-translate-y-px' : '';
  return <div className={`${base} ${hover} ${className}`.trim()} {...rest}>{children}</div>;
}
