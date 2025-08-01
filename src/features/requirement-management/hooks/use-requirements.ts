'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import {
  Requirement,
  RequirementFormData,
  RequirementFilter,
  RequirementSort,
  RequirementStatus,
  RequirementApiResponse
} from '../types/requirement';

interface UseRequirementsOptions {
  projectId: string;
  initialFilter?: RequirementFilter;
  initialSort?: RequirementSort;
  pageSize?: number;
  autoFetch?: boolean;
}

interface UseRequirementsReturn {
  requirements: Requirement[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  filter: RequirementFilter;
  sort: RequirementSort;
  
  // Actions
  fetchRequirements: () => Promise<void>;
  createRequirement: (data: RequirementFormData) => Promise<Requirement>;
  updateRequirement: (id: string, data: Partial<RequirementFormData>) => Promise<Requirement>;
  deleteRequirement: (id: string) => Promise<void>;
  updateRequirementStatus: (id: string, status: RequirementStatus) => Promise<void>;
  
  // Filters and pagination
  setFilter: (filter: RequirementFilter) => void;
  setSort: (sort: RequirementSort) => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
  
  // Utilities
  refreshRequirements: () => Promise<void>;
  getRequirementById: (id: string) => Requirement | undefined;
}

export function useRequirements({
  projectId,
  initialFilter = {},
  initialSort = { field: 'createdAt', direction: 'desc' },
  pageSize = 20,
  autoFetch = true
}: UseRequirementsOptions): UseRequirementsReturn {
  const { toast } = useToast();
  
  // State
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<RequirementFilter>(initialFilter);
  const [sort, setSort] = useState<RequirementSort>(initialSort);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Fetch requirements
  const fetchRequirements = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortField: sort.field,
        sortDirection: sort.direction
      });

      // Add filters
      if (filter.status?.length) {
        filter.status.forEach(status => params.append('status', status));
      }
      if (filter.priority?.length) {
        filter.priority.forEach(priority => params.append('priority', priority));
      }
      if (filter.type?.length) {
        filter.type.forEach(type => params.append('type', type));
      }
      if (filter.complexity?.length) {
        filter.complexity.forEach(complexity => params.append('complexity', complexity));
      }
      if (filter.assigneeId?.length) {
        filter.assigneeId.forEach(id => params.append('assigneeId', id));
      }
      if (filter.createdById?.length) {
        filter.createdById.forEach(id => params.append('createdById', id));
      }
      if (filter.search) {
        params.append('search', filter.search);
      }
      if (filter.parentId !== undefined) {
        if (filter.parentId === null) {
          params.append('parentId', 'null');
        } else {
          params.append('parentId', filter.parentId);
        }
      }
      if (filter.startDate) {
        params.append('startDate', filter.startDate);
      }
      if (filter.endDate) {
        params.append('endDate', filter.endDate);
      }

      const response = await fetch(`/api/projects/${projectId}/requirements?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: RequirementApiResponse = await response.json();
      
      if (data.success) {
        setRequirements(data.data.requirements);
        setTotalCount(data.data.total);
      } else {
        throw new Error(data.message || '获取需求列表失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取需求列表失败';
      setError(errorMessage);
      toast({
        title: '获取需求失败',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, currentPage, pageSize, sort, filter, toast]);

  // Create requirement
  const createRequirement = useCallback(async (data: RequirementFormData): Promise<Requirement> => {
    try {
      const response = await fetch(`/api/projects/${projectId}/requirements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: '创建成功',
          description: '需求已成功创建'
        });
        
        // Refresh the list
        await fetchRequirements();
        
        return result.data;
      } else {
        throw new Error(result.message || '创建需求失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建需求失败';
      toast({
        title: '创建失败',
        description: errorMessage,
        variant: 'destructive'
      });
      throw err;
    }
  }, [projectId, fetchRequirements, toast]);

  // Update requirement
  const updateRequirement = useCallback(async (
    id: string, 
    data: Partial<RequirementFormData>
  ): Promise<Requirement> => {
    try {
      const response = await fetch(`/api/projects/${projectId}/requirements/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: '更新成功',
          description: '需求已成功更新'
        });
        
        // Update local state
        setRequirements(prev => 
          prev.map(req => req.id === id ? { ...req, ...result.data } : req)
        );
        
        return result.data;
      } else {
        throw new Error(result.message || '更新需求失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新需求失败';
      toast({
        title: '更新失败',
        description: errorMessage,
        variant: 'destructive'
      });
      throw err;
    }
  }, [projectId, toast]);

  // Delete requirement
  const deleteRequirement = useCallback(async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/projects/${projectId}/requirements/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: '删除成功',
          description: '需求已成功删除'
        });
        
        // Remove from local state
        setRequirements(prev => prev.filter(req => req.id !== id));
        setTotalCount(prev => prev - 1);
      } else {
        throw new Error(result.message || '删除需求失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除需求失败';
      toast({
        title: '删除失败',
        description: errorMessage,
        variant: 'destructive'
      });
      throw err;
    }
  }, [projectId, toast]);

  // Update requirement status
  const updateRequirementStatus = useCallback(async (
    id: string, 
    status: RequirementStatus
  ): Promise<void> => {
    try {
      const response = await fetch(`/api/projects/${projectId}/requirements/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setRequirements(prev => 
          prev.map(req => req.id === id ? { ...req, status } : req)
        );
      } else {
        throw new Error(result.message || '更新状态失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新状态失败';
      toast({
        title: '状态更新失败',
        description: errorMessage,
        variant: 'destructive'
      });
      throw err;
    }
  }, [projectId, toast]);

  // Set page
  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilter({});
    setCurrentPage(1);
  }, []);

  // Refresh requirements
  const refreshRequirements = useCallback(async () => {
    await fetchRequirements();
  }, [fetchRequirements]);

  // Get requirement by ID
  const getRequirementById = useCallback((id: string) => {
    return requirements.find(req => req.id === id);
  }, [requirements]);

  // Auto fetch on mount and dependency changes
  useEffect(() => {
    if (autoFetch) {
      fetchRequirements();
    }
  }, [fetchRequirements, autoFetch]);

  return {
    requirements,
    loading,
    error,
    totalCount,
    currentPage,
    totalPages,
    filter,
    sort,
    
    // Actions
    fetchRequirements,
    createRequirement,
    updateRequirement,
    deleteRequirement,
    updateRequirementStatus,
    
    // Filters and pagination
    setFilter,
    setSort,
    setPage,
    resetFilters,
    
    // Utilities
    refreshRequirements,
    getRequirementById
  };
}