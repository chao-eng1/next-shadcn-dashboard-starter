'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
  Settings,
  Bell,
  BellOff,
  MessageSquare,
  Users,
  Shield,
  Download,
  Upload,
  Trash2,
  ArrowLeft,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Smartphone,
  Mail,
  Monitor,
  Clock,
  Filter,
  Archive,
  Star,
  UserPlus,
  UserMinus,
  Lock,
  Unlock,
  Globe,
  FileText,
  Image,
  Video,
  Mic,
  Calendar,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface NotificationSettings {
  // 通用通知设置
  enableNotifications: boolean;
  enableSounds: boolean;
  enableDesktopNotifications: boolean;
  enableMobileNotifications: boolean;
  enableEmailNotifications: boolean;

  // 私聊通知
  privateMessages: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
    mobile: boolean;
    email: boolean;
    vipOnly: boolean;
  };

  // 群聊通知
  groupMessages: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
    mobile: boolean;
    email: boolean;
    mentionOnly: boolean;
    keywordNotification: boolean;
    keywords: string[];
  };

  // 系统通知
  systemMessages: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
    mobile: boolean;
    email: boolean;
    importantOnly: boolean;
  };

  // 项目通知
  projectNotifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
    mobile: boolean;
    email: boolean;
    taskAssignments: boolean;
    deadlineReminders: boolean;
    statusUpdates: boolean;
    comments: boolean;
    milestones: boolean;
    meetings: boolean;
  };

  // 免打扰设置
  doNotDisturb: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    weekendsOnly: boolean;
    emergencyBypass: boolean;
  };
}

interface PrivacySettings {
  // 在线状态
  showOnlineStatus: boolean;
  showLastSeen: boolean;

  // 消息隐私
  allowMessagesFrom: 'everyone' | 'contacts' | 'nobody';
  allowGroupInvites: boolean;
  readReceipts: boolean;
  typingIndicators: boolean;

  // 个人资料
  showProfilePhoto: boolean;
  showPersonalInfo: boolean;

  // 阻止列表
  blockedUsers: string[];
}

interface ChatSettings {
  // 聊天界面
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  messagePreview: boolean;
  showTimestamps: boolean;
  groupMessagesBy: 'none' | 'sender' | 'time';

  // 媒体设置
  autoDownloadImages: boolean;
  autoDownloadVideos: boolean;
  autoDownloadAudio: boolean;
  autoDownloadDocuments: boolean;
  mediaQuality: 'low' | 'medium' | 'high';

  // 语言和地区
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
}

interface StorageSettings {
  // 存储管理
  totalStorage: number;
  usedStorage: number;
  autoDeleteOldMessages: boolean;
  autoDeleteDays: number;

  // 备份设置
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  includeMedia: boolean;
  backupLocation: string;
}

