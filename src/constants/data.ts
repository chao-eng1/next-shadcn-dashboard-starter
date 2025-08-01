import { NavItem } from '@/types';

export type Product = {
  photo_url: string;
  name: string;
  description: string;
  created_at: string;
  price: number;
  id: number;
  category: string;
  updated_at: string;
};

//Info: The following data is used for the sidebar navigation and Cmd K bar.
export const navItems: NavItem[] = [
  {
    title: 'navigation.dashboard',
    url: '/dashboard',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: [] // Empty array as there are no child items for Dashboard
  },
  {
    title: 'navigation.im',
    url: '/dashboard/im',
    icon: 'messageCircle',
    shortcut: ['i', 'm'],
    isActive: false,
    items: []
  },

  {
    title: 'navigation.requirementManagement',
    url: '/dashboard/requirements',
    icon: 'clipboard',
    shortcut: ['r', 'q'],
    isActive: false,
    permission: 'requirement.view',
    items: [
      {
        title: 'navigation.requirementList',
        url: '/dashboard/requirements',
        icon: 'list',
        shortcut: ['r', 'l'],
        permission: 'requirement.view'
      },
      {
        title: 'navigation.requirementKanban',
        url: '/dashboard/requirements/kanban',
        icon: 'kanban',
        shortcut: ['r', 'k'],
        permission: 'requirement.view'
      },
      {
        title: 'navigation.requirementStats',
        url: '/dashboard/requirements/stats',
        icon: 'barChart3',
        shortcut: ['r', 's'],
        permission: 'requirement.view'
      },
      {
        title: 'navigation.requirementRelations',
        url: '/dashboard/requirements/relations',
        icon: 'link2',
        shortcut: ['r', 'r'],
        permission: 'requirement.view'
      }
    ]
  },
  {
    title: 'navigation.projectManagement',
    url: '/dashboard/projects',
    icon: 'briefcase',
    shortcut: ['p', 'r'],
    isActive: false,
    permission: 'project.view',
    items: [
      {
        title: 'navigation.projectList',
        url: '/dashboard/projects',
        icon: 'list',
        shortcut: ['p', 'l'],
        permission: 'project.view'
      },
      {
        title: 'navigation.taskManagement',
        url: '/dashboard/tasks',
        icon: 'clipboard',
        shortcut: ['p', 't'],
        permission: 'task.view'
      },
      {
        title: 'navigation.taskBoard',
        url: '/dashboard/kanban',
        icon: 'kanban',
        shortcut: ['p', 'k'],
        permission: 'task.view'
      },
      {
        title: 'navigation.documentManagement',
        url: '/dashboard/documents',
        icon: 'fileText',
        shortcut: ['p', 'd'],
        permission: 'document.view'
      }
    ]
  },
  {
    title: 'navigation.product',
    url: '/dashboard/product',
    icon: 'product',
    shortcut: ['p', 'p'],
    isActive: false,
    items: [] // No child items
  },
  {
    title: 'navigation.systemManagement',
    url: '/system-management',
    icon: 'settings',
    isActive: false,
    role: 'admin', // Only admins can see the system management section
    shortcut: ['s', 's'],
    items: [
      {
        title: 'navigation.users',
        url: '/system-management/users',
        icon: 'user',
        shortcut: ['s', 'u'],
        permission: 'user:list'
      },
      {
        title: 'navigation.roles',
        url: '/system-management/roles',
        icon: 'userPen',
        shortcut: ['s', 'r'],
        permission: 'role:list'
      },
      {
        title: 'navigation.permissions',
        url: '/system-management/permissions',
        icon: 'check',
        shortcut: ['s', 'p'],
        permission: 'permission:list'
      },
      {
        title: 'navigation.menus',
        url: '/system-management/menus',
        icon: 'menu',
        shortcut: ['s', 'm'],
        permission: 'menu:list'
      },
      {
        title: 'navigation.messageManagement',
        url: '/system-management/messages',
        icon: 'messageSquare',
        shortcut: ['s', 'msg'],
        permission: 'message.manage'
      }
    ]
  },
  {
    title: 'navigation.account',
    url: '#', // Placeholder as there is no direct link for the parent
    icon: 'billing',
    isActive: true,

    items: [
      {
        title: 'navigation.profile',
        url: '/dashboard/profile',
        icon: 'userPen',
        shortcut: ['m', 'm']
      },
      {
        title: 'navigation.login',
        shortcut: ['l', 'l'],
        url: '/',
        icon: 'login'
      }
    ]
  }
  // Kanban 已移至项目管理子菜单
];

export interface SaleUser {
  id: number;
  name: string;
  email: string;
  amount: string;
  image: string;
  initials: string;
}

export const recentSalesData: SaleUser[] = [
  {
    id: 1,
    name: 'Olivia Martin',
    email: 'olivia.martin@email.com',
    amount: '+$1,999.00',
    image: 'https://api.slingacademy.com/public/sample-users/1.png',
    initials: 'OM'
  },
  {
    id: 2,
    name: 'Jackson Lee',
    email: 'jackson.lee@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/2.png',
    initials: 'JL'
  },
  {
    id: 3,
    name: 'Isabella Nguyen',
    email: 'isabella.nguyen@email.com',
    amount: '+$299.00',
    image: 'https://api.slingacademy.com/public/sample-users/3.png',
    initials: 'IN'
  },
  {
    id: 4,
    name: 'William Kim',
    email: 'will@email.com',
    amount: '+$99.00',
    image: 'https://api.slingacademy.com/public/sample-users/4.png',
    initials: 'WK'
  },
  {
    id: 5,
    name: 'Sofia Davis',
    email: 'sofia.davis@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/5.png',
    initials: 'SD'
  }
];
