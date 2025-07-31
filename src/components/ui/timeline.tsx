import * as React from 'react';
import { cn } from '@/lib/utils';

// Timeline container
const Timeline = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('space-y-4', className)} {...props} />
));
Timeline.displayName = 'Timeline';

// Timeline item
const TimelineItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('relative pl-6', className)} {...props} />
));
TimelineItem.displayName = 'TimelineItem';

// Timeline connector (vertical line)
const TimelineConnector = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'bg-border absolute top-[1.75rem] left-2 h-[calc(100%-1.75rem)] w-px',
      className
    )}
    {...props}
  />
));
TimelineConnector.displayName = 'TimelineConnector';

// Timeline header
const TimelineHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-start', className)} {...props} />
));
TimelineHeader.displayName = 'TimelineHeader';

// Timeline icon
const TimelineIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'border-border bg-background absolute left-0 flex h-4 w-4 items-center justify-center rounded-full border',
      className
    )}
    {...props}
  />
));
TimelineIcon.displayName = 'TimelineIcon';

// Timeline body
const TimelineBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('ml-2', className)} {...props} />
));
TimelineBody.displayName = 'TimelineBody';

export {
  Timeline,
  TimelineItem,
  TimelineConnector,
  TimelineHeader,
  TimelineIcon,
  TimelineBody
};
