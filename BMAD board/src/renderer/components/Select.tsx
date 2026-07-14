import { type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  placeholder?: string;
  sunken?: boolean;
}

export default function Select({
  options,
  placeholder,
  className = '',
  disabled,
  value,
  sunken,
  ...rest
}: SelectProps) {
  const bg = sunken ? 'bg-surface-sunken' : 'bg-surface-elevated';
  const base =
    `w-full px-3 py-2 ${bg} border border-border-default rounded-md text-body text-foreground-primary placeholder-foreground-tertiary transition-colors duration-80 ease-out disabled:opacity-50 disabled:pointer-events-none appearance-none pr-9`;

  const selectedValue = typeof value === 'string' ? value : undefined;
  const isKnownValue = selectedValue
    ? options.some((opt) => opt.value === selectedValue)
    : true;

  return (
    <div className="relative">
      <select
        className={`${base} ${className}`.trim()}
        disabled={disabled}
        value={value}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled={options.length > 0}>
            {placeholder}
          </option>
        )}
        {selectedValue && !isKnownValue && (
          <option value={selectedValue} disabled>
            {selectedValue}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground-tertiary"
      />
    </div>
  );
}
