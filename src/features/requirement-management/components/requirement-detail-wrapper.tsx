'use client';

import { RequirementDetail } from './requirement-detail';
import { useRequirementDetail } from '../hooks/use-requirement-detail';

interface RequirementDetailWrapperProps {
  projectId: string;
  requirementId: string;
  initialRequirement?: any;
}

export function RequirementDetailWrapper({
  projectId,
  requirementId,
  initialRequirement
}: RequirementDetailWrapperProps) {
  const { requirement, loading, updateRequirement, refreshRequirement } =
    useRequirementDetail({
      projectId,
      requirementId,
      autoFetch: !initialRequirement
    });

  // Use fetched requirement if available, otherwise use initial requirement
  const displayRequirement = requirement || initialRequirement;

  const handleSave = async (updatedData: any) => {
    try {
      await updateRequirement(updatedData);
      // 保存成功后刷新数据以确保显示最新状态
      if (initialRequirement) {
        await refreshRequirement();
      }
    } catch (error) {
      console.error('Failed to update requirement:', error);
    }
  };

  return (
    <RequirementDetail
      requirement={displayRequirement}
      loading={loading}
      onSave={handleSave}
    />
  );
}
