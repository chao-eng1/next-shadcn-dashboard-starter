import KBar from '@/components/kbar';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { GlobalIMProvider } from '@/components/im/global-im-provider';
import { GlobalUnreadProvider } from '@/components/layout/global-unread-provider';
import { GlobalUnreadToast } from '@/components/layout/global-unread-toast';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Next Shadcn Dashboard Starter',
  description: 'Basic dashboard with Next.js and Shadcn'
};

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Persisting the sidebar state in the cookie.
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';
  return (
    <KBar>
      <SidebarProvider defaultOpen={defaultOpen}>
        <GlobalIMProvider>
          <GlobalUnreadProvider>
            <AppSidebar />
            <SidebarInset>
              <Header />
              {/* page main content */}
              {children}
              {/* page main content ends */}
            </SidebarInset>
            <GlobalUnreadToast />
          </GlobalUnreadProvider>
        </GlobalIMProvider>
      </SidebarProvider>
    </KBar>
  );
}
