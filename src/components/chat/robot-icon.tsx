'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { useThemeConfig } from '@/components/active-theme';

interface RobotIconProps {
  size?: number;
  className?: string;
  isSnappedToEdge?: boolean;
  isDragging?: boolean;
  snappedSide?: 'left' | 'right' | null;
}

export const RobotIcon: React.FC<RobotIconProps> = ({
  size = 24,
  className,
  isSnappedToEdge = false,
  isDragging = false,
  snappedSide = null
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const { theme } = useTheme();
  const { activeTheme } = useThemeConfig();

  // 根据主题获取颜色
  const getThemeColors = () => {
    const isDark = theme === 'dark';

    // 根据活跃主题获取主色调
    let primaryColor = '#000000';
    let backgroundColor = '#ffffff';
    let accentColor = '#666666';

    if (isDark) {
      backgroundColor = '#1a1a1a';
      primaryColor = '#ffffff';
      accentColor = '#cccccc';
    }

    // 根据主题调整主色调
    switch (activeTheme) {
      case 'blue':
      case 'blue-scaled':
        primaryColor = isDark ? '#60a5fa' : '#2563eb';
        accentColor = isDark ? '#93c5fd' : '#1d4ed8';
        break;
      case 'green':
      case 'green-scaled':
        primaryColor = isDark ? '#84cc16' : '#65a30d';
        accentColor = isDark ? '#a3e635' : '#4d7c0f';
        break;
      case 'amber':
      case 'amber-scaled':
        primaryColor = isDark ? '#f59e0b' : '#d97706';
        accentColor = isDark ? '#fbbf24' : '#b45309';
        break;
      case 'mono':
      case 'mono-scaled':
        primaryColor = isDark ? '#a3a3a3' : '#525252';
        accentColor = isDark ? '#d4d4d4' : '#404040';
        break;
      default:
        primaryColor = isDark ? '#a3a3a3' : '#525252';
        accentColor = isDark ? '#d4d4d4' : '#404040';
    }

    return {
      primary: primaryColor,
      background: backgroundColor,
      accent: accentColor
    };
  };

  const colors = getThemeColors();

  // 眨眼动画效果
  useEffect(() => {
    const blinkInterval = setInterval(
      () => {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 150);
      },
      3000 + Math.random() * 2000
    ); // 3-5秒随机间隔

    return () => clearInterval(blinkInterval);
  }, []);

  return (
    <motion.div
      className={cn('relative flex items-center justify-center', className)}
      animate={{
        x: isSnappedToEdge
          ? snappedSide === 'left'
            ? -size * 0.85
            : size * 0.6
          : 0, // 贴边时根据方向移动，左侧缩进更多
        scaleX: snappedSide === 'left' ? -1 : 1, // 贴边到左侧时翻转
        rotate: isDragging ? 8 : 0,
        scale: isDragging ? 1.1 : 1
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className='relative z-10'
      >
        {/* 机器人头部外框 */}
        <motion.rect
          x='6'
          y='4'
          width='12'
          height='10'
          rx='3'
          fill={colors.background}
          stroke={colors.primary}
          strokeWidth='2'
          animate={{
            x: isSnappedToEdge ? 6 : 6,
            y: isSnappedToEdge ? 4 : 4,
            width: isSnappedToEdge ? 12 : 12,
            height: isSnappedToEdge ? 10 : 10
          }}
          transition={{ duration: 0.3 }}
        />

        {/* 机器人头部内部区域 */}
        <motion.rect
          x='7'
          y='5.5'
          width='10'
          height='7'
          rx='2'
          fill={colors.primary}
          animate={{
            opacity: isSnappedToEdge ? 1 : 1
          }}
          transition={{ duration: 0.3 }}
        />

        {/* 机器人耳朵/侧面装饰 */}
        <motion.circle
          cx='4'
          cy='9'
          r='2'
          fill={colors.primary}
          animate={{
            opacity: isSnappedToEdge ? 0 : 1,
            x: isSnappedToEdge ? -2 : 0
          }}
          transition={{ duration: 0.3 }}
        />
        <motion.circle
          cx='20'
          cy='9'
          r='2'
          fill={colors.primary}
          animate={{
            opacity: isSnappedToEdge ? 0 : 1,
            x: isSnappedToEdge ? 2 : 0
          }}
          transition={{ duration: 0.3 }}
        />

        {/* 头顶装饰点 */}
        <motion.circle
          cx='15'
          cy='5'
          r='0.8'
          fill={colors.primary}
          animate={{
            opacity: isSnappedToEdge ? 1 : 1
          }}
          transition={{ duration: 0.3 }}
        />
        <motion.circle
          cx='17'
          cy='5.5'
          r='0.5'
          fill={colors.primary}
          animate={{
            opacity: isSnappedToEdge ? 1 : 1
          }}
          transition={{ duration: 0.3 }}
        />

        {/* 左眼外圈 */}
        <motion.circle
          cx='10'
          cy='8.5'
          r={isBlinking ? '0.2' : '1.8'}
          fill={colors.background}
          stroke={colors.accent}
          strokeWidth='0.5'
          animate={{
            r: isBlinking ? 0.2 : 1.8,
            scaleY: isBlinking ? 0.1 : 1
          }}
          transition={{ duration: isBlinking ? 0.1 : 0.3 }}
        />

        {/* 左眼瞳孔 */}
        <motion.circle
          cx='10'
          cy='8.5'
          r={isBlinking ? '0.1' : '1.2'}
          fill={colors.primary}
          animate={{
            r: isBlinking ? 0.1 : 1.2,
            scaleY: isBlinking ? 0.1 : 1
          }}
          transition={{ duration: isBlinking ? 0.1 : 0.3 }}
        />

        {/* 右眼外圈 */}
        <motion.circle
          cx='14'
          cy='8.5'
          r={isBlinking ? '0.2' : '1.8'}
          fill={colors.background}
          stroke={colors.accent}
          strokeWidth='0.5'
          animate={{
            r: isBlinking ? 0.2 : 1.8,
            scaleY: isBlinking ? 0.1 : 1
          }}
          transition={{ duration: isBlinking ? 0.1 : 0.3 }}
        />

        {/* 右眼瞳孔 */}
        <motion.circle
          cx='14'
          cy='8.5'
          r={isBlinking ? '0.1' : '1.2'}
          fill={colors.primary}
          animate={{
            r: isBlinking ? 0.1 : 1.2,
            scaleY: isBlinking ? 0.1 : 1
          }}
          transition={{ duration: isBlinking ? 0.1 : 0.3 }}
        />

        {/* 嘴巴 */}
        <motion.rect
          x='10'
          y='11'
          width='4'
          height='1.5'
          rx='0.5'
          fill={colors.background}
          stroke={colors.accent}
          strokeWidth='0.5'
          animate={{
            opacity: isSnappedToEdge ? 1 : 1
          }}
          transition={{ duration: 0.3 }}
        />

        {/* 机器人身体 */}
        <motion.rect
          x='8'
          y='14'
          width='8'
          height='7'
          rx='2'
          fill={colors.primary}
          stroke={colors.primary}
          strokeWidth='2'
          animate={{
            opacity: isSnappedToEdge ? 0 : 1,
            y: isSnappedToEdge ? 16 : 14
          }}
          transition={{ duration: 0.3 }}
        />

        {/* 胸前屏幕 */}
        <motion.rect
          x='9.5'
          y='16'
          width='5'
          height='3'
          rx='0.5'
          fill={colors.background}
          stroke={colors.accent}
          strokeWidth='0.5'
          animate={{
            opacity: isSnappedToEdge ? 0 : 1
          }}
          transition={{ duration: 0.3 }}
        />

        {/* 胸前按钮 */}
        <motion.circle
          cx='13.5'
          cy='19.5'
          r='0.3'
          fill={colors.background}
          animate={{
            opacity: isSnappedToEdge ? 0 : 1
          }}
          transition={{ duration: 0.3 }}
        />

        {/* 左手臂 */}
        <motion.rect
          x='5'
          y='15'
          width='2.5'
          height='5'
          rx='1.25'
          fill={colors.primary}
          animate={{
            opacity: isSnappedToEdge ? 0 : 1
          }}
          transition={{ duration: 0.3 }}
        />

        {/* 右手臂 */}
        <motion.rect
          x='16.5'
          y='15'
          width='2.5'
          height='5'
          rx='1.25'
          fill={colors.primary}
          animate={{
            opacity: isSnappedToEdge ? 0 : 1
          }}
          transition={{ duration: 0.3 }}
        />

        {/* 左手爪 */}
        <motion.g
          animate={{
            opacity: isSnappedToEdge ? 0 : 1
          }}
          transition={{ duration: 0.3 }}
        >
          <path
            d='M 5 20 L 4 21 L 5 22'
            stroke={colors.primary}
            strokeWidth='1.5'
            fill='none'
            strokeLinecap='round'
          />
          <path
            d='M 6 20 L 5 21 L 6 22'
            stroke={colors.primary}
            strokeWidth='1.5'
            fill='none'
            strokeLinecap='round'
          />
          <path
            d='M 7 20 L 6 21 L 7 22'
            stroke={colors.primary}
            strokeWidth='1.5'
            fill='none'
            strokeLinecap='round'
          />
        </motion.g>

        {/* 右手爪 */}
        <motion.g
          animate={{
            opacity: isSnappedToEdge ? 0 : 1
          }}
          transition={{ duration: 0.3 }}
        >
          <path
            d='M 17 20 L 18 21 L 17 22'
            stroke={colors.primary}
            strokeWidth='1.5'
            fill='none'
            strokeLinecap='round'
          />
          <path
            d='M 18 20 L 19 21 L 18 22'
            stroke={colors.primary}
            strokeWidth='1.5'
            fill='none'
            strokeLinecap='round'
          />
          <path
            d='M 19 20 L 20 21 L 19 22'
            stroke={colors.primary}
            strokeWidth='1.5'
            fill='none'
            strokeLinecap='round'
          />
        </motion.g>

        {/* 腿部 */}
        <motion.g
          animate={{
            opacity: isSnappedToEdge ? 0 : 1
          }}
          transition={{ duration: 0.3 }}
        >
          <rect
            x='9.5'
            y='21'
            width='2'
            height='2'
            fill={colors.background}
            stroke={colors.primary}
            strokeWidth='1'
          />
          <rect
            x='12.5'
            y='21'
            width='2'
            height='2'
            fill={colors.background}
            stroke={colors.primary}
            strokeWidth='1'
          />
        </motion.g>
      </svg>
    </motion.div>
  );
};
