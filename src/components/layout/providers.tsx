'use client';
import React from 'react';
import { ActiveThemeProvider } from '../active-theme';
import { AuthProvider } from '../auth-provider';
import { RBACProvider } from '@/features/system-management/rbac-context';
import { RealtimeProvider } from '../realtime/realtime-provider';

export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  return (
    <ActiveThemeProvider initialTheme={activeThemeValue}>
      <AuthProvider>
        <RBACProvider>
          <RealtimeProvider>
            {children}
          </RealtimeProvider>
        </RBACProvider>
      </AuthProvider>
    </ActiveThemeProvider>
  );
}
