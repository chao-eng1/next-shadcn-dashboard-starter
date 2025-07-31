import { useLocale } from 'next-intl';

/**
 * Custom hook to get language-specific font classes
 */
export function useLocalizedFont() {
  const locale = useLocale();

  // Define font classes based on locale
  const getFontClass = () => {
    switch (locale) {
      case 'zh':
      case 'zh-CN':
        return 'font-chinese';
      case 'en':
      default:
        return 'font-english';
    }
  };

  return {
    fontClass: getFontClass(),
    locale
  };
}

/**
 * Get font class based on locale string
 */
export function getFontClassByLocale(locale: string) {
  switch (locale) {
    case 'zh':
    case 'zh-CN':
      return 'font-chinese';
    case 'en':
    default:
      return 'font-english';
  }
}

/**
 * Font weight utilities for different languages
 */
export const fontWeights = {
  chinese: {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  },
  english: {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  }
};
