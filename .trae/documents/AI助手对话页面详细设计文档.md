// **tests**/components/MessageComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { MessageComponent } from '../MessageComponent';

describe('MessageComponent', () => {
const mockMessage = {
id: '1',
role: 'user' as const,
content: 'Hello, AI!',
timestamp: new Date('2024-01-01T10:00:00Z')
};

it('renders user message correctly', () => {
render(<MessageComponent {...mockMessage} />);

    expect(screen.getByText('您')).toBeInTheDocument();
    expect(screen.getByText('Hello, AI!')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();

});

it('renders assistant message correctly', () => {
const assistantMessage = {
...mockMessage,
role: 'assistant' as const
};

    render(<MessageComponent {...assistantMessage} />);

    expect(screen.getByText('AI助手')).toBeInTheDocument();
    expect(screen.getByTestId('bot-icon')).toBeInTheDocument();

});
});

// **tests**/api/chat.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/ai/chat';

describe('/api/ai/chat', () => {
it('should handle chat message successfully', async () => {
const { req, res } = createMocks({
method: 'POST',
body: {
message: 'Hello',
conversationId: 'test-conversation'
}
});

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('messageId');
    expect(data.status).toBe('processing');

});

it('should handle unauthorized requests', async () => {
const { req, res } = createMocks({
method: 'POST',
body: { message: 'Hello' }
});

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);

});
});

# .env.local

# AI服务配置

OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
AI_MODEL_DEFAULT=gpt-4
AI_TEMPERATURE=0.7

# Redis配置

REDIS_URL=redis://localhost:6379

# WebSocket配置

WS_PORT=3001
WS_CORS_ORIGIN=http://localhost:3000

# 监控配置

SENTRY_DSN=https://...
METRICS_ENDPOINT=http://localhost:9090

# Dockerfile.ai-service

FROM node:18-alpine

WORKDIR /app

# 安装依赖

COPY package\*.json ./
RUN npm ci --only=production

# 复制源码

COPY . .

# 构建应用

RUN npm run build

# 暴露端口

EXPOSE 3000 3001

# 启动命令

CMD ["npm", "start"]

// 扩展键盘快捷键功能
interface ExtendedKeyboardShortcuts extends KeyboardShortcuts {
searchHistory: string;
exportChat: string;
toggleSettings: string;
voiceInput: string;
attachFile: string;
quickReply: string;
regenerateResponse: string;
copyLastMessage: string;
toggleFullscreen: string;
switchModel: string;
}

