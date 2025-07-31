'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save, Upload, Trash2 } from 'lucide-react';
import dynamic from 'next/dynamic';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ProjectSelector } from '@/features/project-management/components/project/project-selector';

// 动态导入Markdown编辑器，避免SSR问题
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className='bg-muted flex h-64 w-full items-center justify-center rounded-md'>
        <Loader2 className='text-primary h-8 w-8 animate-spin' />
        <span className='ml-2'>加载编辑器...</span>
      </div>
    )
  }
);

// 文档表单验证
const documentFormSchema = z.object({
  title: z.string().min(1, '文档标题不能为空'),
  content: z.string().optional(),
  format: z.enum(['MARKDOWN', 'RICH_TEXT', 'PLAIN_TEXT']).default('MARKDOWN'),
  status: z.enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  folderId: z.string().optional().nullable(),
  isPrivate: z.boolean().default(false),
  tags: z.string().optional()
});

// 允许的文件类型
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/svg+xml'
];

// 最大文件大小: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

type DocumentFormValues = z.infer<typeof documentFormSchema>;

interface Attachment {
  id: string;
  name: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  uploaderId: string;
}

interface DocumentFormProps {
  documentId?: string; // 如果是编辑模式，提供文档ID
  projectId?: string; // 如果是项目文档，提供项目ID
  folders?: {
    id: string;
    name: string;
  }[];
  document?: any; // 如果是编辑模式，传入文档数据
  type?: 'PERSONAL' | 'PROJECT'; // 文档类型，用于UI显示和路径处理
  returnTo?: string; // 提交后的重定向地址
  projects?: {
    id: string;
    name: string;
    status: string;
  }[]; // 可选的项目列表，用于项目选择器
  enableAttachmentCreation?: boolean; // 是否在新建文档时允许添加附件
  showProjectSelector?: boolean; // 是否显示项目选择器
}

