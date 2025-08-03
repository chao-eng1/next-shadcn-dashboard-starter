'use client';

import React from 'react';
import { ProjectGroupChat } from '@/components/messages/project-group-chat';
import { useParams } from 'next/navigation';

export default function ProjectGroupChatPage() {
  const params = useParams();
  const groupId = params.groupId as string;

  return (
    <div className="h-full">
      <ProjectGroupChat groupId={groupId} />
    </div>
  );
}