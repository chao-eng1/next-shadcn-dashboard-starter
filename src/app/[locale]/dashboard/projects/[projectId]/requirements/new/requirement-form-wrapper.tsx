'use client';

import { useRouter } from 'next/navigation';
import { RequirementForm } from '@/features/requirement-management/components/requirement-form';

interface ProjectMember {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

interface ProjectTag {
  id: string;
  name: string;
  color: string;
}

interface RequirementFormWrapperProps {
  projectId: string;
  parentId?: string;
  projectMembers: ProjectMember[];
  projectTags: ProjectTag[];
}

export function RequirementFormWrapper({
  projectId,
  parentId,
  projectMembers,
  projectTags
}: RequirementFormWrapperProps) {
  const router = useRouter();

  const handleSuccess = () => {
    router.push(`/dashboard/projects/${projectId}/requirements`);
  };

  const handleCancel = () => {
    router.push(`/dashboard/projects/${projectId}/requirements`);
  };

  return (
    <RequirementForm
      projectId={projectId}
      parentId={parentId}
      projectMembers={projectMembers}
      projectTags={projectTags}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
}