export function DocumentForm({
  documentId,
  projectId,
  folders = [],
  document,
  type = 'PERSONAL',
  returnTo = '/dashboard/documents',
  projects = [],
  enableAttachmentCreation = false,
  showProjectSelector = false
}: DocumentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [content, setContent] = useState<string>(document?.content || '');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(
    projectId || null
  );
  const [tempAttachments, setTempAttachments] = useState<File[]>([]);
  const [tags, setTags] = useState<string[]>(
    document?.tags ? document.tags.split(',').filter(Boolean) : []
  );
  const [tagInput, setTagInput] = useState('');

  // 默认值
  const defaultValues: Partial<DocumentFormValues> = {
    title: document?.title || '',
    content: document?.content || '',
    format: document?.format || 'MARKDOWN',
    status: document?.status || 'DRAFT',
    folderId: document?.folderId || null,
    isPrivate: document?.isPrivate || false,
    tags: document?.tags || []
  };

  // 表单
  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentFormSchema),
    defaultValues,
    mode: 'onChange'
  });

  // 内容变化时更新表单值
  useEffect(() => {
    form.setValue('content', content);
  }, [content, form]);

  // 加载附件列表
  const loadAttachments = useCallback(async () => {
    if (!documentId) return;

    try {
      const url =
        type === 'PERSONAL'
          ? `/api/documents/${documentId}/attachments`
          : `/api/projects/${projectId}/documents/${documentId}/attachments`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('加载附件失败');
      }

      const data = await response.json();
      if (data.success) {
        setAttachments(data.data);
      }
    } catch (error) {
      console.error('加载附件失败:', error);
      toast.error('加载附件失败');
    }
  }, [documentId, type, projectId]);

  // 组件加载时获取附件列表
  useEffect(() => {
    if (documentId) {
      loadAttachments();
    }
  }, [documentId, loadAttachments]);

  // 处理标签添加
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      form.setValue('tags', newTags.join(','));
      setTagInput('');
    }
  };

  // 处理标签删除
  const handleRemoveTag = (tag: string) => {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    form.setValue('tags', newTags.join(','));
  };

  // 处理文件上传
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // 检查文件类型
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error('不支持的文件类型');
      return;
    }

    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      toast.error('文件大小不能超过10MB');
      return;
    }

    if (!documentId) {
      // 如果是新建文档，且启用了附件创建功能，则添加到临时附件列表
      if (enableAttachmentCreation) {
        setTempAttachments([...tempAttachments, file]);
        toast.success(`已添加附件: ${file.name}`);
        // 清除input的值，允许上传相同的文件
        event.target.value = '';
        return;
      } else {
        toast.error('请先保存文档，然后再上传附件');
        return;
      }
    }

    setIsUploadingFile(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const url =
        type === 'PERSONAL'
          ? `/api/documents/${documentId}/attachments`
          : `/api/projects/${projectId}/documents/${documentId}/attachments`;

      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('上传附件失败');
      }

      const result = await response.json();
      if (result.success) {
        toast.success('附件上传成功');
        loadAttachments(); // 重新加载附件列表
      } else {
        throw new Error(result.error?.message || '上传附件失败');
      }
    } catch (error) {
      console.error('上传附件失败:', error);
      toast.error('上传附件失败');
    } finally {
      setIsUploadingFile(false);
      // 清除input的值，允许上传相同的文件
      event.target.value = '';
    }
  };

  // 处理附件删除
  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!documentId) return;

    if (!confirm('确定要删除此附件吗？')) return;

    try {
      const url =
        type === 'PERSONAL'
          ? `/api/documents/${documentId}/attachments/${attachmentId}`
          : `/api/projects/${projectId}/documents/${documentId}/attachments/${attachmentId}`;

      const response = await fetch(url, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('删除附件失败');
      }

      const result = await response.json();
      if (result.success) {
        toast.success('附件已删除');
        // 从状态中移除附件
        setAttachments(attachments.filter((a) => a.id !== attachmentId));
      } else {
        throw new Error(result.error?.message || '删除附件失败');
      }
    } catch (error) {
      console.error('删除附件失败:', error);
      toast.error('删除附件失败');
    }
  };

  // 处理删除临时附件
  const handleRemoveTempAttachment = (index: number) => {
    const newAttachments = [...tempAttachments];
    newAttachments.splice(index, 1);
    setTempAttachments(newAttachments);
  };

  // 提交表单
  const onSubmit = async (values: DocumentFormValues) => {
    setIsSubmitting(true);
    values.content = content; // 确保使用最新的内容

    // 处理标签 - 确保是字符串而不是数组
    if (Array.isArray(values.tags)) {
      values.tags = values.tags.join(',');
    }

    console.log('表单提交前数据:', { type, selectedProject, projectId });

    // 如果是项目文档类型或选择了项目，设置项目ID和文档类型
    if (type === 'PROJECT') {
      values.type = 'PROJECT';

      // 如果用户选择了项目，使用选择的项目
      if (selectedProject) {
        values.projectId = selectedProject;
        console.log('使用用户选择的项目ID:', selectedProject);
      }
      // 否则如果有传入的项目ID，使用传入的项目ID
      else if (projectId) {
        values.projectId = projectId;
        console.log('使用传入的项目ID:', projectId);
      }
      // 如果没有项目ID，抛出错误
      else {
        console.error('项目文档必须选择项目');
        throw new Error('项目文档必须选择项目');
      }
    } else if (selectedProject) {
      // 如果是个人文档但选择了项目
      values.projectId = selectedProject;
      values.type = 'PROJECT';
      console.log('个人文档模式但选择了项目:', selectedProject);
    }

    try {
      // 确定API请求的URL和方法
      let url: string;
      let method: string;

      // 确定是否为项目文档（如果有项目ID）
      const isProjectDocument = type === 'PROJECT' || selectedProject;

      if (!isProjectDocument) {
        // 个人文档
        url = documentId ? `/api/documents/${documentId}` : '/api/documents';
        method = documentId ? 'PATCH' : 'POST';
        values.projectId = null; // 个人文档不关联项目
      } else {
        // 项目文档 - 这里已经在前面验证了projectId，所以values.projectId一定存在
        if (!values.projectId) {
          throw new Error('项目文档必须选择项目');
        }
        url = documentId
          ? `/api/projects/${values.projectId}/documents/${documentId}`
          : `/api/projects/${values.projectId}/documents`;
        method = documentId ? 'PATCH' : 'POST';
      }

      console.log('请求URL:', url);
      console.log('请求方法:', method);
      console.log('请求数据:', values);

      // 发送请求
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      const data = await response.json();
      console.log('API 响应:', data);

      if (data.success) {
        if (documentId) {
          toast.success('文档已更新');
        } else {
          if (values.projectId) {
            toast.success('项目文档已创建，正在返回文档列表...');
          } else {
            toast.success('个人文档已创建');
          }
        }

        if (!documentId) {
          // 如果是新建文档，重定向到新文档的编辑页面
          const newDocId = data.data.id;

          // 如果有临时附件，上传它们
          if (tempAttachments.length > 0) {
            toast.info('正在上传附件，请稍候...');

            for (const file of tempAttachments) {
              const formData = new FormData();
              formData.append('file', file);

              const attachmentUrl = !values.projectId
                ? `/api/documents/${newDocId}/attachments`
                : `/api/projects/${values.projectId}/documents/${newDocId}/attachments`;

              try {
                const attachmentResponse = await fetch(attachmentUrl, {
                  method: 'POST',
                  body: formData
                });

                if (!attachmentResponse.ok) {
                  throw new Error(`上传附件 ${file.name} 失败`);
                }
              } catch (error) {
                console.error('上传附件失败:', error);
                toast.error(`上传附件 ${file.name} 失败`);
              }
            }

            toast.success('附件上传完成');
          }

          if (!values.projectId) {
            // 个人文档
            router.push(`/dashboard/documents/${newDocId}`);
          } else {
            // 项目文档 - 跳转回文档管理页面的项目文档选项卡，并自动选择对应项目
            router.push(
              `/dashboard/documents?tab=project&projectId=${values.projectId}`
            );
          }
        } else if (returnTo) {
          // 如果指定了返回地址，则重定向
          router.push(returnTo);
        }

        // 刷新页面数据
        router.refresh();
      } else {
        throw new Error(data.error?.message || '操作失败');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '未知错误');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
        {/* 项目选择部分 */}
        {showProjectSelector && projects.length > 0 && (
          <div className='mb-6'>
            <FormLabel>项目选择</FormLabel>
            <div className='mt-2 flex items-center gap-4'>
              <ProjectSelector
                projects={projects}
                currentProjectId={selectedProject || ''}
                onProjectChange={(projectId) => {
                  if (projectId === 'all') {
                    setSelectedProject(null);
                  } else {
                    setSelectedProject(projectId);
                  }
                }}
              />
            </div>
            <FormDescription>选择关联的项目</FormDescription>
          </div>
        )}

        <FormField
          control={form.control}
          name='title'
          render={({ field }) => (
            <FormItem>
              <FormLabel>文档标题</FormLabel>
              <FormControl>
                <Input placeholder='输入文档标题' {...field} />
              </FormControl>
              <FormDescription>简明扼要的文档标题</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Markdown编辑器 */}
        <FormField
          control={form.control}
          name='content'
          render={({ field }) => (
            <FormItem>
              <FormLabel>文档内容</FormLabel>
              <FormControl>
                <div data-color-mode='light'>
                  <MDEditor
                    value={content}
                    onChange={(value) => setContent(value || '')}
                    height={400}
                    preview='edit'
                  />
                </div>
              </FormControl>
              <FormDescription>使用Markdown格式编辑文档内容</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          <FormField
            control={form.control}
            name='status'
            render={({ field }) => (
              <FormItem>
                <FormLabel>文档状态</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='选择文档状态' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='DRAFT'>草稿</SelectItem>
                    <SelectItem value='REVIEW'>审核中</SelectItem>
                    <SelectItem value='PUBLISHED'>已发布</SelectItem>
                    <SelectItem value='ARCHIVED'>已归档</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>文档的当前状态</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {folders.length > 0 && (
            <FormField
              control={form.control}
              name='folderId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>文件夹</FormLabel>
                  <Select
                    onValueChange={(val) =>
                      field.onChange(val === '' ? null : val)
                    }
                    value={field.value || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='选择文件夹' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value=''>不分配文件夹</SelectItem>
                      {folders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          {folder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>选择文档所属的文件夹</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* 标签输入 */}
        <div>
          <FormLabel>标签</FormLabel>
          <div className='mb-2 flex items-center space-x-2'>
            <Input
              placeholder='添加标签'
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button type='button' variant='outline' onClick={handleAddTag}>
              添加
            </Button>
          </div>
          <div className='mt-2 flex flex-wrap gap-2'>
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant='secondary'
                className='flex items-center gap-1'
              >
                {tag}
                <button
                  type='button'
                  className='hover:text-destructive ml-1 rounded-full text-xs'
                  onClick={() => handleRemoveTag(tag)}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
          <FormDescription>
            为文档添加标签，按Enter或点击添加按钮添加
          </FormDescription>
        </div>

        <FormField
          control={form.control}
          name='isPrivate'
          render={({ field }) => (
            <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
              <div className='space-y-0.5'>
                <FormLabel className='text-base'>私密文档</FormLabel>
                <FormDescription>启用后，文档将仅对您可见</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* 附件管理部分 */}
        {(documentId || enableAttachmentCreation) && (
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <FormLabel>附件</FormLabel>
              <div className='relative'>
                <Input
                  type='file'
                  id='file-upload'
                  className='hidden'
                  onChange={handleFileUpload}
                  disabled={isUploadingFile}
                />
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  disabled={isUploadingFile}
                  onClick={() =>
                    window.document.getElementById('file-upload')?.click()
                  }
                >
                  {isUploadingFile ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      上传中...
                    </>
                  ) : (
                    <>
                      <Upload className='mr-2 h-4 w-4' />
                      上传附件
                    </>
                  )}
                </Button>
              </div>
            </div>

            {documentId ? (
              // 编辑模式，显示已保存的附件
              attachments.length > 0 ? (
                <div className='space-y-2'>
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className='flex items-center justify-between rounded border p-2'
                    >
                      <div className='flex items-center'>
                        <a
                          href={attachment.filePath}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-blue-600 hover:underline'
                        >
                          {attachment.name}
                        </a>
                        <span className='ml-2 text-xs text-gray-500'>
                          ({Math.round(attachment.fileSize / 1024)} KB)
                        </span>
                      </div>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => handleDeleteAttachment(attachment.id)}
                      >
                        <Trash2 className='text-destructive h-4 w-4' />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-muted-foreground rounded border py-4 text-center'>
                  暂无附件
                </div>
              )
            ) : // 创建模式，显示临时附件
            tempAttachments.length > 0 ? (
              <div className='space-y-2'>
                {tempAttachments.map((file, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between rounded border p-2'
                  >
                    <div className='flex items-center'>
                      <span className='text-blue-600'>{file.name}</span>
                      <span className='ml-2 text-xs text-gray-500'>
                        ({Math.round(file.size / 1024)} KB)
                      </span>
                    </div>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => handleRemoveTempAttachment(index)}
                    >
                      <Trash2 className='text-destructive h-4 w-4' />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-muted-foreground rounded border py-4 text-center'>
                暂无附件
              </div>
            )}
            <FormDescription>
              支持上传各种文件格式，单个文件大小不超过10MB
            </FormDescription>
          </div>
        )}

        <div className='flex justify-end gap-4'>
          <Button
            type='button'
            variant='outline'
            onClick={() => router.push(returnTo)}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                保存中...
              </>
            ) : (
              <>
                <Save className='mr-2 h-4 w-4' />
                {documentId ? '更新文档' : '创建文档'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
