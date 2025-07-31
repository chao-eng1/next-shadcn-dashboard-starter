const config = {
  locales: ['zh', 'en'],
  defaultLocale: 'zh',
  localePrefix: 'always',
  pathnames: {
    '/': '/',
    '/auth/sign-in': '/auth/sign-in',
    '/auth/sign-up': '/auth/sign-up',
    '/dashboard': '/dashboard',
    '/dashboard/overview': '/dashboard/overview',
    '/dashboard/products': '/dashboard/products',
    '/dashboard/kanban': '/dashboard/kanban',
    '/dashboard/tasks': '/dashboard/tasks',
    '/dashboard/messages': '/dashboard/messages',
    '/dashboard/profile': '/dashboard/profile',
    '/dashboard/documents': '/dashboard/documents',
    '/dashboard/projects': '/dashboard/projects',
    '/system-management': '/system-management',
    '/system-management/users': '/system-management/users',
    '/system-management/roles': '/system-management/roles',
    '/system-management/permissions': '/system-management/permissions',
    '/system-management/menus': '/system-management/menus',
    '/system-management/messages': '/system-management/messages'
  }
};

module.exports = config;