const useExtendedKeyboardShortcuts = ({
onToggleChat,
onNewConversation,
onFocusInput,
onSendMessage,
onCloseChat,
onSearchHistory,
onExportChat,
onToggleSettings,
onVoiceInput,
onAttachFile,
onQuickReply,
onRegenerateResponse,
onCopyLastMessage,
onToggleFullscreen,
onSwitchModel
}: {
onToggleChat: () => void;
onNewConversation: () => void;
onFocusInput: () => void;
onSendMessage: () => void;
onCloseChat: () => void;
onSearchHistory: () => void;
onExportChat: () => void;
onToggleSettings: () => void;
onVoiceInput: () => void;
onAttachFile: () => void;
onQuickReply: () => void;
onRegenerateResponse: () => void;
onCopyLastMessage: () => void;
onToggleFullscreen: () => void;
onSwitchModel: () => void;
}) => {
const shortcuts: ExtendedKeyboardShortcuts = {
toggleChat: 'Ctrl+K',
newConversation: 'Ctrl+Shift+N',
focusInput: 'Ctrl+/',
sendMessage: 'Enter',
closeChat: 'Escape',
searchHistory: 'Ctrl+H',
exportChat: 'Ctrl+E',
toggleSettings: 'Ctrl+,',
voiceInput: 'Ctrl+Shift+V',
attachFile: 'Ctrl+Shift+A',
quickReply: 'Ctrl+Q',
regenerateResponse: 'Ctrl+R',
copyLastMessage: 'Ctrl+Shift+C',
toggleFullscreen: 'F11',
switchModel: 'Ctrl+M'
};

useEffect(() => {
const handleKeyDown = (event: KeyboardEvent) => {
const isInputFocused = document.activeElement?.tagName === 'INPUT' ||
document.activeElement?.tagName === 'TEXTAREA';

      // Ctrl/Cmd + K: 切换聊天窗口
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        onToggleChat();
        return;
      }

      // Ctrl/Cmd + Shift + N: 新建对话
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'N') {
        event.preventDefault();
        onNewConversation();
        return;
      }

      // Ctrl/Cmd + /: 聚焦输入框
      if ((event.ctrlKey || event.metaKey) && event.key === '/') {
        event.preventDefault();
        onFocusInput();
        return;
      }

      // Ctrl/Cmd + H: 搜索历史
      if ((event.ctrlKey || event.metaKey) && event.key === 'h' && !isInputFocused) {
        event.preventDefault();
        onSearchHistory();
        return;
      }

      // Ctrl/Cmd + E: 导出对话
      if ((event.ctrlKey || event.metaKey) && event.key === 'e' && !isInputFocused) {
        event.preventDefault();
        onExportChat();
        return;
      }

      // Ctrl/Cmd + ,: 切换设置
      if ((event.ctrlKey || event.metaKey) && event.key === ',' && !isInputFocused) {
        event.preventDefault();
        onToggleSettings();
        return;
      }

      // Ctrl/Cmd + Shift + V: 语音输入
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'V') {
        event.preventDefault();
        onVoiceInput();
        return;
      }

      // Ctrl/Cmd + Shift + A: 附件上传
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        onAttachFile();
        return;
      }

      // Ctrl/Cmd + Q: 快速回复
      if ((event.ctrlKey || event.metaKey) && event.key === 'q' && !isInputFocused) {
        event.preventDefault();
        onQuickReply();
        return;
      }

      // Ctrl/Cmd + R: 重新生成回复
      if ((event.ctrlKey || event.metaKey) && event.key === 'r' && !isInputFocused) {
        event.preventDefault();
        onRegenerateResponse();
        return;
      }

      // Ctrl/Cmd + Shift + C: 复制最后一条消息
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C' && !isInputFocused) {
        event.preventDefault();
        onCopyLastMessage();
        return;
      }

      // Ctrl/Cmd + M: 切换模型
      if ((event.ctrlKey || event.metaKey) && event.key === 'm' && !isInputFocused) {
        event.preventDefault();
        onSwitchModel();
        return;
      }

      // F11: 切换全屏
      if (event.key === 'F11') {
        event.preventDefault();
        onToggleFullscreen();
        return;
      }

      // Enter: 发送消息 (在输入框聚焦时)
      if (event.key === 'Enter' && !event.shiftKey) {
        const target = event.target as HTMLElement;
        if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
          event.preventDefault();
          onSendMessage();
          return;
        }
      }

      // Escape: 关闭聊天窗口
      if (event.key === 'Escape') {
        onCloseChat();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);

}, [onToggleChat, onNewConversation, onFocusInput, onSendMessage, onCloseChat,
onSearchHistory, onExportChat, onToggleSettings, onVoiceInput, onAttachFile,
onQuickReply, onRegenerateResponse, onCopyLastMessage, onToggleFullscreen, onSwitchModel]);

return shortcuts;
};

