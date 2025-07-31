# 字体系统文档 / Font System Documentation

## 概述 / Overview

本项目实现了基于语言的自动字体切换系统，为中文和英文提供了优化的字体显示。

This project implements an automatic language-based font switching system that provides optimized font display for Chinese and English.

## 实现方式 / Implementation

### CSS 变量 / CSS Variables

项目在 `globals.css` 中定义了语言特定的字体变量：

```css
:root {
  /* 英文字体 / English fonts */
  --font-sans-en: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --font-mono-en: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  
  /* 中文字体 / Chinese fonts */
  --font-sans-zh: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', 'Source Han Sans SC', 'Noto Sans CJK SC', 'WenQuanYi Micro Hei', sans-serif;
  --font-mono-zh: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', 'Menlo', 'Consolas', '思源黑体', 'Noto Sans Mono CJK SC', monospace;
}
```

### 语言检测 / Language Detection

字体根据 HTML `lang` 属性自动切换：

```css
/* 中文语言设置 */
html[lang="zh"], html[lang="zh-CN"] {
  --font-sans: var(--font-sans-zh);
  --font-mono: var(--font-mono-zh);
}

/* 英文语言设置 */
html[lang="en"] {
  --font-sans: var(--font-sans-en);
  --font-mono: var(--font-mono-en);
}
```

## 使用方法 / Usage

### 1. LocalizedText 组件 / LocalizedText Component

推荐使用 `LocalizedText` 组件来自动应用合适的字体：

```tsx
import { LocalizedText } from '@/components/ui/localized-text';

// 基本使用
<LocalizedText>这是一段文本 / This is some text</LocalizedText>

// 指定HTML标签
<LocalizedText as="h1">标题 / Heading</LocalizedText>

// 指定字重
<LocalizedText weight="bold">粗体文本 / Bold text</LocalizedText>

// 等宽字体
<LocalizedText mono>代码文本 / Code text</LocalizedText>

// 自定义样式
<LocalizedText className="text-lg text-blue-500">
  自定义样式 / Custom styling
</LocalizedText>
```

### 2. useLocalizedFontClass Hook

在组件中获取字体类名：

```tsx
import { useLocalizedFontClass } from '@/components/ui/localized-text';

function MyComponent() {
  const { sans, mono, isZh, locale } = useLocalizedFontClass();
  
  return (
    <div className={sans}>
      当前语言: {locale}
      {isZh ? '中文模式' : 'English mode'}
    </div>
  );
}
```

### 3. useLocalizedFont Hook

从 `/lib/fonts.ts` 获取字体信息：

```tsx
import { useLocalizedFont } from '@/lib/fonts';

function MyComponent() {
  const { fontClass, locale } = useLocalizedFont();
  
  return <div className={fontClass}>文本内容</div>;
}
```

### 4. 直接使用 CSS 类 / Direct CSS Classes

也可以直接使用 CSS 类：

```tsx
// 自动根据语言选择字体
<div className="font-sans">自动字体</div>

// 强制使用特定语言的字体
<div className="font-chinese">强制中文字体</div>
<div className="font-english">强制英文字体</div>
<div className="font-mono-chinese">中文等宽字体</div>
<div className="font-mono-english">英文等宽字体</div>
```

## 字体优化 / Font Optimization

### 中文优化 / Chinese Optimization

- 增加字母间距：`letter-spacing: 0.02em`
- 优化行高：`line-height: 1.6`
- 标题字重：`font-weight: 500`

### 英文优化 / English Optimization

- 紧缩字母间距：`letter-spacing: -0.01em`
- 标准行高：`line-height: 1.5`

## 测试页面 / Test Page

项目包含一个字体测试页面，可以查看字体切换效果：

访问路径：`/test-fonts`

The project includes a font test page to see font switching effects:

Access path: `/test-fonts`

## 支持的语言 / Supported Languages

- `en` - English
- `zh` - 简体中文 (Simplified Chinese)
- `zh-CN` - 简体中文 (Simplified Chinese)

## 浏览器兼容性 / Browser Compatibility

本字体系统使用 CSS 变量和现代字体属性，支持：

- Chrome 49+
- Firefox 31+
- Safari 9.1+
- Edge 16+

## 自定义字体 / Custom Fonts

如需添加自定义字体，可以修改 `globals.css` 中的字体变量：

```css
:root {
  --font-sans-en: 'Your Custom Font', system-ui, sans-serif;
  --font-sans-zh: 'Your Chinese Font', 'PingFang SC', sans-serif;
}
```

## 注意事项 / Notes

1. 字体加载可能影响页面性能，建议使用系统字体作为回退
2. 确保字体在目标操作系统上可用
3. 考虑使用 `font-display: swap` 优化字体加载体验
4. 测试不同设备和操作系统上的字体显示效果