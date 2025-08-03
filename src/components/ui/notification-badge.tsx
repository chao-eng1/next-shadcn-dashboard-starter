'use client';

import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count: number;
  className?: string;
  maxCount?: number;
  showZero?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function NotificationBadge({
  count,
  className,
  maxCount = 99,
  showZero = false,
  size = 'md'
}: NotificationBadgeProps) {
  if (count === 0 && !showZero) {
    return null;
  }

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  const sizeClasses = {
    sm: 'h-4 w-4 text-xs min-w-4',
    md: 'h-5 w-5 text-xs min-w-5',
    lg: 'h-6 w-6 text-sm min-w-6'
  };

  return (
    <span
      className={cn(
        'absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-red-500 font-medium text-white',
        sizeClasses[size],
        className
      )}
    >
      {displayCount}
    </span>
  );
}

// 简化版本，只显示红点
export function NotificationDot({
  show,
  className,
  size = 'md'
}: {
  show: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  if (!show) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };

  return (
    <span
      className={cn(
        'absolute -top-1 -right-1 rounded-full bg-red-500',
        sizeClasses[size],
        className
      )}
    />
  );
}