// 快捷键帮助组件
const KeyboardShortcutsHelp: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
isOpen,
onClose
}) => {
const shortcuts = {
toggleChat: 'Ctrl+K',
newConversation: 'Ctrl+Shift+N',
focusInput: 'Ctrl+/',
sendMessage: 'Enter',
closeChat: 'Escape',
searchHistory: 'Ctrl+H',
exportChat: 'Ctrl+E',
toggleSettings: 'Ctrl+,',
voiceInput: 'Ctrl+Shift+V',
attachFile: 'Ctrl+Shift+A',
quickReply: 'Ctrl+Q',
regenerateResponse: 'Ctrl+R',
copyLastMessage: 'Ctrl+Shift+C',
toggleFullscreen: 'F11',
switchModel: 'Ctrl+M'
};

if (!isOpen) return null;

const shortcutGroups = [
{
title: '基本操作',
shortcuts: [
{ key: shortcuts.toggleChat, description: '切换聊天窗口' },
{ key: shortcuts.newConversation, description: '新建对话' },
{ key: shortcuts.focusInput, description: '聚焦输入框' },
{ key: shortcuts.sendMessage, description: '发送消息' },
{ key: shortcuts.closeChat, description: '关闭聊天窗口' }
]
},
{
title: '界面控制',
shortcuts: [
{ key: shortcuts.toggleSettings, description: '打开设置' },
{ key: shortcuts.toggleFullscreen, description: '切换全屏' },
{ key: shortcuts.switchModel, description: '切换AI模型' }
]
},
{
title: '高级功能',
shortcuts: [
{ key: shortcuts.voiceInput, description: '语音输入' },
{ key: shortcuts.attachFile, description: '附件上传' },
{ key: shortcuts.quickReply, description: '快速回复' },
{ key: shortcuts.regenerateResponse, description: '重新生成回复' }
]
},
{
title: '历史和导出',
shortcuts: [
{ key: shortcuts.searchHistory, description: '搜索历史' },
{ key: shortcuts.exportChat, description: '导出对话' },
{ key: shortcuts.copyLastMessage, description: '复制最后消息' }
]
}
];

return (

<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
<div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
<div className="flex items-center justify-between mb-6">
<h3 className="text-lg font-semibold">键盘快捷键</h3>
<Button variant="ghost" size="sm" onClick={onClose}>
<X className="w-4 h-4" />
</Button>
</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {shortcutGroups.map((group, index) => (
            <div key={index} className="space-y-3">
              <h4 className="font-medium text-gray-900">{group.title}</h4>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{shortcut.description}</span>
                    <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            提示：按 <kbd className="px-1 py-0.5 bg-gray-100 border rounded text-xs">?</kbd> 可随时打开此帮助
          </p>
        </div>
      </div>
    </div>

);
};

// 快捷键状态指示器
const ShortcutIndicator: React.FC<{ shortcut: string; description: string }> = ({
shortcut,
description
}) => {
const [isVisible, setIsVisible] = useState(false);

useEffect(() => {
const timer = setTimeout(() => setIsVisible(false), 2000);
return () => clearTimeout(timer);
}, [isVisible]);

return (
<AnimatePresence>
{isVisible && (
<motion.div
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -20 }}
className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black text-white px-3 py-2 rounded-lg text-sm z-50" >
<kbd className="bg-gray-700 px-1 py-0.5 rounded text-xs mr-2">{shortcut}</kbd>
{description}
</motion.div>
)}
</AnimatePresence>
);
};

// 自定义快捷键设置
const CustomShortcutSettings: React.FC = () => {
const [customShortcuts, setCustomShortcuts] = useState<Record<string, string>>({});
const [editingShortcut, setEditingShortcut] = useState<string | null>(null);

const defaultShortcuts = {
toggleChat: 'Ctrl+K',
newConversation: 'Ctrl+Shift+N',
focusInput: 'Ctrl+/',
sendMessage: 'Enter',
closeChat: 'Escape'
};

const handleShortcutChange = (action: string, newShortcut: string) => {
setCustomShortcuts(prev => ({
...prev,
[action]: newShortcut
}));
};

const resetToDefaults = () => {
setCustomShortcuts({});
};

return (

<div className="space-y-4">
<div className="flex items-center justify-between">
<h4 className="font-medium">自定义快捷键</h4>
<Button variant="outline" size="sm" onClick={resetToDefaults}>
重置默认
</Button>
</div>

      <div className="space-y-3">
        {Object.entries(defaultShortcuts).map(([action, defaultKey]) => (
          <div key={action} className="flex items-center justify-between">
            <span className="text-sm capitalize">
              {action.replace(/([A-Z])/g, ' $1').toLowerCase()}
            </span>

            {editingShortcut === action ? (
              <div className="flex items-center gap-2">
                <Input
                  size="sm"
                  value={customShortcuts[action] || defaultKey}
                  onChange={(e) => handleShortcutChange(action, e.target.value)}
                  onBlur={() => setEditingShortcut(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setEditingShortcut(null);
                    }
                  }}
                  className="w-32"
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingShortcut(null)}
                >
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setEditingShortcut(action)}
                className="flex items-center gap-2 hover:bg-gray-100 px-2 py-1 rounded"
              >
                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
                  {customShortcuts[action] || defaultKey}
                </kbd>
                <Edit2 className="w-3 h-3 text-gray-400" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-500">
        <p>提示：使用 Ctrl/Cmd + 字母键组合，或功能键如 F1-F12</p>
        <p>避免与浏览器默认快捷键冲突</p>
      </div>
    </div>

);
};

// 快捷键冲突检测
const useShortcutConflictDetection = () => {
const [conflicts, setConflicts] = useState<string[]>([]);

const checkForConflicts = useCallback((shortcuts: Record<string, string>) => {
const browserShortcuts = [
'Ctrl+T', 'Ctrl+W', 'Ctrl+R', 'Ctrl+F', 'Ctrl+L',
'Ctrl+D', 'Ctrl+S', 'Ctrl+P', 'Ctrl+N', 'Ctrl+Shift+T'
];

    const detectedConflicts: string[] = [];

    Object.entries(shortcuts).forEach(([action, shortcut]) => {
      if (browserShortcuts.includes(shortcut)) {
        detectedConflicts.push(`${action}: ${shortcut} 与浏览器快捷键冲突`);
      }
    });

    // 检查重复快捷键
    const shortcutValues = Object.values(shortcuts);
    const duplicates = shortcutValues.filter((item, index) =>
      shortcutValues.indexOf(item) !== index
    );

    duplicates.forEach(duplicate => {
      detectedConflicts.push(`重复快捷键: ${duplicate}`);
    });

    setConflicts(detectedConflicts);

}, []);

return { conflicts, checkForConflicts };
};

// 快捷键训练模式
const ShortcutTrainingMode: React.FC = () => {
const [isTraining, setIsTraining] = useState(false);
const [currentChallenge, setCurrentChallenge] = useState<{
action: string;
description: string;
shortcut: string;
} | null>(null);
const [score, setScore] = useState(0);
const [attempts, setAttempts] = useState(0);

const challenges = [
{ action: 'toggleChat', description: '打开聊天窗口', shortcut: 'Ctrl+K' },
{ action: 'newConversation', description: '新建对话', shortcut: 'Ctrl+Shift+N' },
{ action: 'focusInput', description: '聚焦输入框', shortcut: 'Ctrl+/' },
{ action: 'exportChat', description: '导出对话', shortcut: 'Ctrl+E' },
{ action: 'searchHistory', description: '搜索历史', shortcut: 'Ctrl+H' }
];

const startTraining = () => {
setIsTraining(true);
setScore(0);
setAttempts(0);
nextChallenge();
};

const nextChallenge = () => {
const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
setCurrentChallenge(randomChallenge);
};

const handleKeyPress = useCallback((event: KeyboardEvent) => {
if (!isTraining || !currentChallenge) return;

    const pressedKey = [];
    if (event.ctrlKey || event.metaKey) pressedKey.push('Ctrl');
    if (event.shiftKey) pressedKey.push('Shift');
    if (event.altKey) pressedKey.push('Alt');
    pressedKey.push(event.key.toUpperCase());

    const pressedShortcut = pressedKey.join('+');

    if (pressedShortcut === currentChallenge.shortcut.replace('Cmd', 'Ctrl')) {
      setScore(prev => prev + 1);
      toast.success('正确！');
    } else {
      toast.error(`错误！正确答案是 ${currentChallenge.shortcut}`);
    }

    setAttempts(prev => prev + 1);

    if (attempts < 9) {
      setTimeout(nextChallenge, 1000);
    } else {
      setIsTraining(false);
      toast.success(`训练完成！得分：${score + 1}/10`);
    }

}, [isTraining, currentChallenge, score, attempts]);

useEffect(() => {
if (isTraining) {
document.addEventListener('keydown', handleKeyPress);
return () => document.removeEventListener('keydown', handleKeyPress);
}
}, [isTraining, handleKeyPress]);

return (

<div className="space-y-4">
<div className="flex items-center justify-between">
<h4 className="font-medium">快捷键训练</h4>
{!isTraining ? (
<Button onClick={startTraining}>
开始训练
</Button>
) : (
<div className="text-sm text-gray-600">
得分: {score}/{attempts + 1}
</div>
)}
</div>

      {isTraining && currentChallenge && (
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <h5 className="font-medium mb-2">请按下快捷键来：</h5>
          <p className="text-lg">{currentChallenge.description}</p>
          <div className="mt-4 text-sm text-gray-600">
            提示：正确答案是 <kbd className="bg-white px-2 py-1 rounded border">
              {currentChallenge.shortcut}
            </kbd>
          </div>
        </div>
      )}

      {!isTraining && attempts > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h5 className="font-medium mb-2">上次训练结果</h5>
          <p>得分：{score}/10</p>
          <p className="text-sm text-gray-600">
            {score >= 8 ? '优秀！' : score >= 6 ? '良好！' : '需要更多练习'}
          </p>
        </div>
      )}
    </div>

);
};

// 导出所有快捷键相关组件
export {
useExtendedKeyboardShortcuts,
KeyboardShortcutsHelp,
ShortcutIndicator,
CustomShortcutSettings,
useShortcutConflictDetection,
ShortcutTrainingMode
};

## 文档总结

### 核心特性概览

本AI助手对话页面设计文档涵盖了一个完整的、功能丰富的AI对话系统，具备以下核心特性：

#### 1. 浮动全局显示

- **全局可访问性**：在任何页面都可以通过快捷键或悬浮按钮快速调用
- **智能定位**：自动检测最佳显示位置，避免遮挡重要内容
- **响应式设计**：完美适配桌面端和移动端设备

#### 2. 智能化功能增强

- **上下文感知**：自动识别当前页面内容，提供相关建议
- **项目关联**：智能关联项目文件和代码，提供精准帮助
- **智能建议系统**：基于用户行为和历史对话提供个性化建议
- **快捷回复模板**：预设常用回复，提高交互效率
- **代码智能解析**：自动识别、高亮和执行代码片段

#### 3. 多模态交互

- **语音输入/输出**：支持语音转文字和文字转语音
- **图片识别处理**：支持图片上传、OCR识别和智能分析
- **文件附件支持**：支持多种文件格式的上传和处理

#### 4. 用户体验优化

- **个性化设置**：自定义主题、字体、布局等
- **智能通知系统**：重要消息提醒和状态更新
- **离线模式**：支持离线使用和数据同步
- **键盘快捷键**：完整的快捷键系统，包含训练模式

#### 5. 高级交互功能

- **协作分享**：支持对话分享和团队协作
- **插件扩展系统**：开放的插件架构，支持第三方扩展
- **对话历史管理**：智能分类、搜索和导出功能

#### 6. 性能与安全

- **性能监控**：实时监控系统性能和用户体验指标
- **安全防护**：端到端加密、数据脱敏和隐私保护
- **智能缓存**：优化响应速度和资源使用

#### 7. 分析与监控

- **用户行为分析**：深入了解用户使用模式
- **实时监控告警**：系统健康状态监控和异常告警
- **数据可视化**：直观的数据展示和分析报告

### 技术架构亮点

#### 前端技术栈

- **React + TypeScript**：类型安全的现代前端开发
- **Tailwind CSS**：高效的样式管理
- **Framer Motion**：流畅的动画效果
- **React Hook Form**：高性能表单处理
- **Zustand**：轻量级状态管理

#### 后端集成

- **RESTful API**：标准化的接口设计
- **WebSocket**：实时通信支持
- **文件上传处理**：多格式文件支持
- **AI模型集成**：灵活的AI服务接入

#### 数据管理

- **本地存储**：IndexedDB + localStorage混合存储
- **云端同步**：跨设备数据同步
- **数据加密**：敏感信息保护

### 开发实施建议

#### 第一阶段：核心功能（MVP）

1. 基础浮动窗口和对话功能
2. 简单的键盘快捷键支持
3. 基本的对话历史管理
4. 移动端适配

#### 第二阶段：智能化增强

1. 上下文感知和项目关联
2. 智能建议系统
3. 代码解析和执行
4. 个性化设置

#### 第三阶段：高级功能

1. 多模态交互（语音、图片）
2. 协作和分享功能
3. 插件扩展系统
4. 高级分析和监控

### 性能优化策略

1. **懒加载**：按需加载组件和功能模块
2. **虚拟滚动**：处理大量对话历史
3. **防抖节流**：优化用户输入响应
4. **缓存策略**：智能缓存常用数据
5. **代码分割**：减少初始加载时间

### 可访问性考虑

1. **键盘导航**：完整的键盘操作支持
2. **屏幕阅读器**：ARIA标签和语义化HTML
3. **高对比度**：支持高对比度主题
4. **字体缩放**：支持字体大小调整
5. **色彩无障碍**：色盲友好的设计

### 安全性措施

1. **数据加密**：传输和存储加密
2. **输入验证**：防止XSS和注入攻击
3. **权限控制**：细粒度的功能权限
4. **隐私保护**：数据最小化原则
5. **审计日志**：操作记录和追踪

### 测试策略

1. **单元测试**：组件和函数级别测试
2. **集成测试**：功能模块集成测试
3. **端到端测试**：完整用户流程测试
4. **性能测试**：响应时间和资源使用测试
5. **可访问性测试**：无障碍功能验证

### 部署和维护

1. **CI/CD流水线**：自动化构建和部署
2. **监控告警**：实时系统状态监控
3. **错误追踪**：异常捕获和分析
4. **性能监控**：用户体验指标跟踪
5. **版本管理**：渐进式功能发布

### 未来扩展方向

1. **AI能力增强**：更强大的AI模型集成
2. **多语言支持**：国际化和本地化
3. **企业级功能**：团队管理和权限控制
4. **API开放**：第三方集成能力
5. **移动应用**：原生移动端应用

---

**文档版本**：v1.0  
**最后更新**：2024年12月  
**文档状态**：完整设计方案  
**下一步**：开始技术实现和原型开发
