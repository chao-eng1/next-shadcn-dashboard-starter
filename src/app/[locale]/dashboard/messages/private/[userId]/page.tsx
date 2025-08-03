'use client';

import React from 'react';
import { MessageCenterMain } from '@/components/messages/message-center-main';

export default function PrivateChatPage() {
  return (
    <div className='h-[calc(100vh-4rem)] overflow-hidden'>
      <MessageCenterMain />
    </div>
  );
}
