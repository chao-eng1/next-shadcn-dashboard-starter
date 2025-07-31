import { createNavigation } from 'next-intl/navigation';

export const locales = ['zh', 'en'] as const;
export const localePrefix = 'always';

export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales,
  localePrefix
});

export const pathnames = {
  '/': '/',
  '/auth/sign-in': {
    en: '/auth/sign-in',
    zh: '/auth/sign-in'
  },
  '/auth/sign-up': {
    en: '/auth/sign-up',
    zh: '/auth/sign-up'
  },
  '/dashboard': {
    en: '/dashboard',
    zh: '/dashboard'
  },
  '/dashboard/overview': {
    en: '/dashboard/overview',
    zh: '/dashboard/overview'
  },
  '/dashboard/products': {
    en: '/dashboard/products',
    zh: '/dashboard/products'
  },
  '/dashboard/kanban': {
    en: '/dashboard/kanban',
    zh: '/dashboard/kanban'
  },
  '/dashboard/tasks': {
    en: '/dashboard/tasks',
    zh: '/dashboard/tasks'
  },
  '/dashboard/messages': {
    en: '/dashboard/messages',
    zh: '/dashboard/messages'
  },
  '/dashboard/profile': {
    en: '/dashboard/profile',
    zh: '/dashboard/profile'
  },
  '/dashboard/documents': {
    en: '/dashboard/documents',
    zh: '/dashboard/documents'
  },
  '/dashboard/projects': {
    en: '/dashboard/projects',
    zh: '/dashboard/projects'
  },
  '/system-management': {
    en: '/system-management',
    zh: '/system-management'
  },
  '/system-management/users': {
    en: '/system-management/users',
    zh: '/system-management/users'
  },
  '/system-management/roles': {
    en: '/system-management/roles',
    zh: '/system-management/roles'
  },
  '/system-management/permissions': {
    en: '/system-management/permissions',
    zh: '/system-management/permissions'
  },
  '/system-management/menus': {
    en: '/system-management/menus',
    zh: '/system-management/menus'
  },
  '/system-management/messages': {
    en: '/system-management/messages',
    zh: '/system-management/messages'
  }
};

export type Pathnames = keyof typeof pathnames;
