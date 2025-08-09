# Profile 模块

## 模块概述
用户个人资料模块，提供用户信息管理、偏好设置、安全配置、活动记录等功能。

## 主要功能
- 👤 个人信息编辑
- 🖼️ 头像上传和裁剪
- 🔐 密码和安全设置
- 🌐 语言和地区偏好
- 🎨 主题和界面设置
- 🔔 通知偏好配置
- 📊 个人活动统计
- 🔗 社交账号绑定
- 📱 设备管理
- 🗂️ 数据导出和备份

## 技术栈
- **React**: 前端框架
- **React Hook Form**: 表单管理
- **Zod**: 数据验证
- **Clerk**: 用户认证
- **shadcn/ui**: UI 组件库
- **React Cropper**: 图片裁剪

## 文件结构
```
profile/
├── page.tsx                    # 个人资料主页
├── components/
│   ├── ProfileForm.tsx        # 个人信息表单
│   ├── AvatarUpload.tsx       # 头像上传组件
│   ├── SecuritySettings.tsx   # 安全设置
│   ├── PreferencesPanel.tsx   # 偏好设置面板
│   ├── ActivityHistory.tsx    # 活动历史
│   ├── NotificationSettings.tsx # 通知设置
│   └── DataExport.tsx         # 数据导出
├── hooks/
│   ├── useProfile.ts          # 个人资料管理
│   ├── usePreferences.ts      # 偏好设置
│   └── useActivity.ts         # 活动记录
└── types/
    └── profile.ts             # 个人资料类型
```

## 数据模型
```typescript
interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  displayName: string
  avatar?: string
  bio?: string
  location?: string
  website?: string
  phone?: string
  timezone: string
  language: string
  theme: 'light' | 'dark' | 'system'
  createdAt: Date
  updatedAt: Date
}

interface UserPreferences {
  notifications: {
    email: boolean
    push: boolean
    desktop: boolean
    sound: boolean
  }
  privacy: {
    profileVisibility: 'public' | 'private' | 'team'
    activityVisibility: boolean
    onlineStatus: boolean
  }
  interface: {
    theme: string
    language: string
    dateFormat: string
    timeFormat: '12h' | '24h'
  }
}
```

## 核心功能

### 头像管理
- 图片上传和预览
- 在线裁剪和调整
- 多种尺寸生成
- 默认头像生成

### 安全设置
- 密码修改
- 两步验证设置
- 登录设备管理
- 安全日志查看

### 偏好配置
- 界面主题切换
- 语言和地区设置
- 通知偏好管理
- 隐私设置控制

## 开发注意事项
- 表单验证和错误处理
- 图片上传大小和格式限制
- 敏感信息加密存储
- 用户隐私保护
- 数据同步和备份

## API 端点
- `/api/profile` - 个人资料 CRUD
- `/api/profile/avatar` - 头像上传
- `/api/profile/preferences` - 偏好设置
- `/api/profile/security` - 安全设置
- `/api/profile/activity` - 活动记录
- `/api/profile/export` - 数据导出