export function MessageSettings() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('notifications');
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 设置状态
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      enableNotifications: true,
      enableSounds: true,
      enableDesktopNotifications: true,
      enableMobileNotifications: true,
      enableEmailNotifications: false,
      privateMessages: {
        enabled: true,
        sound: true,
        desktop: true,
        mobile: true,
        email: false,
        vipOnly: false
      },
      groupMessages: {
        enabled: true,
        sound: false,
        desktop: true,
        mobile: true,
        email: false,
        mentionOnly: true,
        keywordNotification: true,
        keywords: ['紧急', '重要', '@我']
      },
      systemMessages: {
        enabled: true,
        sound: true,
        desktop: true,
        mobile: true,
        email: true,
        importantOnly: false
      },
      projectNotifications: {
        enabled: true,
        sound: false,
        desktop: true,
        mobile: true,
        email: true,
        taskAssignments: true,
        deadlineReminders: true,
        statusUpdates: false,
        comments: true,
        milestones: true,
        meetings: true
      },
      doNotDisturb: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
        weekendsOnly: false,
        emergencyBypass: true
      }
    });

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    showOnlineStatus: true,
    showLastSeen: true,
    allowMessagesFrom: 'everyone',
    allowGroupInvites: true,
    readReceipts: true,
    typingIndicators: true,
    showProfilePhoto: true,
    showPersonalInfo: false,
    blockedUsers: []
  });

  const [chatSettings, setChatSettings] = useState<ChatSettings>({
    theme: 'auto',
    fontSize: 'medium',
    messagePreview: true,
    showTimestamps: true,
    groupMessagesBy: 'sender',
    autoDownloadImages: true,
    autoDownloadVideos: false,
    autoDownloadAudio: true,
    autoDownloadDocuments: false,
    mediaQuality: 'medium',
    language: 'zh-CN',
    timezone: 'Asia/Shanghai',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h'
  });

  const [storageSettings, setStorageSettings] = useState<StorageSettings>({
    totalStorage: 10 * 1024 * 1024 * 1024, // 10GB
    usedStorage: 2.5 * 1024 * 1024 * 1024, // 2.5GB
    autoDeleteOldMessages: false,
    autoDeleteDays: 90,
    autoBackup: true,
    backupFrequency: 'weekly',
    includeMedia: false,
    backupLocation: 'cloud'
  });

  // 新关键词输入
  const [newKeyword, setNewKeyword] = useState('');

  // 保存设置
  const saveSettings = async () => {
    setIsLoading(true);
    try {
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 这里应该调用实际的API来保存设置
      console.log('保存设置:', {
        notificationSettings,
        privacySettings,
        chatSettings,
        storageSettings
      });

      setHasChanges(false);
      toast.success('设置已保存');
    } catch (error) {
      toast.error('保存设置失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 重置设置
  const resetSettings = () => {
    // 重置为默认值
    setHasChanges(true);
    toast.success('设置已重置');
  };

  // 添加关键词
  const addKeyword = () => {
    if (
      newKeyword.trim() &&
      !notificationSettings.groupMessages.keywords.includes(newKeyword.trim())
    ) {
      setNotificationSettings((prev) => ({
        ...prev,
        groupMessages: {
          ...prev.groupMessages,
          keywords: [...prev.groupMessages.keywords, newKeyword.trim()]
        }
      }));
      setNewKeyword('');
      setHasChanges(true);
    }
  };

  // 删除关键词
  const removeKeyword = (keyword: string) => {
    setNotificationSettings((prev) => ({
      ...prev,
      groupMessages: {
        ...prev.groupMessages,
        keywords: prev.groupMessages.keywords.filter((k) => k !== keyword)
      }
    }));
    setHasChanges(true);
  };

  // 格式化存储大小
  const formatStorage = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  // 计算存储使用百分比
  const storagePercentage =
    (storageSettings.usedStorage / storageSettings.totalStorage) * 100;

  return (
    <div className='flex h-full flex-col'>
      {/* 头部 */}
      <div className='bg-background border-b p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Button variant='ghost' size='sm' onClick={() => router.back()}>
              <ArrowLeft className='h-4 w-4' />
            </Button>
            <div>
              <h1 className='text-xl font-semibold'>消息设置</h1>
              <p className='text-muted-foreground text-sm'>
                管理您的消息通知和隐私设置
              </p>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            {hasChanges && (
              <Button variant='outline' size='sm' onClick={resetSettings}>
                <RotateCcw className='mr-2 h-4 w-4' />
                重置
              </Button>
            )}
            <Button
              size='sm'
              onClick={saveSettings}
              disabled={!hasChanges || isLoading}
            >
              <Save className='mr-2 h-4 w-4' />
              {isLoading ? '保存中...' : '保存设置'}
            </Button>
          </div>
        </div>
      </div>

      {/* 设置内容 */}
      <div className='flex-1'>
        <Tabs value={activeTab} onValueChange={setActiveTab} className='h-full'>
          <div className='border-b'>
            <TabsList className='h-12 w-full justify-start rounded-none bg-transparent p-0'>
              <TabsTrigger
                value='notifications'
                className='data-[state=active]:border-primary rounded-none border-b-2 border-transparent'
              >
                <Bell className='mr-2 h-4 w-4' />
                通知设置
              </TabsTrigger>
              <TabsTrigger
                value='privacy'
                className='data-[state=active]:border-primary rounded-none border-b-2 border-transparent'
              >
                <Shield className='mr-2 h-4 w-4' />
                隐私设置
              </TabsTrigger>
              <TabsTrigger
                value='chat'
                className='data-[state=active]:border-primary rounded-none border-b-2 border-transparent'
              >
                <MessageSquare className='mr-2 h-4 w-4' />
                聊天设置
              </TabsTrigger>
              <TabsTrigger
                value='storage'
                className='data-[state=active]:border-primary rounded-none border-b-2 border-transparent'
              >
                <Archive className='mr-2 h-4 w-4' />
                存储管理
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className='flex-1'>
            <div className='p-6'>
              {/* 通知设置 */}
              <TabsContent value='notifications' className='mt-0 space-y-6'>
                {/* 全局通知设置 */}
                <Card>
                  <CardHeader>
                    <CardTitle>全局通知设置</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <Label htmlFor='enable-notifications'>启用通知</Label>
                        <p className='text-muted-foreground text-sm'>
                          接收所有类型的消息通知
                        </p>
                      </div>
                      <Switch
                        id='enable-notifications'
                        checked={notificationSettings.enableNotifications}
                        onCheckedChange={(checked) => {
                          setNotificationSettings((prev) => ({
                            ...prev,
                            enableNotifications: checked
                          }));
                          setHasChanges(true);
                        }}
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <div>
                        <Label htmlFor='enable-sounds'>声音提醒</Label>
                        <p className='text-muted-foreground text-sm'>
                          播放通知声音
                        </p>
                      </div>
                      <Switch
                        id='enable-sounds'
                        checked={notificationSettings.enableSounds}
                        onCheckedChange={(checked) => {
                          setNotificationSettings((prev) => ({
                            ...prev,
                            enableSounds: checked
                          }));
                          setHasChanges(true);
                        }}
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <div>
                        <Label htmlFor='enable-desktop'>桌面通知</Label>
                        <p className='text-muted-foreground text-sm'>
                          显示桌面弹窗通知
                        </p>
                      </div>
                      <Switch
                        id='enable-desktop'
                        checked={
                          notificationSettings.enableDesktopNotifications
                        }
                        onCheckedChange={(checked) => {
                          setNotificationSettings((prev) => ({
                            ...prev,
                            enableDesktopNotifications: checked
                          }));
                          setHasChanges(true);
                        }}
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <div>
                        <Label htmlFor='enable-mobile'>移动端推送</Label>
                        <p className='text-muted-foreground text-sm'>
                          发送移动端推送通知
                        </p>
                      </div>
                      <Switch
                        id='enable-mobile'
                        checked={notificationSettings.enableMobileNotifications}
                        onCheckedChange={(checked) => {
                          setNotificationSettings((prev) => ({
                            ...prev,
                            enableMobileNotifications: checked
                          }));
                          setHasChanges(true);
                        }}
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <div>
                        <Label htmlFor='enable-email'>邮件通知</Label>
                        <p className='text-muted-foreground text-sm'>
                          发送邮件通知
                        </p>
                      </div>
                      <Switch
                        id='enable-email'
                        checked={notificationSettings.enableEmailNotifications}
                        onCheckedChange={(checked) => {
                          setNotificationSettings((prev) => ({
                            ...prev,
                            enableEmailNotifications: checked
                          }));
                          setHasChanges(true);
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* 私聊通知 */}
                <Card>
                  <CardHeader>
                    <CardTitle>私聊通知</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <Label>启用私聊通知</Label>
                      <Switch
                        checked={notificationSettings.privateMessages.enabled}
                        onCheckedChange={(checked) => {
                          setNotificationSettings((prev) => ({
                            ...prev,
                            privateMessages: {
                              ...prev.privateMessages,
                              enabled: checked
                            }
                          }));
                          setHasChanges(true);
                        }}
                      />
                    </div>

                    {notificationSettings.privateMessages.enabled && (
                      <div className='border-muted space-y-3 border-l-2 pl-4'>
                        <div className='flex items-center justify-between'>
                          <Label>声音提醒</Label>
                          <Switch
                            checked={notificationSettings.privateMessages.sound}
                            onCheckedChange={(checked) => {
                              setNotificationSettings((prev) => ({
                                ...prev,
                                privateMessages: {
                                  ...prev.privateMessages,
                                  sound: checked
                                }
                              }));
                              setHasChanges(true);
                            }}
                          />
                        </div>

                        <div className='flex items-center justify-between'>
                          <Label>桌面通知</Label>
                          <Switch
                            checked={
                              notificationSettings.privateMessages.desktop
                            }
                            onCheckedChange={(checked) => {
                              setNotificationSettings((prev) => ({
                                ...prev,
                                privateMessages: {
                                  ...prev.privateMessages,
                                  desktop: checked
                                }
                              }));
                              setHasChanges(true);
                            }}
                          />
                        </div>

                        <div className='flex items-center justify-between'>
                          <Label>仅VIP联系人</Label>
                          <Switch
                            checked={
                              notificationSettings.privateMessages.vipOnly
                            }
                            onCheckedChange={(checked) => {
                              setNotificationSettings((prev) => ({
                                ...prev,
                                privateMessages: {
                                  ...prev.privateMessages,
                                  vipOnly: checked
                                }
                              }));
                              setHasChanges(true);
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 群聊通知 */}
                <Card>
                  <CardHeader>
                    <CardTitle>群聊通知</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <Label>启用群聊通知</Label>
                      <Switch
                        checked={notificationSettings.groupMessages.enabled}
                        onCheckedChange={(checked) => {
                          setNotificationSettings((prev) => ({
                            ...prev,
                            groupMessages: {
                              ...prev.groupMessages,
                              enabled: checked
                            }
                          }));
                          setHasChanges(true);
                        }}
                      />
                    </div>

                    {notificationSettings.groupMessages.enabled && (
                      <div className='border-muted space-y-3 border-l-2 pl-4'>
                        <div className='flex items-center justify-between'>
                          <Label>仅@我时通知</Label>
                          <Switch
                            checked={
                              notificationSettings.groupMessages.mentionOnly
                            }
                            onCheckedChange={(checked) => {
                              setNotificationSettings((prev) => ({
                                ...prev,
                                groupMessages: {
                                  ...prev.groupMessages,
                                  mentionOnly: checked
                                }
                              }));
                              setHasChanges(true);
                            }}
                          />
                        </div>

                        <div className='flex items-center justify-between'>
                          <Label>关键词通知</Label>
                          <Switch
                            checked={
                              notificationSettings.groupMessages
                                .keywordNotification
                            }
                            onCheckedChange={(checked) => {
                              setNotificationSettings((prev) => ({
                                ...prev,
                                groupMessages: {
                                  ...prev.groupMessages,
                                  keywordNotification: checked
                                }
                              }));
                              setHasChanges(true);
                            }}
                          />
                        </div>

                        {notificationSettings.groupMessages
                          .keywordNotification && (
                          <div>
                            <Label className='text-sm font-medium'>
                              关键词列表
                            </Label>
                            <div className='mt-2 space-y-2'>
                              <div className='flex gap-2'>
                                <Input
                                  placeholder='添加关键词'
                                  value={newKeyword}
                                  onChange={(e) =>
                                    setNewKeyword(e.target.value)
                                  }
                                  onKeyPress={(e) =>
                                    e.key === 'Enter' && addKeyword()
                                  }
                                />
                                <Button size='sm' onClick={addKeyword}>
                                  添加
                                </Button>
                              </div>
                              <div className='flex flex-wrap gap-2'>
                                {notificationSettings.groupMessages.keywords.map(
                                  (keyword) => (
                                    <Badge
                                      key={keyword}
                                      variant='secondary'
                                      className='cursor-pointer'
                                      onClick={() => removeKeyword(keyword)}
                                    >
                                      {keyword}
                                      <XCircle className='ml-1 h-3 w-3' />
                                    </Badge>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 免打扰设置 */}
                <Card>
                  <CardHeader>
                    <CardTitle>免打扰模式</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <Label>启用免打扰</Label>
                        <p className='text-muted-foreground text-sm'>
                          在指定时间段内静音通知
                        </p>
                      </div>
                      <Switch
                        checked={notificationSettings.doNotDisturb.enabled}
                        onCheckedChange={(checked) => {
                          setNotificationSettings((prev) => ({
                            ...prev,
                            doNotDisturb: {
                              ...prev.doNotDisturb,
                              enabled: checked
                            }
                          }));
                          setHasChanges(true);
                        }}
                      />
                    </div>

                    {notificationSettings.doNotDisturb.enabled && (
                      <div className='border-muted space-y-3 border-l-2 pl-4'>
                        <div className='grid grid-cols-2 gap-4'>
                          <div>
                            <Label>开始时间</Label>
                            <Input
                              type='time'
                              value={
                                notificationSettings.doNotDisturb.startTime
                              }
                              onChange={(e) => {
                                setNotificationSettings((prev) => ({
                                  ...prev,
                                  doNotDisturb: {
                                    ...prev.doNotDisturb,
                                    startTime: e.target.value
                                  }
                                }));
                                setHasChanges(true);
                              }}
                            />
                          </div>
                          <div>
                            <Label>结束时间</Label>
                            <Input
                              type='time'
                              value={notificationSettings.doNotDisturb.endTime}
                              onChange={(e) => {
                                setNotificationSettings((prev) => ({
                                  ...prev,
                                  doNotDisturb: {
                                    ...prev.doNotDisturb,
                                    endTime: e.target.value
                                  }
                                }));
                                setHasChanges(true);
                              }}
                            />
                          </div>
                        </div>

                        <div className='flex items-center justify-between'>
                          <Label>紧急消息绕过</Label>
                          <Switch
                            checked={
                              notificationSettings.doNotDisturb.emergencyBypass
                            }
                            onCheckedChange={(checked) => {
                              setNotificationSettings((prev) => ({
                                ...prev,
                                doNotDisturb: {
                                  ...prev.doNotDisturb,
                                  emergencyBypass: checked
                                }
                              }));
                              setHasChanges(true);
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 隐私设置 */}
              <TabsContent value='privacy' className='mt-0 space-y-6'>
                {/* 在线状态 */}
                <Card>
                  <CardHeader>
                    <CardTitle>在线状态</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <Label>显示在线状态</Label>
                        <p className='text-muted-foreground text-sm'>
                          让其他人看到您的在线状态
                        </p>
                      </div>
                      <Switch
                        checked={privacySettings.showOnlineStatus}
                        onCheckedChange={(checked) => {
                          setPrivacySettings((prev) => ({
                            ...prev,
                            showOnlineStatus: checked
                          }));
                          setHasChanges(true);
                        }}
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <div>
                        <Label>显示最后在线时间</Label>
                        <p className='text-muted-foreground text-sm'>
                          显示您最后一次在线的时间
                        </p>
                      </div>
                      <Switch
                        checked={privacySettings.showLastSeen}
                        onCheckedChange={(checked) => {
                          setPrivacySettings((prev) => ({
                            ...prev,
                            showLastSeen: checked
                          }));
                          setHasChanges(true);
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* 消息隐私 */}
                <Card>
                  <CardHeader>
                    <CardTitle>消息隐私</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div>
                      <Label>允许谁给我发消息</Label>
                      <Select
                        value={privacySettings.allowMessagesFrom}
                        onValueChange={(
                          value: 'everyone' | 'contacts' | 'nobody'
                        ) => {
                          setPrivacySettings((prev) => ({
                            ...prev,
                            allowMessagesFrom: value
                          }));
                          setHasChanges(true);
                        }}
                      >
                        <SelectTrigger className='mt-2'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='everyone'>所有人</SelectItem>
                          <SelectItem value='contacts'>仅联系人</SelectItem>
                          <SelectItem value='nobody'>无人</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='flex items-center justify-between'>
                      <div>
                        <Label>允许群组邀请</Label>
                        <p className='text-muted-foreground text-sm'>
                          允许他人邀请您加入群组
                        </p>
                      </div>
                      <Switch
                        checked={privacySettings.allowGroupInvites}
                        onCheckedChange={(checked) => {
                          setPrivacySettings((prev) => ({
                            ...prev,
                            allowGroupInvites: checked
                          }));
                          setHasChanges(true);
                        }}
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <div>
                        <Label>已读回执</Label>
                        <p className='text-muted-foreground text-sm'>
                          发送已读状态给对方
                        </p>
                      </div>
                      <Switch
                        checked={privacySettings.readReceipts}
                        onCheckedChange={(checked) => {
                          setPrivacySettings((prev) => ({
                            ...prev,
                            readReceipts: checked
                          }));
                          setHasChanges(true);
                        }}
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <div>
                        <Label>输入状态指示器</Label>
                        <p className='text-muted-foreground text-sm'>
                          显示"正在输入"状态
                        </p>
                      </div>
                      <Switch
                        checked={privacySettings.typingIndicators}
                        onCheckedChange={(checked) => {
                          setPrivacySettings((prev) => ({
                            ...prev,
                            typingIndicators: checked
                          }));
                          setHasChanges(true);
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* 个人资料 */}
                <Card>
                  <CardHeader>
                    <CardTitle>个人资料</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <Label>显示头像</Label>
                        <p className='text-muted-foreground text-sm'>
                          在聊天中显示您的头像
                        </p>
                      </div>
                      <Switch
                        checked={privacySettings.showProfilePhoto}
                        onCheckedChange={(checked) => {
                          setPrivacySettings((prev) => ({
                            ...prev,
                            showProfilePhoto: checked
                          }));
                          setHasChanges(true);
                        }}
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <div>
                        <Label>显示个人信息</Label>
                        <p className='text-muted-foreground text-sm'>
                          允许他人查看您的个人信息
                        </p>
                      </div>
                      <Switch
                        checked={privacySettings.showPersonalInfo}
                        onCheckedChange={(checked) => {
                          setPrivacySettings((prev) => ({
                            ...prev,
                            showPersonalInfo: checked
                          }));
                          setHasChanges(true);
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 聊天设置 */}
              <TabsContent value='chat' className='mt-0 space-y-6'>
                {/* 界面设置 */}
                <Card>
                  <CardHeader>
                    <CardTitle>界面设置</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div>
                      <Label>主题</Label>
                      <Select
                        value={chatSettings.theme}
                        onValueChange={(value: 'light' | 'dark' | 'auto') => {
                          setChatSettings((prev) => ({
                            ...prev,
                            theme: value
                          }));
                          setHasChanges(true);
                        }}
                      >
                        <SelectTrigger className='mt-2'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='light'>浅色</SelectItem>
                          <SelectItem value='dark'>深色</SelectItem>
                          <SelectItem value='auto'>跟随系统</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>字体大小</Label>
                      <Select
                        value={chatSettings.fontSize}
                        onValueChange={(
                          value: 'small' | 'medium' | 'large'
                        ) => {
                          setChatSettings((prev) => ({
                            ...prev,
                            fontSize: value
                          }));
                          setHasChanges(true);
                        }}
                      >
                        <SelectTrigger className='mt-2'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='small'>小</SelectItem>
                          <SelectItem value='medium'>中</SelectItem>
                          <SelectItem value='large'>大</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='flex items-center justify-between'>
                      <div>
                        <Label>显示时间戳</Label>
                        <p className='text-muted-foreground text-sm'>
                          在消息旁显示发送时间
                        </p>
                      </div>
                      <Switch
                        checked={chatSettings.showTimestamps}
                        onCheckedChange={(checked) => {
                          setChatSettings((prev) => ({
                            ...prev,
                            showTimestamps: checked
                          }));
                          setHasChanges(true);
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* 媒体设置 */}
                <Card>
                  <CardHeader>
                    <CardTitle>媒体设置</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <Label>自动下载图片</Label>
                      <Switch
                        checked={chatSettings.autoDownloadImages}
                        onCheckedChange={(checked) => {
                          setChatSettings((prev) => ({
                            ...prev,
                            autoDownloadImages: checked
                          }));
                          setHasChanges(true);
                        }}
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <Label>自动下载视频</Label>
                      <Switch
                        checked={chatSettings.autoDownloadVideos}
                        onCheckedChange={(checked) => {
                          setChatSettings((prev) => ({
                            ...prev,
                            autoDownloadVideos: checked
                          }));
                          setHasChanges(true);
                        }}
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <Label>自动下载音频</Label>
                      <Switch
                        checked={chatSettings.autoDownloadAudio}
                        onCheckedChange={(checked) => {
                          setChatSettings((prev) => ({
                            ...prev,
                            autoDownloadAudio: checked
                          }));
                          setHasChanges(true);
                        }}
                      />
                    </div>

                    <div>
                      <Label>媒体质量</Label>
                      <Select
                        value={chatSettings.mediaQuality}
                        onValueChange={(value: 'low' | 'medium' | 'high') => {
                          setChatSettings((prev) => ({
                            ...prev,
                            mediaQuality: value
                          }));
                          setHasChanges(true);
                        }}
                      >
                        <SelectTrigger className='mt-2'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='low'>低</SelectItem>
                          <SelectItem value='medium'>中</SelectItem>
                          <SelectItem value='high'>高</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 存储管理 */}
              <TabsContent value='storage' className='mt-0 space-y-6'>
                {/* 存储使用情况 */}
                <Card>
                  <CardHeader>
                    <CardTitle>存储使用情况</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='space-y-2'>
                      <div className='flex justify-between text-sm'>
                        <span>已使用</span>
                        <span>
                          {formatStorage(storageSettings.usedStorage)} /{' '}
                          {formatStorage(storageSettings.totalStorage)}
                        </span>
                      </div>
                      <div className='bg-muted h-2 w-full rounded-full'>
                        <div
                          className={cn(
                            'h-2 rounded-full transition-all',
                            storagePercentage > 90
                              ? 'bg-red-500'
                              : storagePercentage > 70
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                          )}
                          style={{
                            width: `${Math.min(storagePercentage, 100)}%`
                          }}
                        />
                      </div>
                      <p className='text-muted-foreground text-xs'>
                        使用了 {storagePercentage.toFixed(1)}% 的存储空间
                      </p>
                    </div>

                    <div className='flex gap-2'>
                      <Button variant='outline' size='sm'>
                        <Trash2 className='mr-2 h-4 w-4' />
                        清理缓存
                      </Button>
                      <Button variant='outline' size='sm'>
                        <Archive className='mr-2 h-4 w-4' />
                        管理文件
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* 自动清理 */}
                <Card>
                  <CardHeader>
                    <CardTitle>自动清理</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <Label>自动删除旧消息</Label>
                        <p className='text-muted-foreground text-sm'>
                          自动删除超过指定天数的消息
                        </p>
                      </div>
                      <Switch
                        checked={storageSettings.autoDeleteOldMessages}
                        onCheckedChange={(checked) => {
                          setStorageSettings((prev) => ({
                            ...prev,
                            autoDeleteOldMessages: checked
                          }));
                          setHasChanges(true);
                        }}
                      />
                    </div>

                    {storageSettings.autoDeleteOldMessages && (
                      <div className='border-muted border-l-2 pl-4'>
                        <Label>保留天数</Label>
                        <Input
                          type='number'
                          value={storageSettings.autoDeleteDays}
                          onChange={(e) => {
                            setStorageSettings((prev) => ({
                              ...prev,
                              autoDeleteDays: parseInt(e.target.value) || 90
                            }));
                            setHasChanges(true);
                          }}
                          className='mt-2'
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 备份设置 */}
                <Card>
                  <CardHeader>
                    <CardTitle>备份设置</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <Label>自动备份</Label>
                        <p className='text-muted-foreground text-sm'>
                          定期备份您的消息数据
                        </p>
                      </div>
                      <Switch
                        checked={storageSettings.autoBackup}
                        onCheckedChange={(checked) => {
                          setStorageSettings((prev) => ({
                            ...prev,
                            autoBackup: checked
                          }));
                          setHasChanges(true);
                        }}
                      />
                    </div>

                    {storageSettings.autoBackup && (
                      <div className='border-muted space-y-3 border-l-2 pl-4'>
                        <div>
                          <Label>备份频率</Label>
                          <Select
                            value={storageSettings.backupFrequency}
                            onValueChange={(
                              value: 'daily' | 'weekly' | 'monthly'
                            ) => {
                              setStorageSettings((prev) => ({
                                ...prev,
                                backupFrequency: value
                              }));
                              setHasChanges(true);
                            }}
                          >
                            <SelectTrigger className='mt-2'>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='daily'>每日</SelectItem>
                              <SelectItem value='weekly'>每周</SelectItem>
                              <SelectItem value='monthly'>每月</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className='flex items-center justify-between'>
                          <Label>包含媒体文件</Label>
                          <Switch
                            checked={storageSettings.includeMedia}
                            onCheckedChange={(checked) => {
                              setStorageSettings((prev) => ({
                                ...prev,
                                includeMedia: checked
                              }));
                              setHasChanges(true);
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <div className='flex gap-2'>
                      <Button variant='outline' size='sm'>
                        <Download className='mr-2 h-4 w-4' />
                        导出数据
                      </Button>
                      <Button variant='outline' size='sm'>
                        <Upload className='mr-2 h-4 w-4' />
                        导入数据
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
}
