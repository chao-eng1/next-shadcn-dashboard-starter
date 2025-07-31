'use client';

import { useTranslations, useLocale } from 'next-intl';
import {
  LocalizedText,
  useLocalizedFontClass
} from '@/components/ui/localized-text';
import { useLocalizedFont } from '@/lib/fonts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestFontsPage() {
  const t = useTranslations('common');
  const locale = useLocale();
  const { fontClass } = useLocalizedFont();
  const { sans, mono, isZh } = useLocalizedFontClass();

  return (
    <div className='container mx-auto space-y-6 p-6'>
      <Card>
        <CardHeader>
          <CardTitle>字体测试页面 / Font Test Page</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <p className='text-muted-foreground mb-2 text-sm'>
              当前语言 / Current Locale: <strong>{locale}</strong>
            </p>
            <p className='text-muted-foreground mb-2 text-sm'>
              检测到的字体类 / Detected Font Class: <strong>{fontClass}</strong>
            </p>
            <p className='text-muted-foreground mb-2 text-sm'>
              是否为中文 / Is Chinese:{' '}
              <strong>{isZh ? '是 / Yes' : '否 / No'}</strong>
            </p>
          </div>

          <div className='space-y-4'>
            <div>
              <h3 className='mb-2 text-lg font-semibold'>
                默认文本样式 / Default Text Style
              </h3>
              <p className='text-base'>
                这是一段测试文本。The quick brown fox jumps over the lazy dog.
                中文字体应该显示为思源黑体或微软雅黑等中文字体，而英文字体应该显示为系统默认的西文字体。
              </p>
            </div>

            <div>
              <h3 className='mb-2 text-lg font-semibold'>
                使用 LocalizedText 组件 / Using LocalizedText Component
              </h3>
              <LocalizedText className='text-base'>
                这是使用 LocalizedText 组件的文本。This text uses the
                LocalizedText component. 应该根据当前语言自动选择合适的字体。
              </LocalizedText>
            </div>

            <div>
              <h3 className='mb-2 text-lg font-semibold'>
                不同字重测试 / Different Font Weights
              </h3>
              <div className='space-y-2'>
                <LocalizedText weight='light'>
                  轻字体 / Light Weight
                </LocalizedText>
                <LocalizedText weight='normal'>
                  正常字体 / Normal Weight
                </LocalizedText>
                <LocalizedText weight='medium'>
                  中等字体 / Medium Weight
                </LocalizedText>
                <LocalizedText weight='semibold'>
                  半粗字体 / Semibold Weight
                </LocalizedText>
                <LocalizedText weight='bold'>
                  粗字体 / Bold Weight
                </LocalizedText>
              </div>
            </div>

            <div>
              <h3 className='mb-2 text-lg font-semibold'>
                等宽字体测试 / Monospace Font Test
              </h3>
              <LocalizedText mono className='bg-muted rounded p-2 text-base'>
                const message = '这是代码示例 / This is code example';
                console.log(message);
              </LocalizedText>
            </div>

            <div>
              <h3 className='mb-2 text-lg font-semibold'>
                标题测试 / Heading Test
              </h3>
              <LocalizedText as='h1' className='text-4xl font-bold'>
                一级标题 / H1 Heading
              </LocalizedText>
              <LocalizedText as='h2' className='text-3xl font-semibold'>
                二级标题 / H2 Heading
              </LocalizedText>
              <LocalizedText as='h3' className='text-2xl font-medium'>
                三级标题 / H3 Heading
              </LocalizedText>
            </div>

            <div>
              <h3 className='mb-2 text-lg font-semibold'>
                直接使用字体类 / Direct Font Classes
              </h3>
              <div className='space-y-2'>
                <p className={sans}>使用 sans 字体类 / Using sans font class</p>
                <p className={mono}>使用 mono 字体类 / Using mono font class</p>
                <p className='font-chinese'>
                  强制中文字体 / Force Chinese font
                </p>
                <p className='font-english'>
                  强制英文字体 / Force English font
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
