'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

// API返回的需求数据类型
interface ApiRequirement {
  id: string;
  requirementId?: string;
  title: string;
  description?: string;
  acceptanceCriteria?: string;
  businessValue?: string;
  userStory?: string;
  priority: string;
  status: string;
  type: string;
  complexity: string;
  estimatedEffort?: number;
  actualEffort?: number;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    name: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  parent?: {
    id: string;
    title: string;
    status: string;
  };
  children?: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
  }>;
  tags?: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
  _count?: {
    comments: number;
    attachments: number;
    versions: number;
  };
}

interface RequirementsPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface RequirementsResponse {
  requirements: ApiRequirement[];
  pagination: RequirementsPagination;
}

interface UseGlobalRequirementsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string[];
  priority?: string[];
  type?: string[];
  complexity?: string[];
  projectId?: string;
  assignedToId?: string;
  createdById?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  autoFetch?: boolean;
}

export function useGlobalRequirements(
  params: UseGlobalRequirementsParams = {}
) {
  const [requirements, setRequirements] = useState<ApiRequirement[]>([]);
  const [pagination, setPagination] = useState<RequirementsPagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequirements = async () => {
    setLoading(true);
    setError(null);

    try {
      // 构建查询参数
      const searchParams = new URLSearchParams();

      if (params.page) searchParams.set('page', params.page.toString());
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.search) searchParams.set('search', params.search);
      if (params.status && params.status.length > 0) {
        searchParams.set('status', params.status.join(','));
      }
      if (params.priority && params.priority.length > 0) {
        searchParams.set('priority', params.priority.join(','));
      }
      if (params.type && params.type.length > 0) {
        searchParams.set('type', params.type.join(','));
      }
      if (params.complexity && params.complexity.length > 0) {
        searchParams.set('complexity', params.complexity.join(','));
      }
      if (params.projectId) searchParams.set('projectId', params.projectId);
      if (params.assignedToId)
        searchParams.set('assignedToId', params.assignedToId);
      if (params.createdById)
        searchParams.set('createdById', params.createdById);
      if (params.sortField) searchParams.set('sortField', params.sortField);
      if (params.sortDirection)
        searchParams.set('sortDirection', params.sortDirection);

      const response = await fetch(
        `/api/requirements?${searchParams.toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: { data: RequirementsResponse } = await response.json();

      setRequirements(data.data.requirements);
      setPagination(data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch requirements:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to fetch requirements'
      );
      toast.error('获取需求列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除需求
  const deleteRequirement = async (requirementId: string) => {
    try {
      const response = await fetch(`/api/requirements/${requirementId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.success('需求删除成功');
        // 从本地状态中移除已删除的需求
        setRequirements((prev) =>
          prev.filter((req) => req.id !== requirementId)
        );
        setPagination((prev) => ({
          ...prev,
          total: prev.total - 1,
          totalPages: Math.ceil((prev.total - 1) / prev.limit)
        }));
      } else {
        throw new Error(result.message || '删除需求失败');
      }
    } catch (error) {
      console.error('Failed to delete requirement:', error);
      const errorMessage =
        error instanceof Error ? error.message : '删除需求失败';
      toast.error(errorMessage);
      throw error;
    }
  };

  // 当参数改变时重新获取数据
  useEffect(() => {
    if (params.autoFetch !== false) {
      fetchRequirements();
    }
  }, [
    params.page,
    params.limit,
    params.search,
    params.status?.join(','),
    params.priority?.join(','),
    params.type?.join(','),
    params.complexity?.join(','),
    params.projectId,
    params.assignedToId,
    params.createdById,
    params.sortField,
    params.sortDirection,
    params.autoFetch
  ]);

  return {
    requirements,
    pagination,
    loading,
    error,
    refetch: fetchRequirements,
    deleteRequirement
  };
}
