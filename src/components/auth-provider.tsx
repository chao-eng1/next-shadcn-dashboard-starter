'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { getApiUrl } from '@/lib/utils';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuth();
  const router = useRouter();
  const retryCountRef = useRef(0);
  const maxRetries = 2;

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch(getApiUrl('/api/auth/me'), {
          credentials: 'include', // Ensure cookies are sent
          headers: {
            'Cache-Control': 'no-cache'
          }
        });

        if (response.ok) {
          const text = await response.text();
          console.log('Raw API response:', text);
          try {
            const data = JSON.parse(text);
            console.log('Parsed API response:', data);
            setUser(data.user);
            retryCountRef.current = 0; // Reset retry count on success
          } catch (parseError) {
            console.error('Failed to parse JSON response:', parseError);
            console.error('Response text:', text);
            setUser(null);
          }
        } else if (response.status === 401) {
          // Handle unauthorized - might be token expired or invalid
          setUser(null);
          // Only redirect to sign-in if user is currently on a protected route
          if (window.location.pathname.startsWith('/dashboard')) {
            router.push('/auth/sign-in');
          }
        } else {
          // For other errors, try to retry if we haven't exceeded max retries
          if (retryCountRef.current < maxRetries) {
            retryCountRef.current++;
            // Wait a bit before retrying
            setTimeout(loadUser, 1000 * retryCountRef.current);
            return; // Don't set loading to false yet
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Failed to load user:', error);

        // Retry on network errors
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          setTimeout(loadUser, 1000 * retryCountRef.current);
          return; // Don't set loading to false yet
        } else {
          setUser(null);
        }
      } finally {
        // Only set loading to false if we're not retrying
        if (
          retryCountRef.current === 0 ||
          retryCountRef.current >= maxRetries
        ) {
          setLoading(false);
        }
      }
    }

    loadUser();
  }, []); // 移除依赖数组中的setUser和setLoading，因为它们是稳定的zustand函数

  return <>{children}</>;
}
