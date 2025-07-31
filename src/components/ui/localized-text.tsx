'use client';

import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface LocalizedTextProps {
  children: ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  mono?: boolean;
}

/**
 * Component that automatically applies language-appropriate fonts
 */
export function LocalizedText({
  children,
  className,
  as: Component = 'span',
  weight = 'normal',
  mono = false
}: LocalizedTextProps) {
  const locale = useLocale();

  const getFontClass = () => {
    const isZh = locale === 'zh' || locale === 'zh-CN';

    if (mono) {
      return isZh ? 'font-mono-chinese' : 'font-mono-english';
    }

    return isZh ? 'font-chinese' : 'font-english';
  };

  const getWeightClass = () => {
    const weightMap = {
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold'
    };
    return weightMap[weight];
  };

  return (
    <Component className={cn(getFontClass(), getWeightClass(), className)}>
      {children}
    </Component>
  );
}

/**
 * Hook to get current font classes based on locale
 */
export function useLocalizedFontClass() {
  const locale = useLocale();
  const isZh = locale === 'zh' || locale === 'zh-CN';

  return {
    sans: isZh ? 'font-chinese' : 'font-english',
    mono: isZh ? 'font-mono-chinese' : 'font-mono-english',
    locale,
    isZh
  };
}
