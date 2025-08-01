'use client';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail
} from '@/components/ui/sidebar';
import { navItems } from '@/constants/data';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  IconBell,
  IconChevronRight,
  IconChevronsDown,
  IconCreditCard,
  IconLogout,
  IconPhotoUp,
  IconUserCircle
} from '@tabler/icons-react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PermissionGate } from '@/components/permission-gate';
import * as React from 'react';
import { Icons } from '../icons';
import { OrgSwitcher } from '../org-switcher';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getApiUrl } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useUnreadMessages } from '@/hooks/use-unread-messages';
import { NotificationBadge } from '@/components/ui/notification-badge';

export const company = {
  name: 'Acme Inc',
  logo: IconPhotoUp,
  plan: 'Enterprise'
};

const tenants = [
  { id: '1', name: 'Acme Inc' },
  { id: '2', name: 'Beta Corp' },
  { id: '3', name: 'Gamma Ltd' }
];

import { useAuth } from '@/hooks/use-auth';

interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
}

const UserAvatarProfile = ({
  className,
  showInfo
}: {
  className?: string;
  showInfo?: boolean;
}) => {
  const { user } = useAuth();

  // Use user data from auth context
  const displayName = user?.name || 'User';
  const email = user?.email || '';
  const avatarUrl = user?.image || '/placeholder-avatar.jpg';

  return (
    <div className='flex items-center gap-3'>
      <Avatar className={className}>
        <AvatarImage src={avatarUrl} alt={displayName} />
        <AvatarFallback>{displayName[0]}</AvatarFallback>
      </Avatar>
      {showInfo && (
        <div className='flex flex-col'>
          <span className='text-sm font-medium'>{displayName}</span>
          <span className='text-muted-foreground text-xs'>{email}</span>
        </div>
      )}
    </div>
  );
};

export default function AppSidebar() {
  const pathname = usePathname();
  const { isOpen } = useMediaQuery();
  const router = useRouter();
  const t = useTranslations();
  const { unreadCount } = useUnreadMessages();

  // Helper function to check if a path is active, ignoring the locale prefix
  const isPathActive = (itemUrl: string, currentPath: string): boolean => {
    // Remove locale prefix from current path (e.g., /en/dashboard -> /dashboard)
    const pathWithoutLocale = currentPath.replace(/^\/[a-z]{2}(?=\/|$)/, '');
    // Ensure both paths start with / and handle root path case
    const normalizedItemUrl = itemUrl.startsWith('/') ? itemUrl : `/${itemUrl}`;
    const normalizedPath = pathWithoutLocale.startsWith('/')
      ? pathWithoutLocale
      : `/${pathWithoutLocale}`;

    return normalizedPath === normalizedItemUrl;
  };

  // Helper function to check if a parent menu should be expanded (when any submenu is active)
  const shouldExpandMenu = (
    itemUrl: string,
    subItems: any[],
    currentPath: string
  ): boolean => {
    // Remove locale prefix from current path
    const pathWithoutLocale = currentPath.replace(/^\/[a-z]{2}(?=\/|$)/, '');
    const normalizedPath = pathWithoutLocale.startsWith('/')
      ? pathWithoutLocale
      : `/${pathWithoutLocale}`;

    // Check if any submenu item matches the current path
    return (
      subItems?.some((subItem) => {
        const normalizedSubUrl = subItem.url.startsWith('/')
          ? subItem.url
          : `/${subItem.url}`;
        return (
          normalizedPath === normalizedSubUrl ||
          normalizedPath.startsWith(normalizedSubUrl + '/')
        );
      }) || false
    );
  };

  const handleSignOut = async () => {
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
      console.error('Failed to sign out:', error);
      // 网络错误时也重定向到登录页
      window.location.href = '/auth/sign-in';
    }
  };

  const handleNotificationClick = () => {
    router.push('/dashboard/messages');
  };

  const handleSwitchTenant = (_tenantId: string) => {
    // Tenant switching functionality would be implemented here
  };

  const activeTenant = tenants[0];

  React.useEffect(() => {
    // Side effects based on sidebar state changes
  }, [isOpen]);

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        <OrgSwitcher
          tenants={tenants}
          defaultTenant={activeTenant}
          onTenantSwitch={handleSwitchTenant}
        />
      </SidebarHeader>
      <SidebarContent className='overflow-x-hidden'>
        <SidebarGroup>
          <SidebarGroupLabel>{t('sidebar.overview')}</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              const IconComponent = item.icon ? Icons[item.icon as keyof typeof Icons] : null;
              return item?.items && item?.items?.length > 0 ? (
                <PermissionGate
                  key={item.title}
                  permission={item.permission}
                  role={item.role}
                >
                  <Collapsible
                    asChild
                    defaultOpen={
                      item.isActive ||
                      shouldExpandMenu(item.url, item.items || [], pathname)
                    }
                    className='group/collapsible'
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={t(item.title)}
                          isActive={isPathActive(item.url, pathname)}
                        >
                          {IconComponent && <IconComponent />}
                          <span>{t(item.title)}</span>
                          <IconChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => {
                            const SubIconComponent = subItem.icon ? Icons[subItem.icon as keyof typeof Icons] : null;
                            return (
                            <PermissionGate
                              key={subItem.title}
                              permission={subItem.permission}
                              role={subItem.role}
                            >
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={isPathActive(subItem.url, pathname)}
                                >
                                  <Link href={subItem.url}>
                                    {SubIconComponent && <SubIconComponent />}
                                    <span>{t(subItem.title)}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            </PermissionGate>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                </PermissionGate>
              ) : (
                <PermissionGate
                  key={item.title}
                  permission={item.permission}
                  role={item.role}
                >
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip={t(item.title)}
                      isActive={isPathActive(item.url, pathname)}
                    >
                      <Link href={item.url} className="relative">
                        {IconComponent && <IconComponent />}
                        <span>{t(item.title)}</span>
                        {item.url === '/dashboard/messages' && unreadCount > 0 && (
                          <NotificationBadge 
                            count={unreadCount} 
                            className="absolute -top-1 -right-1" 
                            size="sm"
                          />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </PermissionGate>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size='lg'
                  className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                >
                  <UserAvatarProfile className='h-8 w-8 rounded-lg' showInfo />
                  <IconChevronsDown className='ml-auto size-4' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
                side='bottom'
                align='end'
                sideOffset={4}
              >
                <DropdownMenuLabel className='p-0 font-normal'>
                  <div className='px-1 py-1.5'>
                    <UserAvatarProfile
                      className='h-8 w-8 rounded-lg'
                      showInfo
                    />
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => router.push('/dashboard/profile')}
                  >
                    <IconUserCircle className='mr-2 h-4 w-4' />
                    {t('sidebar.profile')}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <IconCreditCard className='mr-2 h-4 w-4' />
                    {t('sidebar.billing')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleNotificationClick}>
                    <div className='flex items-center'>
                      <IconBell className='mr-2 h-4 w-4' />
                      {t('sidebar.notifications')}
                      {unreadCount > 0 && (
                        <NotificationBadge count={unreadCount} className='ml-auto' />
                      )}
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <IconLogout className='mr-2 h-4 w-4' />
                  {t('sidebar.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
