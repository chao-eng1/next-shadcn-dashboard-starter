'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useTranslations } from 'next-intl';

export function UserNav() {
  const router = useRouter();
  const { user } = useAuth();
  const t = useTranslations();

  // Log user info for debugging
  console.log('UserNav component - Current user:', user);

  const handleLogout = async () => {
    try {
      const response = await fetch(getApiUrl('/api/auth/logout'), {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        // 确保cookie被清除后再重定向
        window.location.href = '/auth/sign-in';
      } else {
        console.error('Logout failed:', response.statusText);
        // 即使API失败，也尝试重定向到登录页
        window.location.href = '/auth/sign-in';
      }
    } catch (error) {
      console.error('Failed to logout:', error);
      // 网络错误时也重定向到登录页
      window.location.href = '/auth/sign-in';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
          <Avatar>
            <AvatarImage src={user?.image || ''} alt={user?.name || 'User'} />
            <AvatarFallback>{user?.name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className='w-56'
        align='end'
        sideOffset={10}
        forceMount
      >
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm leading-none font-medium'>
              {user?.name || 'User'}
            </p>
            <p className='text-muted-foreground text-xs leading-none'>
              {user?.email || ''}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          {t('userNav.logOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
