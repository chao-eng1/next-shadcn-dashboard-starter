'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Plus,
  Download,
  Upload,
  MoreHorizontal,
  FileText,
  Share2,
  Archive,
  Trash2,
  Copy,
  Edit,
  Eye,
  Filter,
  SortAsc,
  SortDesc,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface RequirementActionsProps {
  selectedRequirements?: string[];
  onBulkAction?: (action: string, requirementIds: string[]) => void;
  onExport?: (format: string) => void;
  onImport?: (file: File) => void;
  onRefresh?: () => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

// Move these inside the component to access translations

export function RequirementActions({
  selectedRequirements = [],
  onBulkAction,
  onExport,
  onImport,
  onRefresh,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  onSortChange
}: RequirementActionsProps) {
  const t = useTranslations('requirements');
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const sortOptions = [
    { value: 'title', label: t('sortOptions.title') },
    { value: 'status', label: t('sortOptions.status') },
    { value: 'priority', label: t('sortOptions.priority') },
    { value: 'createdAt', label: t('sortOptions.createdAt') },
    { value: 'updatedAt', label: t('sortOptions.updatedAt') },
    { value: 'dueDate', label: t('sortOptions.dueDate') },
    { value: 'businessValue', label: t('sortOptions.businessValue') },
    { value: 'effort', label: t('sortOptions.effort') }
  ];

  const exportFormats = [
    { value: 'csv', label: t('exportFormats.csv'), icon: FileText },
    { value: 'excel', label: t('exportFormats.excel'), icon: FileText },
    { value: 'pdf', label: t('exportFormats.pdf'), icon: FileText },
    { value: 'json', label: t('exportFormats.json'), icon: FileText }
  ];

  const handleBulkAction = (action: string) => {
    if (selectedRequirements.length === 0) return;
    onBulkAction?.(action, selectedRequirements);
  };

  const handleSort = (field: string) => {
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    onSortChange?.(field, newOrder);
  };

  const handleExport = (format: string) => {
    onExport?.(format);
    setIsExportDialogOpen(false);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport?.(file);
    }
  };

  return (
    <div className='flex items-center justify-between gap-4'>
      {/* Left side - Primary actions */}
      <div className='flex items-center gap-2'>
        {/* Create Requirement */}
        <Button asChild className='gap-2'>
          <Link href='/dashboard/requirements/new'>
            <Plus className='h-4 w-4' />
            {t('createRequirement')}
          </Link>
        </Button>

        {/* Bulk Actions */}
        {selectedRequirements.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' className='gap-2'>
                <MoreHorizontal className='h-4 w-4' />
                {t('bulkActions')}
                <Badge variant='secondary' className='ml-1'>
                  {selectedRequirements.length}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start'>
              <DropdownMenuLabel>{t('bulkActions')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleBulkAction('edit')}>
                <Edit className='mr-2 h-4 w-4' />
                {t('editSelected')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAction('duplicate')}>
                <Copy className='mr-2 h-4 w-4' />
                {t('duplicateSelected')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAction('archive')}>
                <Archive className='mr-2 h-4 w-4' />
                {t('archiveSelected')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleBulkAction('delete')}
                className='text-red-600 focus:text-red-600'
              >
                <Trash2 className='mr-2 h-4 w-4' />
                {t('deleteSelected')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Right side - Secondary actions */}
      <div className='flex items-center gap-2'>
        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' size='sm' className='gap-2'>
              {sortOrder === 'asc' ? (
                <SortAsc className='h-4 w-4' />
              ) : (
                <SortDesc className='h-4 w-4' />
              )}
              {t('sort')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>{t('sortBy')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {sortOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handleSort(option.value)}
                className={cn(
                  'flex items-center justify-between',
                  sortBy === option.value && 'bg-accent'
                )}
              >
                {option.label}
                {sortBy === option.value &&
                  (sortOrder === 'asc' ? (
                    <SortAsc className='h-4 w-4' />
                  ) : (
                    <SortDesc className='h-4 w-4' />
                  ))}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export */}
        <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant='outline' size='sm' className='gap-2'>
              <Download className='h-4 w-4' />
              {t('export')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('exportRequirements')}</DialogTitle>
              <DialogDescription>{t('exportDescription')}</DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              {exportFormats.map((format) => {
                const Icon = format.icon;
                return (
                  <Button
                    key={format.value}
                    variant='outline'
                    className='h-12 justify-start gap-3'
                    onClick={() => handleExport(format.value)}
                  >
                    <Icon className='h-5 w-5' />
                    <div className='text-left'>
                      <div className='font-medium'>{format.label}</div>
                      <div className='text-xs text-gray-500'>
                        {t(`exportFormat.${format.value}`)}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>

        {/* Import */}
        <Button variant='outline' size='sm' className='gap-2' asChild>
          <label className='cursor-pointer'>
            <Upload className='h-4 w-4' />
            {t('import')}
            <input
              type='file'
              accept='.csv,.xlsx,.json'
              onChange={handleImport}
              className='hidden'
            />
          </label>
        </Button>

        {/* Refresh */}
        <Button variant='outline' size='sm' onClick={onRefresh}>
          <RefreshCw className='h-4 w-4' />
        </Button>

        {/* More Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' size='sm'>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuLabel>{t('moreActions')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Share2 className='mr-2 h-4 w-4' />
              {t('shareView')}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Eye className='mr-2 h-4 w-4' />
              {t('viewSettings')}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Filter className='mr-2 h-4 w-4' />
              {t('saveFilter')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default RequirementActions;
