import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/Card';

interface StatCardProps {
  icon: ReactNode;
  iconBg: string;
  label: string;
  value: number;
  subtitle?: string;
  navigateTo: string;
}

export default function StatCard({ icon, iconBg, label, value, subtitle, navigateTo }: StatCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      role="button"
      aria-label={label}
      className="p-4 cursor-pointer"
      onClick={() => navigate(navigateTo)}
    >
      <div className={`flex items-center justify-center w-12 h-12 rounded-full ${iconBg} mb-3`}>
        {icon}
      </div>
      <div className="text-caption text-foreground-tertiary uppercase mb-1">{label}</div>
      <div className="text-[24px] font-bold text-foreground-primary">{value}</div>
      {subtitle && (
        <div className="text-caption text-foreground-tertiary mt-0.5">{subtitle}</div>
      )}
    </Card>
  );
}
