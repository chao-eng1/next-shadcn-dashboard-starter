import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | Overview',
  description: 'Dashboard overview page showing key metrics and statistics'
};

export default function OverviewPage() {
  // This is a required page file for the layout with parallel routes
  // The actual content is rendered through the parallel routes and layout.tsx
  return null;
}
