'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { LocalizedText } from '@/components/ui/localized-text';
import { cn } from '@/lib/utils';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' }
];

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('language');
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (newLocale: string) => {
    const currentPath = window.location.pathname;
    const segments = currentPath.split('/');

    // Remove current locale if present
    if (segments[1] === locale) {
      segments.splice(1, 1);
    }

    // Add new locale
    segments.splice(1, 0, newLocale);
    const newPath = segments.join('/');

    router.push(newPath);
    setIsOpen(false);
  };

  const currentLanguage = languages.find((lang) => lang.code === locale);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='sm'
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-sm font-medium',
            className
          )}
        >
          <Globe className='h-4 w-4' />
          <LocalizedText className='hidden md:inline'>
            {currentLanguage?.flag} {currentLanguage?.name}
          </LocalizedText>
          <span className='md:hidden'>{currentLanguage?.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-40'>
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={cn(
              'flex items-center gap-2',
              locale === language.code && 'bg-accent'
            )}
          >
            <span className='text-lg'>{language.flag}</span>
            <LocalizedText>{language.name}</LocalizedText>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
