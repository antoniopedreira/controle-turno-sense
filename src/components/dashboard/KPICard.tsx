import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  status?: 'danger' | 'warning' | 'success' | 'neutral';
  subtitle?: string;
  delay?: number;
}

export function KPICard({ label, value, icon, status = 'neutral', subtitle, delay = 0 }: KPICardProps) {
  const getValueColor = () => {
    switch (status) {
      case 'danger':
        return 'text-danger';
      case 'warning':
        return 'text-warning';
      case 'success':
        return 'text-success';
      default:
        return 'text-foreground';
    }
  };

  const getGlowClass = () => {
    switch (status) {
      case 'danger':
        return 'glow-danger';
      case 'success':
        return 'glow-success';
      default:
        return '';
    }
  };

  return (
    <div 
      className={cn('kpi-card opacity-0 animate-fade-in', getGlowClass())}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="kpi-label">{label}</span>
        <div className="text-muted-foreground">{icon}</div>
      </div>
      
      <div className={cn('kpi-value', getValueColor())}>
        {value}
      </div>
      
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>
      )}
    </div>
  );
}
