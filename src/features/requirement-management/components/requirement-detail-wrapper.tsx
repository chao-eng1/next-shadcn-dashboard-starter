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
  const { requirement, loading, updateRequirement } = useRequirementDetail({
    projectId,
    requirementId,
    autoFetch: !initialRequirement
  });

  // Use initial requirement if provided, otherwise use fetched requirement
  const displayRequirement = initialRequirement || requirement;

  const handleSave = async (updatedData: any) => {
    try {
      await updateRequirement(updatedData);
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
