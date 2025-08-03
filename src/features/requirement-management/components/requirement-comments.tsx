'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
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
  MessageSquare,
  Send,
  MoreHorizontal,
  Edit,
  Trash2,
  Reply,
  Heart,
  Pin,
  Flag,
  Quote
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale/zh-CN';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Comment {
  id: string;
  content: string;
  type: 'COMMENT' | 'REVIEW' | 'APPROVAL' | 'REJECTION';
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  replies: Comment[];
  likes: Array<{
    user: {
      id: string;
      name: string;
    };
  }>;
  parentId?: string;
}

interface RequirementCommentsProps {
  requirementId: string;
}

const commentTypeConfig = {
  COMMENT: { label: '评论', color: 'bg-gray-100 text-gray-800' },
  REVIEW: { label: '评审', color: 'bg-blue-100 text-blue-800' },
  APPROVAL: { label: '批准', color: 'bg-green-100 text-green-800' },
  REJECTION: { label: '拒绝', color: 'bg-red-100 text-red-800' }
};

export function RequirementComments({
  requirementId
}: RequirementCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<
    'COMMENT' | 'REVIEW' | 'APPROVAL' | 'REJECTION'
  >('COMMENT');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchComments();
  }, [requirementId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/requirements/${requirementId}/comments`
      );
      if (!response.ok) {
        throw new Error('获取评论失败');
      }

      const data = await response.json();
      setComments(data.data);
    } catch (error) {
      console.error('获取评论失败:', error);
      toast({
        title: '错误',
        description: '获取评论失败，请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(
        `/api/requirements/${requirementId}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: newComment,
            type: commentType
          })
        }
      );

      if (!response.ok) {
        throw new Error('发表评论失败');
      }

      toast({
        title: '成功',
        description: '评论已发表'
      });

      setNewComment('');
      setCommentType('COMMENT');
      fetchComments();
    } catch (error) {
      console.error('发表评论失败:', error);
      toast({
        title: '错误',
        description: '发表评论失败，请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim()) {
      return;
    }

    try {
      const response = await fetch(
        `/api/requirements/${requirementId}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: replyContent,
            type: 'COMMENT',
            parentId
          })
        }
      );

      if (!response.ok) {
        throw new Error('回复失败');
      }

      toast({
        title: '成功',
        description: '回复已发表'
      });

      setReplyTo(null);
      setReplyContent('');
      fetchComments();
    } catch (error) {
      console.error('回复失败:', error);
      toast({
        title: '错误',
        description: '回复失败，请稍后重试',
        variant: 'destructive'
      });
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) {
      return;
    }

    try {
      const response = await fetch(
        `/api/requirements/${requirementId}/comments/${commentId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: editContent
          })
        }
      );

      if (!response.ok) {
        throw new Error('编辑评论失败');
      }

      toast({
        title: '成功',
        description: '评论已更新'
      });

      setEditingComment(null);
      setEditContent('');
      fetchComments();
    } catch (error) {
      console.error('编辑评论失败:', error);
      toast({
        title: '错误',
        description: '编辑评论失败，请稍后重试',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete) {
      return;
    }

    try {
      const response = await fetch(
        `/api/requirements/${requirementId}/comments/${commentToDelete}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        throw new Error('删除评论失败');
      }

      toast({
        title: '成功',
        description: '评论已删除'
      });

      setShowDeleteDialog(false);
      setCommentToDelete(null);
      fetchComments();
    } catch (error) {
      console.error('删除评论失败:', error);
      toast({
        title: '错误',
        description: '删除评论失败，请稍后重试',
        variant: 'destructive'
      });
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      const response = await fetch(
        `/api/requirements/${requirementId}/comments/${commentId}/like`,
        {
          method: 'POST'
        }
      );

      if (!response.ok) {
        throw new Error('点赞失败');
      }

      fetchComments();
    } catch (error) {
      console.error('点赞失败:', error);
      toast({
        title: '错误',
        description: '点赞失败，请稍后重试',
        variant: 'destructive'
      });
    }
  };

  const handlePinComment = async (commentId: string) => {
    try {
      const response = await fetch(
        `/api/requirements/${requirementId}/comments/${commentId}/pin`,
        {
          method: 'POST'
        }
      );

      if (!response.ok) {
        throw new Error('置顶失败');
      }

      toast({
        title: '成功',
        description: '评论已置顶'
      });

      fetchComments();
    } catch (error) {
      console.error('置顶失败:', error);
      toast({
        title: '错误',
        description: '置顶失败，请稍后重试',
        variant: 'destructive'
      });
    }
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div
      key={comment.id}
      className={cn(
        'space-y-3',
        isReply && 'ml-12 border-l-2 border-gray-100 pl-4',
        comment.isPinned &&
          'rounded-lg border border-yellow-200 bg-yellow-50 p-4'
      )}
    >
      <div className='flex items-start space-x-3'>
        <Avatar className='h-8 w-8'>
          <AvatarImage src={comment.author.avatar} />
          <AvatarFallback>{comment.author.name.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div className='flex-1 space-y-2'>
          <div className='flex items-center space-x-2'>
            <span className='font-medium'>{comment.author.name}</span>
            <Badge className={commentTypeConfig[comment.type].color}>
              {commentTypeConfig[comment.type].label}
            </Badge>
            {comment.isPinned && (
              <Badge variant='outline' className='text-yellow-600'>
                <Pin className='mr-1 h-3 w-3' />
                置顶
              </Badge>
            )}
            <span className='text-muted-foreground text-sm'>
              {formatDistanceToNow(new Date(comment.createdAt), {
                addSuffix: true,
                locale: zhCN
              })}
            </span>
            {comment.updatedAt !== comment.createdAt && (
              <span className='text-muted-foreground text-sm'>(已编辑)</span>
            )}
          </div>

          {editingComment === comment.id ? (
            <div className='space-y-2'>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder='编辑评论内容'
                className='min-h-[80px]'
              />
              <div className='flex items-center space-x-2'>
                <Button size='sm' onClick={() => handleEditComment(comment.id)}>
                  保存
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => {
                    setEditingComment(null);
                    setEditContent('');
                  }}
                >
                  取消
                </Button>
              </div>
            </div>
          ) : (
            <div className='prose prose-sm max-w-none'>
              <p className='whitespace-pre-wrap'>{comment.content}</p>
            </div>
          )}

          <div className='flex items-center space-x-4'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => handleLikeComment(comment.id)}
              className='text-muted-foreground hover:text-red-600'
            >
              <Heart className='mr-1 h-4 w-4' />
              {comment.likes.length}
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setReplyTo(comment.id)}
              className='text-muted-foreground'
            >
              <Reply className='mr-1 h-4 w-4' />
              回复
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='sm'
                  className='text-muted-foreground'
                >
                  <MoreHorizontal className='h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem
                  onClick={() => {
                    setEditingComment(comment.id);
                    setEditContent(comment.content);
                  }}
                >
                  <Edit className='mr-2 h-4 w-4' />
                  编辑
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handlePinComment(comment.id)}>
                  <Pin className='mr-2 h-4 w-4' />
                  {comment.isPinned ? '取消置顶' : '置顶'}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Quote className='mr-2 h-4 w-4' />
                  引用
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Flag className='mr-2 h-4 w-4' />
                  举报
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setCommentToDelete(comment.id);
                    setShowDeleteDialog(true);
                  }}
                  className='text-red-600'
                >
                  <Trash2 className='mr-2 h-4 w-4' />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* 回复表单 */}
          {replyTo === comment.id && (
            <div className='mt-3 space-y-2'>
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`回复 ${comment.author.name}...`}
                className='min-h-[80px]'
              />
              <div className='flex items-center space-x-2'>
                <Button size='sm' onClick={() => handleReply(comment.id)}>
                  <Send className='mr-1 h-4 w-4' />
                  发送回复
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => {
                    setReplyTo(null);
                    setReplyContent('');
                  }}
                >
                  取消
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 回复列表 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className='space-y-3'>
          {comment.replies.map((reply) => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className='space-y-4'>
        {[...Array(3)].map((_, i) => (
          <div key={i} className='flex space-x-3'>
            <div className='h-8 w-8 animate-pulse rounded-full bg-gray-200' />
            <div className='flex-1 space-y-2'>
              <div className='h-4 animate-pulse rounded bg-gray-200' />
              <div className='h-16 animate-pulse rounded bg-gray-200' />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* 发表新评论 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <MessageSquare className='mr-2 h-5 w-5' />
            发表评论
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <div className='flex items-center space-x-2'>
              <span className='text-sm font-medium'>评论类型：</span>
              {Object.entries(commentTypeConfig).map(([type, config]) => (
                <Button
                  key={type}
                  variant={commentType === type ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setCommentType(type as any)}
                >
                  {config.label}
                </Button>
              ))}
            </div>
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder='写下你的评论...'
              className='min-h-[120px]'
            />
          </div>
          <div className='flex items-center justify-between'>
            <div className='text-muted-foreground text-sm'>
              支持 Markdown 格式
            </div>
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || submitting}
            >
              <Send className='mr-2 h-4 w-4' />
              {submitting ? '发表中...' : '发表评论'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 评论列表 */}
      <Card>
        <CardHeader>
          <CardTitle>评论讨论</CardTitle>
          <CardDescription>共 {comments.length} 条评论</CardDescription>
        </CardHeader>
        <CardContent>
          {comments.length === 0 ? (
            <div className='py-12 text-center'>
              <MessageSquare className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
              <h3 className='mb-2 text-lg font-medium'>暂无评论</h3>
              <p className='text-muted-foreground'>成为第一个发表评论的人</p>
            </div>
          ) : (
            <div className='space-y-6'>
              {comments.map((comment) => renderComment(comment))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除这条评论吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowDeleteDialog(false)}
            >
              取消
            </Button>
            <Button variant='destructive' onClick={handleDeleteComment}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
