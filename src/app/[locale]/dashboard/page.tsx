import { redirect } from 'next/navigation';

export default async function Dashboard() {
  // Redirect to the overview page
  redirect('/dashboard/overview');
}
