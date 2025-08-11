'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Heading } from '@/components/ui/heading';
import PageContainer from '@/components/layout/page-container';
import {
  User,
  Settings,
  Shield,
  Bell,
  Activity,
  Download,
  Edit,
  Camera,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
  Clock
} from 'lucide-react';

// 模拟用户数据
const mockUser = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  image: '/avatars/01.png',
  bio: '全栈开发工程师，专注于 React 和 Node.js 开发',
  location: '北京, 中国',
  website: 'https://johndoe.dev',
  phone: '+86 138 0013 8000',
  timezone: 'Asia/Shanghai',
  language: 'zh-CN',
  theme: 'system' as const,
  createdAt: new Date('2023-01-15'),
  updatedAt: new Date('2024-01-20'),
  stats: {
    projectsCount: 12,
    tasksCompleted: 156,
    documentsCreated: 45,
    messagesCount: 2340
  }
};

export default function ProfileViewPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();
  const t = useTranslations('profile');

  return (
    <PageContainer>
      <div className='mx-auto flex w-full max-w-6xl flex-1 flex-col space-y-6 px-4 md:px-6 lg:px-8'>
        {/* 页面标题 */}
        <div className='flex items-center justify-between'>
          <Heading title='个人资料' description='管理您的个人信息和账户设置' />
          <Button variant='outline' size='sm'>
            <Edit className='mr-2 h-4 w-4' />
            编辑资料
          </Button>
        </div>

        <Separator />

        {/* 用户信息卡片 */}
        <Card>
          <CardContent className='pt-6'>
            <div className='flex flex-col items-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-6'>
              <div className='relative'>
                <Avatar className='h-24 w-24'>
                  <AvatarImage src={mockUser.image} alt={mockUser.name} />
                  <AvatarFallback className='text-lg'>
                    {mockUser.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size='sm'
                  variant='outline'
                  className='absolute -right-2 -bottom-2 h-8 w-8 rounded-full p-0'
                >
                  <Camera className='h-4 w-4' />
                </Button>
              </div>
              <div className='flex-1 space-y-2 text-center sm:text-left'>
                <div>
                  <h2 className='text-2xl font-bold'>{mockUser.name}</h2>
                  <p className='text-muted-foreground'>{mockUser.email}</p>
                </div>
                {mockUser.bio && (
                  <p className='text-muted-foreground max-w-md text-sm'>
                    {mockUser.bio}
                  </p>
                )}
                <div className='flex flex-wrap justify-center gap-2 sm:justify-start'>
                  <Badge variant='secondary'>
                    <MapPin className='mr-1 h-3 w-3' />
                    {mockUser.location}
                  </Badge>
                  <Badge variant='secondary'>
                    <Calendar className='mr-1 h-3 w-3' />
                    加入于 {mockUser.createdAt.getFullYear()}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 标签页内容 */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className='space-y-6'
        >
          <TabsList className='grid w-full grid-cols-5'>
            <TabsTrigger value='overview'>概览</TabsTrigger>
            <TabsTrigger value='personal'>个人信息</TabsTrigger>
            <TabsTrigger value='security'>安全设置</TabsTrigger>
            <TabsTrigger value='preferences'>偏好设置</TabsTrigger>
            <TabsTrigger value='activity'>活动记录</TabsTrigger>
          </TabsList>

          {/* 概览标签页 */}
          <TabsContent value='overview' className='space-y-6'>
            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    参与项目
                  </CardTitle>
                  <User className='text-muted-foreground h-4 w-4' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {mockUser.stats.projectsCount}
                  </div>
                  <p className='text-muted-foreground text-xs'>+2 本月新增</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    完成任务
                  </CardTitle>
                  <Activity className='text-muted-foreground h-4 w-4' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {mockUser.stats.tasksCompleted}
                  </div>
                  <p className='text-muted-foreground text-xs'>+12 本周完成</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    创建文档
                  </CardTitle>
                  <Download className='text-muted-foreground h-4 w-4' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {mockUser.stats.documentsCreated}
                  </div>
                  <p className='text-muted-foreground text-xs'>+3 本月新增</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    消息数量
                  </CardTitle>
                  <Bell className='text-muted-foreground h-4 w-4' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    {mockUser.stats.messagesCount}
                  </div>
                  <p className='text-muted-foreground text-xs'>+45 今日发送</p>
                </CardContent>
              </Card>
            </div>

            {/* 最近活动 */}
            <Card>
              <CardHeader>
                <CardTitle>最近活动</CardTitle>
                <CardDescription>您最近的操作记录</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {[
                    {
                      action: '完成任务',
                      target: '用户认证模块开发',
                      time: '2 小时前',
                      type: 'task'
                    },
                    {
                      action: '创建文档',
                      target: 'API 接口设计文档',
                      time: '4 小时前',
                      type: 'document'
                    },
                    {
                      action: '加入项目',
                      target: '电商平台项目',
                      time: '1 天前',
                      type: 'project'
                    },
                    {
                      action: '发送消息',
                      target: '项目讨论群',
                      time: '2 天前',
                      type: 'message'
                    }
                  ].map((activity, index) => (
                    <div key={index} className='flex items-center space-x-4'>
                      <div className='bg-muted flex h-8 w-8 items-center justify-center rounded-full'>
                        {activity.type === 'task' && (
                          <Activity className='h-4 w-4' />
                        )}
                        {activity.type === 'document' && (
                          <Download className='h-4 w-4' />
                        )}
                        {activity.type === 'project' && (
                          <User className='h-4 w-4' />
                        )}
                        {activity.type === 'message' && (
                          <Bell className='h-4 w-4' />
                        )}
                      </div>
                      <div className='flex-1 space-y-1'>
                        <p className='text-sm leading-none font-medium'>
                          {activity.action}: {activity.target}
                        </p>
                        <p className='text-muted-foreground text-sm'>
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 个人信息标签页 */}
          <TabsContent value='personal' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
                <CardDescription>管理您的基本个人信息</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>姓名</label>
                    <div className='flex items-center space-x-2'>
                      <User className='text-muted-foreground h-4 w-4' />
                      <span>{mockUser.name}</span>
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>邮箱</label>
                    <div className='flex items-center space-x-2'>
                      <Mail className='text-muted-foreground h-4 w-4' />
                      <span>{mockUser.email}</span>
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>电话</label>
                    <div className='flex items-center space-x-2'>
                      <Phone className='text-muted-foreground h-4 w-4' />
                      <span>{mockUser.phone}</span>
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>位置</label>
                    <div className='flex items-center space-x-2'>
                      <MapPin className='text-muted-foreground h-4 w-4' />
                      <span>{mockUser.location}</span>
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>网站</label>
                    <div className='flex items-center space-x-2'>
                      <Globe className='text-muted-foreground h-4 w-4' />
                      <span>{mockUser.website}</span>
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>时区</label>
                    <div className='flex items-center space-x-2'>
                      <Clock className='text-muted-foreground h-4 w-4' />
                      <span>{mockUser.timezone}</span>
                    </div>
                  </div>
                </div>
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>个人简介</label>
                  <p className='text-muted-foreground text-sm'>
                    {mockUser.bio}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 安全设置标签页 */}
          <TabsContent value='security' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>安全设置</CardTitle>
                <CardDescription>管理您的账户安全和隐私设置</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <h4 className='text-sm font-medium'>密码</h4>
                      <p className='text-muted-foreground text-sm'>
                        最后更新于 30 天前
                      </p>
                    </div>
                    <Button variant='outline' size='sm'>
                      修改密码
                    </Button>
                  </div>
                  <Separator />
                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <h4 className='text-sm font-medium'>两步验证</h4>
                      <p className='text-muted-foreground text-sm'>
                        为您的账户添加额外的安全保护
                      </p>
                    </div>
                    <Button variant='outline' size='sm'>
                      启用
                    </Button>
                  </div>
                  <Separator />
                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <h4 className='text-sm font-medium'>登录设备</h4>
                      <p className='text-muted-foreground text-sm'>
                        管理已登录的设备
                      </p>
                    </div>
                    <Button variant='outline' size='sm'>
                      查看设备
                    </Button>
                  </div>
                  <Separator />
                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <h4 className='text-sm font-medium'>安全日志</h4>
                      <p className='text-muted-foreground text-sm'>
                        查看账户安全相关的操作记录
                      </p>
                    </div>
                    <Button variant='outline' size='sm'>
                      查看日志
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 偏好设置标签页 */}
          <TabsContent value='preferences' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>界面偏好</CardTitle>
                <CardDescription>自定义您的界面和交互偏好</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <h4 className='text-sm font-medium'>主题</h4>
                      <p className='text-muted-foreground text-sm'>
                        选择界面主题
                      </p>
                    </div>
                    <Badge variant='outline'>{mockUser.theme}</Badge>
                  </div>
                  <Separator />
                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <h4 className='text-sm font-medium'>语言</h4>
                      <p className='text-muted-foreground text-sm'>
                        选择界面语言
                      </p>
                    </div>
                    <Badge variant='outline'>{mockUser.language}</Badge>
                  </div>
                  <Separator />
                  <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                      <h4 className='text-sm font-medium'>通知设置</h4>
                      <p className='text-muted-foreground text-sm'>
                        管理通知偏好
                      </p>
                    </div>
                    <Button variant='outline' size='sm'>
                      配置
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 活动记录标签页 */}
          <TabsContent value='activity' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>活动记录</CardTitle>
                <CardDescription>查看您的详细活动历史</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {[
                    {
                      date: '2024-01-20',
                      activities: [
                        {
                          time: '14:30',
                          action: '完成任务: 用户认证模块开发',
                          type: 'task'
                        },
                        {
                          time: '10:15',
                          action: '创建文档: API 接口设计',
                          type: 'document'
                        }
                      ]
                    },
                    {
                      date: '2024-01-19',
                      activities: [
                        {
                          time: '16:45',
                          action: '加入项目: 电商平台',
                          type: 'project'
                        },
                        {
                          time: '09:20',
                          action: '发送消息: 项目讨论群',
                          type: 'message'
                        }
                      ]
                    }
                  ].map((day, index) => (
                    <div key={index} className='space-y-2'>
                      <h4 className='text-muted-foreground text-sm font-medium'>
                        {day.date}
                      </h4>
                      <div className='space-y-2 pl-4'>
                        {day.activities.map((activity, actIndex) => (
                          <div
                            key={actIndex}
                            className='flex items-center space-x-3'
                          >
                            <span className='text-muted-foreground w-12 text-xs'>
                              {activity.time}
                            </span>
                            <div className='bg-muted flex h-6 w-6 items-center justify-center rounded-full'>
                              {activity.type === 'task' && (
                                <Activity className='h-3 w-3' />
                              )}
                              {activity.type === 'document' && (
                                <Download className='h-3 w-3' />
                              )}
                              {activity.type === 'project' && (
                                <User className='h-3 w-3' />
                              )}
                              {activity.type === 'message' && (
                                <Bell className='h-3 w-3' />
                              )}
                            </div>
                            <span className='text-sm'>{activity.action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
