// 消息通知服务
export class NotificationService {
  private static instance: NotificationService;
  private audioContext: AudioContext | null = null;
  private notificationSound: AudioBuffer | null = null;
  private originalTitle: string = '';
  private titleUpdateInterval: NodeJS.Timeout | null = null;
  private unreadCount: number = 0;

  private constructor() {
    this.originalTitle = typeof document !== 'undefined' ? document.title : '';
    this.initializeAudio();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // 初始化音频上下文
  private async initializeAudio() {
    if (typeof window === 'undefined') return;

    try {
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();

      // 创建简单的提示音
      await this.createNotificationSound();
    } catch (error) {
      console.warn('无法初始化音频上下文:', error);
    }
  }

  // 创建通知提示音
  private async createNotificationSound() {
    if (!this.audioContext) return;

    try {
      // 创建一个简单的提示音 (双音调)
      const sampleRate = this.audioContext.sampleRate;
      const duration = 0.3; // 300ms
      const length = sampleRate * duration;

      const buffer = this.audioContext.createBuffer(1, length, sampleRate);
      const channelData = buffer.getChannelData(0);

      // 生成双音调提示音
      for (let i = 0; i < length; i++) {
        const time = i / sampleRate;
        const frequency1 = time < duration / 2 ? 800 : 1000; // 第一个音调800Hz，第二个1000Hz
        const decay = Math.exp(-time * 3); // 衰减效果
        channelData[i] =
          Math.sin(2 * Math.PI * frequency1 * time) * 0.3 * decay;
      }

      this.notificationSound = buffer;
    } catch (error) {
      console.warn('无法创建通知音效:', error);
    }
  }

  // 播放通知音效
  public async playNotificationSound() {
    if (!this.audioContext || !this.notificationSound) return;

    try {
      // 确保音频上下文已启动
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = this.notificationSound;
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // 设置音量
      gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);

      source.start();
    } catch (error) {
      console.warn('无法播放通知音效:', error);
    }
  }

  // 请求通知权限
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('此浏览器不支持桌面通知');
      return 'denied';
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  // 显示桌面通知
  public async showDesktopNotification(options: {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
    onClick?: () => void;
  }) {
    const permission = await this.requestNotificationPermission();

    if (permission !== 'granted') {
      console.log('用户未授权桌面通知');
      return null;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag || 'im-message',
        requireInteraction: false,
        silent: true // 我们使用自定义音效
      });

      if (options.onClick) {
        notification.onclick = () => {
          options.onClick?.();
          notification.close();
        };
      }

      // 5秒后自动关闭
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    } catch (error) {
      console.error('显示桌面通知失败:', error);
      return null;
    }
  }

  // 更新浏览器标题栏未读计数
  public updateTitleWithUnreadCount(count: number) {
    this.unreadCount = count;

    if (typeof document === 'undefined') return;

    if (count > 0) {
      document.title = `(${count}) ${this.originalTitle}`;
      this.startTitleBlinking();
    } else {
      document.title = this.originalTitle;
      this.stopTitleBlinking();
    }
  }

  // 开始标题栏闪烁
  private startTitleBlinking() {
    if (this.titleUpdateInterval) return;

    let isOriginal = true;
    this.titleUpdateInterval = setInterval(() => {
      if (typeof document === 'undefined') return;

      if (isOriginal) {
        document.title = `(${this.unreadCount}) ${this.originalTitle}`;
      } else {
        document.title = `🔔 新消息 - ${this.originalTitle}`;
      }
      isOriginal = !isOriginal;
    }, 1000);
  }

  // 停止标题栏闪烁
  private stopTitleBlinking() {
    if (this.titleUpdateInterval) {
      clearInterval(this.titleUpdateInterval);
      this.titleUpdateInterval = null;
    }
  }

  // 显示私聊消息通知
  public async showPrivateMessageNotification(options: {
    senderName: string;
    senderImage?: string;
    message: string;
    conversationId: string;
    onNotificationClick?: () => void;
  }) {
    // 播放音效
    await this.playNotificationSound();

    // 显示桌面通知
    await this.showDesktopNotification({
      title: `${options.senderName} 发来私聊消息`,
      body:
        options.message.length > 50
          ? options.message.substring(0, 50) + '...'
          : options.message,
      icon: options.senderImage,
      tag: `private-message-${options.conversationId}`,
      onClick: () => {
        // 聚焦窗口
        if (typeof window !== 'undefined') {
          window.focus();
        }
        options.onNotificationClick?.();
      }
    });
  }

  // 显示项目群聊消息通知
  public async showProjectMessageNotification(options: {
    senderName: string;
    senderImage?: string;
    message: string;
    projectName: string;
    conversationId: string;
    onNotificationClick?: () => void;
  }) {
    // 播放音效（音量稍低一些）
    await this.playNotificationSound();

    // 显示桌面通知
    await this.showDesktopNotification({
      title: `${options.projectName} - ${options.senderName}`,
      body:
        options.message.length > 50
          ? options.message.substring(0, 50) + '...'
          : options.message,
      icon: options.senderImage,
      tag: `project-message-${options.conversationId}`,
      onClick: () => {
        // 聚焦窗口
        if (typeof window !== 'undefined') {
          window.focus();
        }
        options.onNotificationClick?.();
      }
    });
  }

  // 清理资源
  public cleanup() {
    this.stopTitleBlinking();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  // 获取用户设置的通知偏好（可以扩展为从本地存储读取）
  public getNotificationPreferences() {
    if (typeof localStorage === 'undefined') {
      return {
        enableSound: true,
        enableDesktop: true,
        enableTitleBlink: true,
        soundVolume: 0.5
      };
    }

    try {
      const prefs = localStorage.getItem('notification-preferences');
      return prefs
        ? JSON.parse(prefs)
        : {
            enableSound: true,
            enableDesktop: true,
            enableTitleBlink: true,
            soundVolume: 0.5
          };
    } catch {
      return {
        enableSound: true,
        enableDesktop: true,
        enableTitleBlink: true,
        soundVolume: 0.5
      };
    }
  }

  // 保存用户设置的通知偏好
  public saveNotificationPreferences(preferences: {
    enableSound: boolean;
    enableDesktop: boolean;
    enableTitleBlink: boolean;
    soundVolume: number;
  }) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        'notification-preferences',
        JSON.stringify(preferences)
      );
    }
  }

  // 重置标题
  public resetTitle() {
    if (typeof document !== 'undefined') {
      document.title = this.originalTitle;
    }
    this.stopTitleBlinking();
    this.unreadCount = 0;
  }
}

// 导出单例实例
export const notificationService = NotificationService.getInstance();
