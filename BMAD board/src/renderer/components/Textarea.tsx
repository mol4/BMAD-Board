import { type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  sunken?: boolean;
}

export default function Textarea({
  className = '',
  disabled,
  rows = 4,
  sunken,
  ...rest
}: TextareaProps) {
  const bg = sunken ? 'bg-surface-sunken' : 'bg-surface-elevated';
  const base =
    `w-full px-3 py-2 ${bg} border border-border-default rounded-md text-body text-foreground-primary placeholder-foreground-tertiary transition-colors duration-80 ease-out disabled:opacity-50 disabled:pointer-events-none resize-y min-h-[80px]`;

  return (
    <textarea
      className={`${base} ${className}`.trim()}
      disabled={disabled}
      rows={rows}
      {...rest}
    />
  );
}
