'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  FileIcon,
  FolderIcon,
  PlusCircle,
  Search,
  Filter,
  SlidersHorizontal,
  FileText,
  Edit2,
  Trash2,
  AlertTriangle,
  ArrowRightLeft,
  Eye
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { DocumentMoveDialog } from './document-move-dialog';

interface Folder {
  id: string;
  name: string;
}

interface Document {
  id: string;
  title: string;
  content: string;
  format: string;
  status: string;
  isPrivate: boolean;
  tags: string; // Changed from string[] to string
  createdAt: string;
  updatedAt: string;
  folderId: string | null;
  folder: Folder | null;
  projectId: string | null;
  project?: {
    id: string;
    name: string;
    status: string;
  };
  author: {
    id: string;
    name: string;
  };
  _count: {
    attachments: number;
    comments: number;
  };
  currentUserId?: string; // Used for permission checking
}

interface Project {
  id: string;
  name: string;
  status: string;
}

interface DocumentListProps {
  personalDocuments: Document[];
  projectDocuments: Document[];
  projects: Project[];
  folders: Folder[];
  canCreateDocument: boolean;
  canEditDocument: boolean;
  canDeleteDocument: boolean;
}

export function DocumentList({
  personalDocuments,
  projectDocuments,
  projects,
  folders,
  canCreateDocument,
  canEditDocument,
  canDeleteDocument
}: DocumentListProps) {
  const t = useTranslations('documents');
  const router = useRouter();

  // 动态创建文档状态映射
  const statusMap = {
    DRAFT: { label: t('status.draft'), variant: 'outline' as const },
    REVIEW: { label: t('status.review'), variant: 'secondary' as const },
    PUBLISHED: { label: t('status.published'), variant: 'default' as const },
    ARCHIVED: { label: t('status.archived'), variant: 'destructive' as const }
  };
  const [activeTab, setActiveTab] = useState('personal');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [folderFilter, setFolderFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');

  // 从URL参数中读取标签和项目过滤条件
  useEffect(() => {
    // 获取URL参数
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const projectIdParam = params.get('projectId');

    // 如果有tab参数，设置激活的标签
    if (tabParam && (tabParam === 'personal' || tabParam === 'project')) {
      setActiveTab(tabParam);
    }

    // 如果有projectId参数，设置项目过滤器
    if (projectIdParam) {
      setProjectFilter(projectIdParam);
    }
  }, []);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [documentToMove, setDocumentToMove] = useState<Document | null>(null);

  // 过滤文档
  const filterDocuments = (documents: Document[]) => {
    return documents.filter((doc) => {
      // 搜索过滤
      const matchesSearch =
        searchQuery === '' ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.tags &&
          doc.tags.toLowerCase().includes(searchQuery.toLowerCase()));

      // 状态过滤
      const matchesStatus = statusFilter === '' || doc.status === statusFilter;

      // 文件夹过滤 (仅适用于个人文档)
      const matchesFolder =
        folderFilter === '' || doc.folderId === folderFilter;

      return matchesSearch && matchesStatus && matchesFolder;
    });
  };

  // 过滤项目文档
  const filterProjectDocuments = (documents: Document[]) => {
    return documents.filter((doc) => {
      // 搜索过滤
      const matchesSearch =
        searchQuery === '' ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.tags &&
          doc.tags.toLowerCase().includes(searchQuery.toLowerCase()));

      // 状态过滤
      const matchesStatus = statusFilter === '' || doc.status === statusFilter;

      // 项目过滤
      const matchesProject =
        projectFilter === '' || doc.projectId === projectFilter;

      return matchesSearch && matchesStatus && matchesProject;
    });
  };

  const filteredPersonalDocuments = filterDocuments(personalDocuments);
  const filteredProjectDocuments = filterProjectDocuments(projectDocuments);

  // 处理删除文档
  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;

    try {
      setIsDeleting(true);

      const url = documentToDelete.projectId
        ? `/api/projects/${documentToDelete.projectId}/documents/${documentToDelete.id}`
        : `/api/documents/${documentToDelete.id}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(t('messages.deleteFailed'));
      }

      // 刷新页面以反映删除的文档
      router.refresh();

      // 关闭对话框
      setIsDeleteDialogOpen(false);
      setDocumentToDelete(null);
    } catch (error) {
      console.error(t('messages.deleteFailed'), error);
    } finally {
      setIsDeleting(false);
    }
  };

  // 打开删除确认对话框
  const openDeleteDialog = (document: Document) => {
    setDocumentToDelete(document);
    setIsDeleteDialogOpen(true);
  };

  // 打开移动对话框
  const openMoveDialog = (document: Document) => {
    setDocumentToMove(document);
    setIsMoveDialogOpen(true);
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-bold tracking-tight'>文档管理</h2>
        {canCreateDocument && (
          <Button asChild>
            <Link
              href={
                activeTab === 'personal'
                  ? '/dashboard/documents/new'
                  : '/dashboard/documents/new?type=project'
              }
            >
              <PlusCircle className='mr-2 h-4 w-4' />
              {t('actions.new')}
            </Link>
          </Button>
        )}
      </div>

      <Tabs
        defaultValue='personal'
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value);
          // 更新 URL 参数，但不重新加载页面
          const url = new URL(window.location.href);
          url.searchParams.set('tab', value);
          window.history.pushState({}, '', url.toString());
        }}
      >
        <TabsList className='grid w-full max-w-md grid-cols-2'>
          <TabsTrigger value='personal'>{t('tabs.personal')}</TabsTrigger>
          <TabsTrigger value='project'>{t('tabs.project')}</TabsTrigger>
        </TabsList>

        <div className='my-4 flex flex-col gap-4 sm:flex-row'>
          <div className='relative flex-1'>
            <Search className='text-muted-foreground absolute top-2.5 left-2 h-4 w-4' />
            <Input
              placeholder={t('search.placeholder')}
              className='pl-8'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className='flex gap-2'>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-[180px]'>
                <SlidersHorizontal className='mr-2 h-4 w-4' />
                <SelectValue placeholder={t('filters.selectStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=''>{t('filters.all')}</SelectItem>
                <SelectItem value='DRAFT'>{t('status.draft')}</SelectItem>
                <SelectItem value='REVIEW'>{t('status.review')}</SelectItem>
                <SelectItem value='PUBLISHED'>
                  {t('status.published')}
                </SelectItem>
                <SelectItem value='ARCHIVED'>{t('status.archived')}</SelectItem>
              </SelectContent>
            </Select>

            {activeTab === 'personal' && folders.length > 0 && (
              <Select value={folderFilter} onValueChange={setFolderFilter}>
                <SelectTrigger className='w-[180px]'>
                  <FolderIcon className='mr-2 h-4 w-4' />
                  <SelectValue placeholder={t('table.allFolders')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=''>{t('table.allFolders')}</SelectItem>
                  <SelectItem value='null'>
                    {t('table.uncategorized')}
                  </SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {activeTab === 'project' && projects.length > 0 && (
              <Select
                value={projectFilter}
                onValueChange={(value) => {
                  setProjectFilter(value);
                  // 更新 URL 参数，但不重新加载页面
                  const url = new URL(window.location.href);
                  if (value) {
                    url.searchParams.set('projectId', value);
                  } else {
                    url.searchParams.delete('projectId');
                  }
                  window.history.pushState({}, '', url.toString());
                }}
              >
                <SelectTrigger className='w-[180px]'>
                  <Filter className='mr-2 h-4 w-4' />
                  <SelectValue placeholder='所有项目' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=''>所有项目</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <TabsContent value='personal' className='mt-0'>
          <Card>
            <ScrollArea className='max-h-[60vh]'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('table.title')}</TableHead>
                    <TableHead>{t('table.status')}</TableHead>
                    <TableHead>{t('table.folder')}</TableHead>
                    <TableHead>{t('table.createdAt')}</TableHead>
                    <TableHead>{t('table.tags')}</TableHead>
                    <TableHead>{t('table.attachments')}</TableHead>
                    <TableHead className='w-[150px]'>
                      {t('table.actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPersonalDocuments.length > 0 ? (
                    filteredPersonalDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className='flex items-center space-x-2'>
                            <FileText className='text-muted-foreground h-4 w-4' />
                            <Link
                              href={`/dashboard/documents/${doc.id}`}
                              className='font-medium hover:underline'
                            >
                              {doc.title}
                            </Link>
                            {doc.isPrivate && (
                              <Badge variant='outline' className='ml-2'>
                                私密
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              (statusMap[doc.status as keyof typeof statusMap]
                                ?.variant as any) || 'default'
                            }
                          >
                            {statusMap[doc.status as keyof typeof statusMap]
                              ?.label || doc.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{doc.folder?.name || '未分类'}</TableCell>
                        <TableCell>
                          {format(new Date(doc.createdAt), 'yyyy-MM-dd')}
                        </TableCell>
                        <TableCell>
                          <div className='flex flex-wrap gap-1'>
                            {doc.tags && doc.tags.trim().length > 0 ? (
                              doc.tags
                                .split(',')
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant='secondary'
                                    className='text-xs'
                                  >
                                    {tag}
                                  </Badge>
                                ))
                            ) : (
                              <span className='text-muted-foreground text-xs'>
                                {t('table.noTags')}
                              </span>
                            )}
                            {doc.tags &&
                              doc.tags.split(',').filter(Boolean).length >
                                2 && (
                                <Badge variant='secondary' className='text-xs'>
                                  +
                                  {doc.tags.split(',').filter(Boolean).length -
                                    2}
                                </Badge>
                              )}
                          </div>
                        </TableCell>
                        <TableCell>{doc._count.attachments || 0}</TableCell>
                        <TableCell>
                          <div className='flex items-center space-x-1'>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant='ghost' size='icon' asChild>
                                    <Link
                                      href={`/dashboard/documents/${doc.id}`}
                                    >
                                      <Eye className='h-4 w-4' />
                                    </Link>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>查看</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            {canEditDocument && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant='ghost' size='icon' asChild>
                                      <Link
                                        href={`/dashboard/documents/${doc.id}/edit`}
                                      >
                                        <Edit2 className='h-4 w-4' />
                                      </Link>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{t('actions.edit')}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}

                            {doc.author.id === doc.currentUserId && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant='ghost'
                                      size='icon'
                                      onClick={() => openMoveDialog(doc)}
                                    >
                                      <ArrowRightLeft className='h-4 w-4' />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{t('actions.move')}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}

                            {canDeleteDocument && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant='ghost'
                                      size='icon'
                                      onClick={() => openDeleteDialog(doc)}
                                    >
                                      <Trash2 className='text-destructive h-4 w-4' />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{t('actions.delete')}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className='text-muted-foreground py-6 text-center'
                      >
                        {searchQuery || statusFilter || folderFilter ? (
                          <>{t('empty.noMatching')}</>
                        ) : (
                          <>
                            {t('empty.personal')}
                            {canCreateDocument && (
                              <Link
                                href='/dashboard/documents/new'
                                className='text-primary ml-1 hover:underline'
                              >
                                创建一个新文档
                              </Link>
                            )}
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value='project' className='mt-0'>
          <Card>
            <ScrollArea className='max-h-[60vh]'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('table.title')}</TableHead>
                    <TableHead>{t('table.project')}</TableHead>
                    <TableHead>{t('table.status')}</TableHead>
                    <TableHead>{t('table.createdAt')}</TableHead>
                    <TableHead>{t('table.author')}</TableHead>
                    <TableHead>{t('table.attachments')}</TableHead>
                    <TableHead className='w-[150px]'>
                      {t('table.actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjectDocuments.length > 0 ? (
                    filteredProjectDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className='flex items-center space-x-2'>
                            <FileText className='text-muted-foreground h-4 w-4' />
                            <Link
                              href={`/dashboard/documents/${doc.id}`}
                              className='font-medium hover:underline'
                            >
                              {doc.title}
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/dashboard/projects/${doc.projectId}`}
                            className='hover:underline'
                          >
                            {doc.project?.name || '-'}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              (statusMap[doc.status as keyof typeof statusMap]
                                ?.variant as any) || 'default'
                            }
                          >
                            {statusMap[doc.status as keyof typeof statusMap]
                              ?.label || doc.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(doc.createdAt), 'yyyy-MM-dd')}
                        </TableCell>
                        <TableCell>{doc.author.name}</TableCell>
                        <TableCell>{doc._count.attachments || 0}</TableCell>
                        <TableCell>
                          <div className='flex items-center space-x-1'>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant='ghost' size='icon' asChild>
                                    <Link
                                      href={`/dashboard/documents/${doc.id}`}
                                    >
                                      <Eye className='h-4 w-4' />
                                    </Link>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>查看</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            {canEditDocument &&
                              doc.author.id === doc.currentUserId && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant='ghost'
                                        size='icon'
                                        asChild
                                      >
                                        <Link
                                          href={`/dashboard/projects/${doc.projectId}/documents/${doc.id}/edit`}
                                        >
                                          <Edit2 className='h-4 w-4' />
                                        </Link>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{t('actions.edit')}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}

                            {doc.author.id === doc.currentUserId && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant='ghost'
                                      size='icon'
                                      onClick={() => openMoveDialog(doc)}
                                    >
                                      <ArrowRightLeft className='h-4 w-4' />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{t('actions.move')}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}

                            {canDeleteDocument &&
                              doc.author.id === doc.currentUserId && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant='ghost'
                                        size='icon'
                                        onClick={() => openDeleteDialog(doc)}
                                      >
                                        <Trash2 className='text-destructive h-4 w-4' />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{t('actions.delete')}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className='text-muted-foreground py-6 text-center'
                      >
                        {searchQuery || statusFilter || projectFilter ? (
                          <>{t('empty.project')}</>
                        ) : (
                          <>{t('empty.noProjectDocs')}</>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 删除确认对话框 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='flex items-center'>
              <AlertTriangle className='text-destructive mr-2 h-5 w-5' />
              {t('deleteDialog.title')}
            </DialogTitle>
            <DialogDescription>
              {t('deleteDialog.content', {
                title: documentToDelete?.title || ''
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              {t('deleteDialog.cancel')}
            </Button>
            <Button
              variant='destructive'
              onClick={handleDeleteDocument}
              disabled={isDeleting}
            >
              {isDeleting ? t('deleteDialog.deleting') : t('actions.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 文档移动对话框 */}
      {documentToMove && (
        <DocumentMoveDialog
          documentId={documentToMove.id}
          documentTitle={documentToMove.title}
          currentProjectId={documentToMove.projectId}
          isOpen={isMoveDialogOpen}
          onClose={() => {
            setIsMoveDialogOpen(false);
            setDocumentToMove(null);
          }}
          projects={projects}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function Card({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-card text-card-foreground rounded-lg border shadow-sm ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
}
