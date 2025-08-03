'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Download,
  Upload,
  Settings,
  MoreHorizontal,
  FileText,
  FileSpreadsheet,
  Copy,
  Archive,
  Import,
  ExternalLink,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RequirementActionsProps {
  selectedItems?: string[];
  onRefresh?: () => void;
  projectId?: string;
}

export function RequirementActions({
  selectedItems = [],
  onRefresh,
  projectId
}: RequirementActionsProps) {
  const [showBatchUpdate, setShowBatchUpdate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [batchStatus, setBatchStatus] = useState('');
  const [batchAssignee, setBatchAssignee] = useState('');
  const [batchComment, setBatchComment] = useState('');
  const [importing, setImporting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleCreateNew = () => {
    const url = projectId
      ? `/dashboard/projects/${projectId}/requirements/new`
      : '/dashboard/requirements/new';
    router.push(url);
  };

  const handleExport = async (format: 'excel' | 'pdf' | 'csv') => {
    try {
      const params = new URLSearchParams();
      if (selectedItems.length > 0) {
        params.append('ids', selectedItems.join(','));
      }
      if (projectId) {
        params.append('projectId', projectId);
      }
      params.append('format', format);

      const response = await fetch(`/api/requirements/export?${params}`);
      if (!response.ok) {
        throw new Error('导出失败');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `requirements-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: '成功',
        description: '需求已导出'
      });
    } catch (error) {
      console.error('导出失败:', error);
      toast({
        title: '错误',
        description: '导出失败，请稍后重试',
        variant: 'destructive'
      });
    }
  };

  const handleImport = async (file: File) => {
    try {
      setImporting(true);
      const formData = new FormData();
      formData.append('file', file);
      if (projectId) {
        formData.append('projectId', projectId);
      }

      const response = await fetch('/api/requirements/import', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('导入失败');
      }

      const result = await response.json();
      toast({
        title: '成功',
        description: `成功导入 ${result.count} 个需求`
      });

      setShowImport(false);
      onRefresh?.();
    } catch (error) {
      console.error('导入失败:', error);
      toast({
        title: '错误',
        description: '导入失败，请检查文件格式',
        variant: 'destructive'
      });
    } finally {
      setImporting(false);
    }
  };

  const handleBatchUpdate = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: '提示',
        description: '请先选择要更新的需求',
        variant: 'destructive'
      });
      return;
    }

    try {
      const updates: any = {};
      if (batchStatus) updates.status = batchStatus;
      if (batchAssignee) updates.assigneeId = batchAssignee;
      if (batchComment) updates.comment = batchComment;

      const response = await fetch('/api/requirements/batch-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ids: selectedItems,
          updates
        })
      });

      if (!response.ok) {
        throw new Error('批量更新失败');
      }

      toast({
        title: '成功',
        description: `已更新 ${selectedItems.length} 个需求`
      });

      setShowBatchUpdate(false);
      setBatchStatus('');
      setBatchAssignee('');
      setBatchComment('');
      onRefresh?.();
    } catch (error) {
      console.error('批量更新失败:', error);
      toast({
        title: '错误',
        description: '批量更新失败，请稍后重试',
        variant: 'destructive'
      });
    }
  };

  const handleBatchDelete = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: '提示',
        description: '请先选择要删除的需求',
        variant: 'destructive'
      });
      return;
    }

    if (
      !confirm(
        `确定要删除选中的 ${selectedItems.length} 个需求吗？此操作不可撤销。`
      )
    ) {
      return;
    }

    try {
      const response = await fetch('/api/requirements/batch-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ids: selectedItems
        })
      });

      if (!response.ok) {
        throw new Error('批量删除失败');
      }

      toast({
        title: '成功',
        description: `已删除 ${selectedItems.length} 个需求`
      });

      onRefresh?.();
    } catch (error) {
      console.error('批量删除失败:', error);
      toast({
        title: '错误',
        description: '批量删除失败，请稍后重试',
        variant: 'destructive'
      });
    }
  };

  const handleBatchArchive = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: '提示',
        description: '请先选择要归档的需求',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch('/api/requirements/batch-archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ids: selectedItems
        })
      });

      if (!response.ok) {
        throw new Error('批量归档失败');
      }

      toast({
        title: '成功',
        description: `已归档 ${selectedItems.length} 个需求`
      });

      onRefresh?.();
    } catch (error) {
      console.error('批量归档失败:', error);
      toast({
        title: '错误',
        description: '批量归档失败，请稍后重试',
        variant: 'destructive'
      });
    }
  };

  const handleDuplicateSelected = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: '提示',
        description: '请先选择要复制的需求',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch('/api/requirements/duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ids: selectedItems
        })
      });

      if (!response.ok) {
        throw new Error('复制需求失败');
      }

      toast({
        title: '成功',
        description: `已复制 ${selectedItems.length} 个需求`
      });

      onRefresh?.();
    } catch (error) {
      console.error('复制需求失败:', error);
      toast({
        title: '错误',
        description: '复制需求失败，请稍后重试',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className='flex items-center space-x-3'>
      {/* 创建新需求 */}
      <Button
        onClick={handleCreateNew}
        className='flex h-11 items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl'
      >
        <Plus className='h-4 w-4' />
        <span className='font-medium'>新建需求</span>
      </Button>

      {/* 批量操作 */}
      {selectedItems.length > 0 && (
        <>
          <Dialog open={showBatchUpdate} onOpenChange={setShowBatchUpdate}>
            <DialogTrigger asChild>
              <Button variant='outline'>
                批量更新 ({selectedItems.length})
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>批量更新需求</DialogTitle>
                <DialogDescription>
                  将对选中的 {selectedItems.length} 个需求进行批量更新
                </DialogDescription>
              </DialogHeader>
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Label>状态</Label>
                  <Select value={batchStatus} onValueChange={setBatchStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder='选择状态（可选）' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='DRAFT'>草稿</SelectItem>
                      <SelectItem value='PENDING'>待评估</SelectItem>
                      <SelectItem value='APPROVED'>已确认</SelectItem>
                      <SelectItem value='IN_PROGRESS'>开发中</SelectItem>
                      <SelectItem value='TESTING'>测试中</SelectItem>
                      <SelectItem value='COMPLETED'>已完成</SelectItem>
                      <SelectItem value='REJECTED'>已拒绝</SelectItem>
                      <SelectItem value='CANCELLED'>已取消</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label>负责人</Label>
                  <Select
                    value={batchAssignee}
                    onValueChange={setBatchAssignee}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='选择负责人（可选）' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='user1'>张三</SelectItem>
                      <SelectItem value='user2'>李四</SelectItem>
                      <SelectItem value='user3'>王五</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label>更新说明</Label>
                  <Textarea
                    placeholder='请输入更新说明（可选）'
                    value={batchComment}
                    onChange={(e) => setBatchComment(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant='outline'
                  onClick={() => setShowBatchUpdate(false)}
                >
                  取消
                </Button>
                <Button onClick={handleBatchUpdate}>确认更新</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant='outline' onClick={handleDuplicateSelected}>
            <Copy className='mr-2 h-4 w-4' />
            复制
          </Button>

          <Button variant='outline' onClick={handleBatchArchive}>
            <Archive className='mr-2 h-4 w-4' />
            归档
          </Button>

          <Button variant='destructive' onClick={handleBatchDelete}>
            删除 ({selectedItems.length})
          </Button>
        </>
      )}

      {/* 快速操作按钮组 */}
      <div className='hidden items-center space-x-2 md:flex'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='outline'
              className='border-border/50 flex h-11 items-center gap-2 px-4 transition-all duration-200 hover:border-green-200 hover:bg-green-50 hover:text-green-700 dark:hover:border-green-800 dark:hover:bg-green-950/20 dark:hover:text-green-300'
            >
              <ExternalLink className='h-4 w-4' />
              <span className='hidden lg:inline'>导出</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>导出格式</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleExport('excel')}>
              <FileSpreadsheet className='mr-2 h-4 w-4' />
              Excel 文件
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('pdf')}>
              <FileText className='mr-2 h-4 w-4' />
              PDF 文件
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('csv')}>
              <FileText className='mr-2 h-4 w-4' />
              CSV 文件
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 导入 */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogTrigger asChild>
          <Button variant='outline'>
            <Upload className='mr-2 h-4 w-4' />
            导入
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>导入需求</DialogTitle>
            <DialogDescription>
              支持导入 Excel (.xlsx) 和 CSV (.csv) 格式的文件
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='rounded-lg border-2 border-dashed border-gray-300 p-6 text-center'>
              <input
                type='file'
                accept='.xlsx,.csv'
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImport(file);
                  }
                }}
                className='hidden'
                id='file-upload'
              />
              <label htmlFor='file-upload' className='cursor-pointer'>
                <Upload className='mx-auto h-12 w-12 text-gray-400' />
                <p className='mt-2 text-sm text-gray-600'>
                  点击选择文件或拖拽文件到此处
                </p>
                <p className='text-xs text-gray-500'>支持 .xlsx 和 .csv 格式</p>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowImport(false)}>
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 更多操作 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='outline'
            className='border-border/50 hover:bg-muted flex h-11 items-center gap-2 px-4 transition-all duration-200'
          >
            <MoreHorizontal className='h-4 w-4' />
            <span className='hidden sm:inline'>更多</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-56'>
          {/* 移动端显示的导入导出选项 */}
          <div className='md:hidden'>
            <DropdownMenuItem
              onClick={() => setShowImport(true)}
              className='flex items-center gap-3 py-3'
            >
              <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20'>
                <Import className='h-4 w-4 text-blue-600 dark:text-blue-400' />
              </div>
              <div>
                <div className='font-medium'>导入需求</div>
                <div className='text-muted-foreground text-xs'>
                  从文件导入需求数据
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className='flex items-center gap-3 py-3'>
              <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20'>
                <ExternalLink className='h-4 w-4 text-green-600 dark:text-green-400' />
              </div>
              <div>
                <div className='font-medium'>导出需求</div>
                <div className='text-muted-foreground text-xs'>
                  导出需求数据到文件
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </div>

          {/* 其他操作选项 */}
          <DropdownMenuItem
            onClick={() => router.push('/dashboard/requirements/templates')}
            className='flex items-center gap-3 py-3'
          >
            <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20'>
              <FileText className='h-4 w-4 text-purple-600 dark:text-purple-400' />
            </div>
            <div>
              <div className='font-medium'>需求模板</div>
              <div className='text-muted-foreground text-xs'>管理需求模板</div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem className='flex items-center gap-3 py-3'>
            <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20'>
              <Zap className='h-4 w-4 text-orange-600 dark:text-orange-400' />
            </div>
            <div>
              <div className='font-medium'>智能分析</div>
              <div className='text-muted-foreground text-xs'>
                AI 驱动的需求分析
              </div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => router.push('/dashboard/requirements/settings')}
            className='flex items-center gap-3 py-3'
          >
            <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-900/20'>
              <Settings className='h-4 w-4 text-gray-600 dark:text-gray-400' />
            </div>
            <div>
              <div className='font-medium'>设置</div>
              <div className='text-muted-foreground text-xs'>
                配置需求管理选项
              </div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={onRefresh}>刷新列表</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
