'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  Monitor, 
  Smartphone, 
  Mail, 
  Shield, 
  Eye, 
  EyeOff,
  Clock,
  Trash2,
  Download,
  Settings,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Users,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// 通知设置类型
interface NotificationSettings {
  browser: {
    enabled: boolean;
    sound: boolean;
    requireInteraction: boolean;
  };
  sound: {
    enabled: boolean;
    volume: number;
    messageSound: string;
    systemSound: string;
    projectSound: string;
  };
  email: {
    enabled: boolean;
    frequency: 'immediate' | 'hourly' | 'daily' | 'never';
    types: string[];
  };
  popup: {
    enabled: boolean;
    duration: number;
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

// 隐私设置类型
interface PrivacySettings {
  onlineStatus: {
    visible: boolean;
    visibleTo: 'everyone' | 'contacts' | 'nobody';
  };
  messagePreview: {
    enabled: boolean;
    showSender: boolean;
    showContent: boolean;
  };
  readReceipts: {
    enabled: boolean;
    sendReceipts: boolean;
  };
  strangerMessages: {
    allowed: boolean;
    requireApproval: boolean;
  };
}

// 项目通知订阅设置类型
interface ProjectNotificationSettings {
  [projectId: string]: {
    projectName: string;
    subscriptions: {
      [notificationType: string]: {
        enabled: boolean;
        priority: 'all' | 'important_urgent' | 'urgent_only';
      };
    };
  };
}

// 模拟数据
const defaultNotificationSettings: NotificationSettings = {
  browser: {
    enabled: true,
    sound: true,
    requireInteraction: false
  },
  sound: {
    enabled: true,
    volume: 70,
    messageSound: 'default',
    systemSound: 'system',
    projectSound: 'project'
  },
  email: {
    enabled: false,
    frequency: 'daily',
    types: ['system', 'project_urgent']
  },
  popup: {
    enabled: true,
    duration: 5000,
    position: 'top-right'
  },
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00'
  }
};

const defaultPrivacySettings: PrivacySettings = {
  onlineStatus: {
    visible: true,
    visibleTo: 'contacts'
  },
  messagePreview: {
    enabled: true,
    showSender: true,
    showContent: true
  },
  readReceipts: {
    enabled: true,
    sendReceipts: true
  },
  strangerMessages: {
    allowed: true,
    requireApproval: false
  }
};

const mockProjectNotifications: ProjectNotificationSettings = {
  'proj1': {
    projectName: '项目Alpha',
    subscriptions: {
      'project_progress': { enabled: true, priority: 'all' },
      'task_status': { enabled: true, priority: 'important_urgent' },
      'member_change': { enabled: false, priority: 'all' },
      'document_update': { enabled: true, priority: 'urgent_only' },
      'deadline_reminder': { enabled: true, priority: 'all' },
      'approval_process': { enabled: true, priority: 'important_urgent' }
    }
  },
  'proj2': {
    projectName: '项目Beta',
    subscriptions: {
      'project_progress': { enabled: true, priority: 'important_urgent' },
      'task_status': { enabled: true, priority: 'all' },
      'member_change': { enabled: true, priority: 'all' },
      'document_update': { enabled: false, priority: 'all' },
      'deadline_reminder': { enabled: true, priority: 'urgent_only' },
      'approval_process': { enabled: true, priority: 'all' }
    }
  }
};

const notificationTypeLabels = {
  'project_progress': '项目进度',
  'task_status': '任务状态',
  'member_change': '成员变动',
  'document_update': '文档更新',
  'deadline_reminder': '截止日期',
  'approval_process': '审批流程'
};

const priorityLabels = {
  'all': '全部',
  'important_urgent': '重要&紧急',
  'urgent_only': '仅紧急'
};

export default function MessageSettingsPage() {
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(defaultPrivacySettings);
  const [projectNotifications, setProjectNotifications] = useState<ProjectNotificationSettings>(mockProjectNotifications);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // 请求通知权限
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.success('通知权限已授权');
        setNotificationSettings(prev => ({
          ...prev,
          browser: { ...prev.browser, enabled: true }
        }));
      } else {
        toast.error('通知权限被拒绝');
        setNotificationSettings(prev => ({
          ...prev,
          browser: { ...prev.browser, enabled: false }
        }));
      }
    } else {
      toast.error('浏览器不支持通知功能');
    }
  };

  // 测试通知
  const testNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification('测试通知', {
        body: '这是一条测试消息，用于验证通知设置是否正常工作。',
        icon: '/favicon.ico'
      });
      toast.success('测试通知已发送');
    } else {
      toast.error('请先授权通知权限');
    }
  };

  // 保存设置
  const saveSettings = async () => {
    setIsLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 这里应该调用实际的API保存设置
      // await updateNotificationSettings(notificationSettings);
      // await updatePrivacySettings(privacySettings);
      // await updateProjectNotificationSettings(projectNotifications);
      
      toast.success('设置已保存');
      setHasChanges(false);
    } catch (error) {
      toast.error('保存设置失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 重置设置
  const resetSettings = () => {
    setNotificationSettings(defaultNotificationSettings);
    setPrivacySettings(defaultPrivacySettings);
    setProjectNotifications(mockProjectNotifications);
    setHasChanges(true);
    toast.success('设置已重置');
  };

  // 更新通知设置
  const updateNotificationSetting = (path: string, value: any) => {
    setNotificationSettings(prev => {
      const keys = path.split('.');
      const newSettings = { ...prev };
      let current: any = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
    setHasChanges(true);
  };

  // 更新隐私设置
  const updatePrivacySetting = (path: string, value: any) => {
    setPrivacySettings(prev => {
      const keys = path.split('.');
      const newSettings = { ...prev };
      let current: any = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
    setHasChanges(true);
  };

  // 更新项目通知设置
  const updateProjectNotificationSetting = (projectId: string, notificationType: string, field: string, value: any) => {
    setProjectNotifications(prev => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        subscriptions: {
          ...prev[projectId].subscriptions,
          [notificationType]: {
            ...prev[projectId].subscriptions[notificationType],
            [field]: value
          }
        }
      }
    }));
    setHasChanges(true);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">消息设置</h1>
          <p className="text-muted-foreground">管理您的通知偏好、隐私设置和项目通知订阅</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetSettings}>
            重置设置
          </Button>
          <Button 
            onClick={saveSettings} 
            disabled={!hasChanges || isLoading}
            className={cn(hasChanges && "bg-blue-600 hover:bg-blue-700")}
          >
            {isLoading ? '保存中...' : '保存设置'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notifications">通知设置</TabsTrigger>
          <TabsTrigger value="privacy">隐私控制</TabsTrigger>
          <TabsTrigger value="projects">项目通知</TabsTrigger>
        </TabsList>

        {/* 通知设置 */}
        <TabsContent value="notifications" className="space-y-6">
          {/* 浏览器通知 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                浏览器通知
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>启用桌面通知</Label>
                  <p className="text-sm text-muted-foreground">在浏览器中显示桌面通知</p>
                </div>
                <Switch
                  checked={notificationSettings.browser.enabled}
                  onCheckedChange={(checked) => {
                    if (checked && Notification.permission !== 'granted') {
                      requestNotificationPermission();
                    } else {
                      updateNotificationSetting('browser.enabled', checked);
                    }
                  }}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>通知音效</Label>
                  <p className="text-sm text-muted-foreground">播放通知提示音</p>
                </div>
                <Switch
                  checked={notificationSettings.browser.sound}
                  onCheckedChange={(checked) => updateNotificationSetting('browser.sound', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>需要交互</Label>
                  <p className="text-sm text-muted-foreground">紧急通知需要用户手动关闭</p>
                </div>
                <Switch
                  checked={notificationSettings.browser.requireInteraction}
                  onCheckedChange={(checked) => updateNotificationSetting('browser.requireInteraction', checked)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={testNotification}>
                  测试通知
                </Button>
                <Button size="sm" variant="outline" onClick={requestNotificationPermission}>
                  重新授权
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 音效设置 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                音效设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>启用音效</Label>
                  <p className="text-sm text-muted-foreground">播放消息提示音</p>
                </div>
                <Switch
                  checked={notificationSettings.sound.enabled}
                  onCheckedChange={(checked) => updateNotificationSetting('sound.enabled', checked)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>音量 ({notificationSettings.sound.volume}%)</Label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={notificationSettings.sound.volume}
                  onChange={(e) => updateNotificationSetting('sound.volume', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>私聊音效</Label>
                  <Select
                    value={notificationSettings.sound.messageSound}
                    onValueChange={(value) => updateNotificationSetting('sound.messageSound', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">默认</SelectItem>
                      <SelectItem value="gentle">轻柔</SelectItem>
                      <SelectItem value="classic">经典</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>系统音效</Label>
                  <Select
                    value={notificationSettings.sound.systemSound}
                    onValueChange={(value) => updateNotificationSetting('sound.systemSound', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">系统</SelectItem>
                      <SelectItem value="alert">警报</SelectItem>
                      <SelectItem value="chime">铃声</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>项目音效</Label>
                  <Select
                    value={notificationSettings.sound.projectSound}
                    onValueChange={(value) => updateNotificationSetting('sound.projectSound', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="project">项目</SelectItem>
                      <SelectItem value="notification">通知</SelectItem>
                      <SelectItem value="update">更新</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 免打扰时间 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                免打扰时间
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>启用免打扰</Label>
                  <p className="text-sm text-muted-foreground">在指定时间段内静音通知</p>
                </div>
                <Switch
                  checked={notificationSettings.quietHours.enabled}
                  onCheckedChange={(checked) => updateNotificationSetting('quietHours.enabled', checked)}
                />
              </div>
              
              {notificationSettings.quietHours.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>开始时间</Label>
                    <input
                      type="time"
                      value={notificationSettings.quietHours.startTime}
                      onChange={(e) => updateNotificationSetting('quietHours.startTime', e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <Label>结束时间</Label>
                    <input
                      type="time"
                      value={notificationSettings.quietHours.endTime}
                      onChange={(e) => updateNotificationSetting('quietHours.endTime', e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 隐私控制 */}
        <TabsContent value="privacy" className="space-y-6">
          {/* 在线状态 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                在线状态
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>显示在线状态</Label>
                  <p className="text-sm text-muted-foreground">让其他用户看到您的在线状态</p>
                </div>
                <Switch
                  checked={privacySettings.onlineStatus.visible}
                  onCheckedChange={(checked) => updatePrivacySetting('onlineStatus.visible', checked)}
                />
              </div>
              
              {privacySettings.onlineStatus.visible && (
                <div>
                  <Label>可见范围</Label>
                  <Select
                    value={privacySettings.onlineStatus.visibleTo}
                    onValueChange={(value) => updatePrivacySetting('onlineStatus.visibleTo', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="everyone">所有人</SelectItem>
                      <SelectItem value="contacts">联系人</SelectItem>
                      <SelectItem value="nobody">无人</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 消息预览 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                消息预览
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>启用消息预览</Label>
                  <p className="text-sm text-muted-foreground">在通知中显示消息内容</p>
                </div>
                <Switch
                  checked={privacySettings.messagePreview.enabled}
                  onCheckedChange={(checked) => updatePrivacySetting('messagePreview.enabled', checked)}
                />
              </div>
              
              {privacySettings.messagePreview.enabled && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>显示发送者</Label>
                      <p className="text-sm text-muted-foreground">在通知中显示发送者姓名</p>
                    </div>
                    <Switch
                      checked={privacySettings.messagePreview.showSender}
                      onCheckedChange={(checked) => updatePrivacySetting('messagePreview.showSender', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>显示内容</Label>
                      <p className="text-sm text-muted-foreground">在通知中显示消息内容</p>
                    </div>
                    <Switch
                      checked={privacySettings.messagePreview.showContent}
                      onCheckedChange={(checked) => updatePrivacySetting('messagePreview.showContent', checked)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* 已读回执 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                已读回执
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>启用已读回执</Label>
                  <p className="text-sm text-muted-foreground">显示消息的已读状态</p>
                </div>
                <Switch
                  checked={privacySettings.readReceipts.enabled}
                  onCheckedChange={(checked) => updatePrivacySetting('readReceipts.enabled', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>发送已读回执</Label>
                  <p className="text-sm text-muted-foreground">让发送者知道您已读取消息</p>
                </div>
                <Switch
                  checked={privacySettings.readReceipts.sendReceipts}
                  onCheckedChange={(checked) => updatePrivacySetting('readReceipts.sendReceipts', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 项目通知 */}
        <TabsContent value="projects" className="space-y-6">
          <div className="text-sm text-muted-foreground mb-4">
            管理您对不同项目通知类型的订阅设置。您可以选择接收全部通知、仅重要和紧急通知，或仅紧急通知。
          </div>
          
          {Object.entries(projectNotifications).map(([projectId, project]) => (
            <Card key={projectId}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  {project.projectName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(project.subscriptions).map(([notificationType, subscription]) => (
                    <div key={notificationType} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={subscription.enabled}
                          onCheckedChange={(checked) => 
                            updateProjectNotificationSetting(projectId, notificationType, 'enabled', checked)
                          }
                        />
                        <div>
                          <Label className="font-medium">
                            {notificationTypeLabels[notificationType as keyof typeof notificationTypeLabels]}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            接收{notificationTypeLabels[notificationType as keyof typeof notificationTypeLabels]}相关的通知
                          </p>
                        </div>
                      </div>
                      
                      {subscription.enabled && (
                        <Select
                          value={subscription.priority}
                          onValueChange={(value) => 
                            updateProjectNotificationSetting(projectId, notificationType, 'priority', value)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">全部</SelectItem>
                            <SelectItem value="important_urgent">重要&紧急</SelectItem>
                            <SelectItem value="urgent_only">仅紧急</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}