'use client';

import React from 'react';
import { MessageCenterMain } from '@/components/messages/message-center-main';

export default function MessagesPage() {
  return (
    <div className='h-[calc(100vh-4rem)] overflow-hidden'>
      <MessageCenterMain />
    </div>
  );
}
