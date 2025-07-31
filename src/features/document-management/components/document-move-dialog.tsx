'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoveIcon } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Radio, RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface Project {
  id: string;
  name: string;
  status: string;
}

interface DocumentMoveDialogProps {
  documentId: string;
  documentTitle: string;
  currentProjectId: string | null;
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onSuccess?: () => void;
}

export function DocumentMoveDialog({
  documentId,
  documentTitle,
  currentProjectId,
  isOpen,
  onClose,
  projects,
  onSuccess
}: DocumentMoveDialogProps) {
  const router = useRouter();
  const [destinationType, setDestinationType] = useState<
    'PERSONAL' | 'PROJECT'
  >(currentProjectId ? 'PROJECT' : 'PERSONAL');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    currentProjectId
  );
  const [isMoving, setIsMoving] = useState(false);

  const handleMove = async () => {
    if (destinationType === 'PROJECT' && !selectedProjectId) {
      toast.error('请选择目标项目');
      return;
    }

    setIsMoving(true);

    try {
      // 构建请求数据
      const moveData = {
        destinationType,
        destinationProjectId:
          destinationType === 'PROJECT' ? selectedProjectId : null
      };

      // 发送请求
      const response = await fetch(`/api/documents/${documentId}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(moveData)
      });

      if (!response.ok) {
        throw new Error('移动文档失败');
      }

      const data = await response.json();

      if (data.success) {
        toast.success('文档已成功移动');

        // 如果有成功回调，则调用
        if (onSuccess) {
          onSuccess();
        }

        // 刷新页面数据
        router.refresh();

        // 关闭对话框
        onClose();
      } else {
        throw new Error(data.error?.message || '移动文档失败');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '移动文档失败');
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center'>
            <MoveIcon className='mr-2 h-5 w-5 text-blue-500' />
            移动文档
          </DialogTitle>
          <DialogDescription>
            将文档{' '}
            <span className='font-medium text-blue-600'>{documentTitle}</span>{' '}
            移动到其他位置
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-4 py-4'>
          <RadioGroup
            value={destinationType}
            onValueChange={(value) =>
              setDestinationType(value as 'PERSONAL' | 'PROJECT')
            }
            className='grid gap-4'
          >
            <div
              className='flex cursor-pointer items-center space-x-2 rounded-md p-3 hover:bg-slate-50'
              onClick={() => setDestinationType('PERSONAL')}
            >
              <RadioGroupItem value='PERSONAL' id='personal' />
              <Label htmlFor='personal' className='font-medium'>
                移动到个人文档
              </Label>
            </div>
            <div
              className='flex cursor-pointer items-center space-x-2 rounded-md p-3 hover:bg-slate-50'
              onClick={() => setDestinationType('PROJECT')}
            >
              <RadioGroupItem value='PROJECT' id='project' />
              <Label htmlFor='project' className='font-medium'>
                移动到项目文档
              </Label>
            </div>
          </RadioGroup>

          {destinationType === 'PROJECT' && (
            <div className='grid gap-2 rounded-md border border-blue-100 bg-blue-50 p-4'>
              <Label
                htmlFor='project-select'
                className='font-medium text-blue-800'
              >
                选择目标项目
              </Label>
              <Select
                value={selectedProjectId || ''}
                onValueChange={setSelectedProjectId}
                disabled={isMoving}
              >
                <SelectTrigger
                  id='project-select'
                  className='border-blue-200 bg-white'
                >
                  <SelectValue placeholder='选择项目' />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='mt-1 text-sm text-blue-600'>
                选择要将文档移动到的目标项目
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isMoving}>
            取消
          </Button>
          <Button
            onClick={handleMove}
            disabled={isMoving}
            className='bg-blue-500 hover:bg-blue-600'
          >
            {isMoving ? '移动中...' : '移动文档'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
