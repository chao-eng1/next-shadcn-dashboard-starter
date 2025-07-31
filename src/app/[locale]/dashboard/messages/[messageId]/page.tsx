import { MessageDetail } from '@/features/messages/components/message-detail';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import PageContainer from '@/components/layout/page-container';
import { IconMail } from '@tabler/icons-react';

export default function MessageDetailPage({
  params
}: {
  params: { messageId: string };
}) {
  return (
    <PageContainer>
      <div className='mx-auto flex w-full max-w-4xl flex-1 flex-col space-y-6 px-4 md:px-6'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Message Details'
            description='View message content and details'
            icon={<IconMail className='text-muted-foreground h-6 w-6' />}
          />
        </div>
        <Separator />

        <MessageDetail messageId={params.messageId} />
      </div>
    </PageContainer>
  );
}
