'use client';

import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  heading: string;
  text?: string;
  children?: React.ReactNode;
  className?: string;
}

export function DashboardHeader({
  heading,
  text,
  children,
  className
}: DashboardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className='grid gap-1'>
        <h1 className='text-2xl font-semibold'>{heading}</h1>
        {text && <p className='text-muted-foreground'>{text}</p>}
      </div>
      {children}
    </div>
  );
}
