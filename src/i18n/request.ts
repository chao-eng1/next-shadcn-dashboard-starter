import { getRequestConfig } from 'next-intl/server';
import { locales } from '../../i18n.config';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Ensure that the incoming locale is valid
  if (!locale || !locales.includes(locale as any)) {
    locale = 'zh'; // Default to Chinese
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
