'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import {
  Requirement,
  RequirementComment,
  RequirementAttachment,
  RequirementVersion,
  RequirementFormData
} from '../types/requirement';

interface UseRequirementDetailOptions {
  projectId: string;
  requirementId: string;
  autoFetch?: boolean;
}

interface UseRequirementDetailReturn {
  requirement: Requirement | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchRequirement: () => Promise<void>;
  updateRequirement: (data: Partial<RequirementFormData>) => Promise<void>;
  deleteRequirement: () => Promise<void>;
  
  // Comments
  addComment: (content: string) => Promise<RequirementComment>;
  updateComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  
  // Attachments
  uploadAttachment: (file: File, description?: string) => Promise<RequirementAttachment>;
  deleteAttachment: (attachmentId: string) => Promise<void>;
  
  // Versions
  createVersion: (data: { changeReason: string }) => Promise<RequirementVersion>;
  
  // Tasks
  linkTask: (taskId: string) => Promise<void>;
  unlinkTask: (taskId: string) => Promise<void>;
  
  // Utilities
  refreshRequirement: () => Promise<void>;
}

export function useRequirementDetail({
  projectId,
  requirementId,
  autoFetch = true
}: UseRequirementDetailOptions): UseRequirementDetailReturn {
  const { toast } = useToast();
  
  // State
  const [requirement, setRequirement] = useState<Requirement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch requirement detail
  const fetchRequirement = useCallback(async () => {
    if (!projectId || !requirementId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/projects/${projectId}/requirements/${requirementId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setRequirement(result.data);
      } else {
        throw new Error(result.message || '获取需求详情失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取需求详情失败';
      setError(errorMessage);
      toast({
        title: '获取需求详情失败',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, requirementId, toast]);

  // Update requirement
  const updateRequirement = useCallback(async (data: Partial<RequirementFormData>) => {
    if (!projectId || !requirementId) return;
    
    try {
      const response = await fetch(`/api/projects/${projectId}/requirements/${requirementId}`, {
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
        setRequirement(result.data);
        toast({
          title: '更新成功',
          description: '需求已成功更新'
        });
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
  }, [projectId, requirementId, toast]);

  // Delete requirement
  const deleteRequirement = useCallback(async () => {
    if (!projectId || !requirementId) return;
    
    try {
      const response = await fetch(`/api/projects/${projectId}/requirements/${requirementId}`, {
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
  }, [projectId, requirementId, toast]);

  // Add comment
  const addComment = useCallback(async (content: string): Promise<RequirementComment> => {
    if (!projectId || !requirementId) {
      throw new Error('Missing project or requirement ID');
    }
    
    try {
      const response = await fetch(`/api/projects/${projectId}/requirements/${requirementId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setRequirement(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            comments: [result.data, ...prev.comments]
          };
        });
        
        toast({
          title: '评论成功',
          description: '评论已添加'
        });
        
        return result.data;
      } else {
        throw new Error(result.message || '添加评论失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '添加评论失败';
      toast({
        title: '评论失败',
        description: errorMessage,
        variant: 'destructive'
      });
      throw err;
    }
  }, [projectId, requirementId, toast]);

  // Update comment
  const updateComment = useCallback(async (commentId: string, content: string) => {
    if (!projectId || !requirementId) return;
    
    try {
      const response = await fetch(`/api/projects/${projectId}/requirements/${requirementId}/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setRequirement(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            comments: prev.comments.map(comment => 
              comment.id === commentId ? { ...comment, content, updatedAt: new Date().toISOString() } : comment
            )
          };
        });
        
        toast({
          title: '更新成功',
          description: '评论已更新'
        });
      } else {
        throw new Error(result.message || '更新评论失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新评论失败';
      toast({
        title: '更新失败',
        description: errorMessage,
        variant: 'destructive'
      });
      throw err;
    }
  }, [projectId, requirementId, toast]);

  // Delete comment
  const deleteComment = useCallback(async (commentId: string) => {
    if (!projectId || !requirementId) return;
    
    try {
      const response = await fetch(`/api/projects/${projectId}/requirements/${requirementId}/comments/${commentId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setRequirement(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            comments: prev.comments.filter(comment => comment.id !== commentId)
          };
        });
        
        toast({
          title: '删除成功',
          description: '评论已删除'
        });
      } else {
        throw new Error(result.message || '删除评论失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除评论失败';
      toast({
        title: '删除失败',
        description: errorMessage,
        variant: 'destructive'
      });
      throw err;
    }
  }, [projectId, requirementId, toast]);

  // Upload attachment
  const uploadAttachment = useCallback(async (
    file: File, 
    description?: string
  ): Promise<RequirementAttachment> => {
    if (!projectId || !requirementId) {
      throw new Error('Missing project or requirement ID');
    }
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (description) {
        formData.append('description', description);
      }
      
      const response = await fetch(`/api/projects/${projectId}/requirements/${requirementId}/attachments`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setRequirement(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            attachments: [...prev.attachments, result.data]
          };
        });
        
        toast({
          title: '上传成功',
          description: '附件已上传'
        });
        
        return result.data;
      } else {
        throw new Error(result.message || '上传附件失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '上传附件失败';
      toast({
        title: '上传失败',
        description: errorMessage,
        variant: 'destructive'
      });
      throw err;
    }
  }, [projectId, requirementId, toast]);

  // Delete attachment
  const deleteAttachment = useCallback(async (attachmentId: string) => {
    if (!projectId || !requirementId) return;
    
    try {
      const response = await fetch(`/api/projects/${projectId}/requirements/${requirementId}/attachments/${attachmentId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setRequirement(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            attachments: prev.attachments.filter(attachment => attachment.id !== attachmentId)
          };
        });
        
        toast({
          title: '删除成功',
          description: '附件已删除'
        });
      } else {
        throw new Error(result.message || '删除附件失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除附件失败';
      toast({
        title: '删除失败',
        description: errorMessage,
        variant: 'destructive'
      });
      throw err;
    }
  }, [projectId, requirementId, toast]);

  // Create version
  const createVersion = useCallback(async (data: { changeReason: string }): Promise<RequirementVersion> => {
    if (!projectId || !requirementId) {
      throw new Error('Missing project or requirement ID');
    }
    
    try {
      const response = await fetch(`/api/projects/${projectId}/requirements/${requirementId}/versions`, {
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
        // Update local state
        setRequirement(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            versions: [result.data, ...prev.versions],
            currentVersion: result.data.versionNumber
          };
        });
        
        toast({
          title: '版本创建成功',
          description: '新版本已创建'
        });
        
        return result.data;
      } else {
        throw new Error(result.message || '创建版本失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建版本失败';
      toast({
        title: '创建失败',
        description: errorMessage,
        variant: 'destructive'
      });
      throw err;
    }
  }, [projectId, requirementId, toast]);

  // Link task
  const linkTask = useCallback(async (taskId: string) => {
    if (!projectId || !requirementId) return;
    
    try {
      const response = await fetch(`/api/projects/${projectId}/requirements/${requirementId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ taskId })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh requirement to get updated tasks
        await fetchRequirement();
        
        toast({
          title: '关联成功',
          description: '任务已关联到需求'
        });
      } else {
        throw new Error(result.message || '关联任务失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '关联任务失败';
      toast({
        title: '关联失败',
        description: errorMessage,
        variant: 'destructive'
      });
      throw err;
    }
  }, [projectId, requirementId, fetchRequirement, toast]);

  // Unlink task
  const unlinkTask = useCallback(async (taskId: string) => {
    if (!projectId || !requirementId) return;
    
    try {
      const response = await fetch(`/api/projects/${projectId}/requirements/${requirementId}/tasks/${taskId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh requirement to get updated tasks
        await fetchRequirement();
        
        toast({
          title: '取消关联成功',
          description: '任务已从需求中移除'
        });
      } else {
        throw new Error(result.message || '取消关联失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '取消关联失败';
      toast({
        title: '操作失败',
        description: errorMessage,
        variant: 'destructive'
      });
      throw err;
    }
  }, [projectId, requirementId, fetchRequirement, toast]);

  // Refresh requirement
  const refreshRequirement = useCallback(async () => {
    await fetchRequirement();
  }, [fetchRequirement]);

  // Auto fetch on mount and dependency changes
  useEffect(() => {
    if (autoFetch) {
      fetchRequirement();
    }
  }, [fetchRequirement, autoFetch]);

  return {
    requirement,
    loading,
    error,
    
    // Actions
    fetchRequirement,
    updateRequirement,
    deleteRequirement,
    
    // Comments
    addComment,
    updateComment,
    deleteComment,
    
    // Attachments
    uploadAttachment,
    deleteAttachment,
    
    // Versions
    createVersion,
    
    // Tasks
    linkTask,
    unlinkTask,
    
    // Utilities
    refreshRequirement
  };
}