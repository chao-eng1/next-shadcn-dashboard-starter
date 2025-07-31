'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  FolderPlus, 
  ListTodo, 
  Calendar, 
  Users, 
  BarChart3,
  Settings,
  FileText
} from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export function QuickActions() {
  const t = useTranslations('dashboard.overview');

  const quickActions: QuickAction[] = [
    {
      id: 'create-project',
      title: '创建项目',
      description: '开始一个新的项目',
      href: '/dashboard/projects?action=create',
      icon: <FolderPlus className='h-5 w-5' />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100'
    },
    {
      id: 'create-task',
      title: '新建任务',
      description: '添加新的工作任务',
      href: '/dashboard/tasks?action=create',
      icon: <Plus className='h-5 w-5' />,
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100'
    },
    {
      id: 'view-tasks',
      title: '任务管理',
      description: '查看和管理所有任务',
      href: '/dashboard/tasks',
      icon: <ListTodo className='h-5 w-5' />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100'
    },
    {
      id: 'view-sprints',
      title: '冲刺管理',
      description: '管理项目冲刺',
      href: '/dashboard/sprints',
      icon: <Calendar className='h-5 w-5' />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100'
    },
    {
      id: 'team-management',
      title: '团队管理',
      description: '管理团队成员',
      href: '/dashboard/team',
      icon: <Users className='h-5 w-5' />,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 hover:bg-pink-100'
    },
    {
      id: 'reports',
      title: '项目报告',
      description: '查看项目统计报告',
      href: '/dashboard/reports',
      icon: <BarChart3 className='h-5 w-5' />,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 hover:bg-indigo-100'
    },
    {
      id: 'documents',
      title: '文档管理',
      description: '管理项目文档',
      href: '/dashboard/documents',
      icon: <FileText className='h-5 w-5' />,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50 hover:bg-teal-100'
    },
    {
      id: 'settings',
      title: '系统设置',
      description: '配置系统参数',
      href: '/dashboard/settings',
      icon: <Settings className='h-5 w-5' />,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 hover:bg-gray-100'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>快速操作</CardTitle>
        <CardDescription>
          常用功能的快速入口
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          {quickActions.map((action) => (
            <Link key={action.id} href={action.href}>
              <div className={`
                group relative overflow-hidden rounded-lg border p-4 transition-all duration-200
                hover:shadow-md hover:scale-105 cursor-pointer
                ${action.bgColor}
              `}>
                <div className='flex flex-col items-center space-y-3 text-center'>
                  <div className={`
                    flex h-12 w-12 items-center justify-center rounded-full
                    bg-white shadow-sm group-hover:shadow-md transition-shadow
                    ${action.color}
                  `}>
                    {action.icon}
                  </div>
                  
                  <div className='space-y-1'>
                    <h3 className='font-medium text-sm text-gray-900'>
                      {action.title}
                    </h3>
                    <p className='text-xs text-gray-600 line-clamp-2'>
                      {action.description}
                    </p>
                  </div>
                </div>
                
                {/* 悬停效果 */}
                <div className='absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200' />
              </div>
            </Link>
          ))}
        </div>
        
        {/* 底部提示 */}
        <div className='mt-6 text-center'>
          <p className='text-xs text-muted-foreground'>
            点击任意卡片快速访问对应功能
          </p>
        </div>
      </CardContent>
    </Card>
  );
}