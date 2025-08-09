'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
  MessageCircle,
  Send,
  MoreHorizontal,
  Edit,
  Trash2,
  Reply,
  Heart,
  Flag,
  Pin,
  Clock,
  Check,
  X
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  };
  createdAt: Date;
  updatedAt?: Date;
  isEdited?: boolean;
  isPinned?: boolean;
  likes?: number;
  isLiked?: boolean;
  replies?: Comment[];
  parentId?: string;
  mentions?: string[];
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];
}

interface RequirementCommentsProps {
  requirementId: string;
  comments?: Comment[];
  loading?: boolean;
  canComment?: boolean;
  canModerate?: boolean;
  onAddComment?: (content: string, parentId?: string) => void;
  onEditComment?: (commentId: string, content: string) => void;
  onDeleteComment?: (commentId: string) => void;
  onLikeComment?: (commentId: string) => void;
  onPinComment?: (commentId: string) => void;
  onReportComment?: (commentId: string, reason: string) => void;
}

// Mock data for demonstration
const mockComments: Comment[] = [
  {
    id: '1',
    content:
      'This requirement looks comprehensive. I have a few questions about the multi-factor authentication implementation. Should we support both SMS and authenticator apps?',
    author: {
      id: 'user1',
      name: 'Alice Johnson',
      avatar: '/avatars/alice.jpg',
      role: 'Product Manager'
    },
    createdAt: new Date('2024-01-15T10:30:00'),
    isPinned: true,
    likes: 3,
    isLiked: false,
    replies: [
      {
        id: '2',
        content:
          'Yes, we should support both. SMS for basic users and authenticator apps for power users. We can make it configurable in user settings.',
        author: {
          id: 'user2',
          name: 'Bob Smith',
          avatar: '/avatars/bob.jpg',
          role: 'Tech Lead'
        },
        createdAt: new Date('2024-01-15T11:15:00'),
        parentId: '1',
        likes: 2,
        isLiked: true
      }
    ]
  },
  {
    id: '3',
    content:
      'I think we should also consider implementing social login options like Google, GitHub, and Microsoft. This would improve user experience significantly.',
    author: {
      id: 'user3',
      name: 'Carol Davis',
      avatar: '/avatars/carol.jpg',
      role: 'UX Designer'
    },
    createdAt: new Date('2024-01-16T09:45:00'),
    updatedAt: new Date('2024-01-16T09:50:00'),
    isEdited: true,
    likes: 1,
    isLiked: false
  },
  {
    id: '4',
    content:
      'What about password complexity requirements? Should we enforce specific rules or make them configurable by administrators?',
    author: {
      id: 'user4',
      name: 'David Wilson',
      avatar: '/avatars/david.jpg',
      role: 'Security Engineer'
    },
    createdAt: new Date('2024-01-17T14:20:00'),
    likes: 0,
    isLiked: false
  }
];

export function RequirementComments({
  requirementId,
  comments = mockComments,
  loading = false,
  canComment = true,
  canModerate = false,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onLikeComment,
  onPinComment,
  onReportComment
}: RequirementCommentsProps) {
  const t = useTranslations('requirements');
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddComment?.(newComment, replyingTo || undefined);
      setNewComment('');
      setReplyingTo(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      await onEditComment?.(commentId, editContent);
      setEditingComment(null);
      setEditContent('');
    } catch (error) {
      console.error('Failed to edit comment:', error);
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
  };

  const handleLike = (commentId: string) => {
    onLikeComment?.(commentId);
  };

  const handlePin = (commentId: string) => {
    onPinComment?.(commentId);
  };

  const handleDelete = (commentId: string) => {
    onDeleteComment?.(commentId);
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isEditing = editingComment === comment.id;

    return (
      <div
        key={comment.id}
        className={cn(
          'space-y-3',
          isReply && 'ml-12 border-l-2 border-gray-100 pl-4'
        )}
      >
        <div className='flex gap-3'>
          <Avatar className='h-8 w-8 flex-shrink-0'>
            <AvatarImage src={comment.author.avatar} />
            <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
          </Avatar>

          <div className='flex-1 space-y-2'>
            {/* Author and timestamp */}
            <div className='flex flex-wrap items-center gap-2'>
              <span className='text-sm font-medium'>{comment.author.name}</span>
              {comment.author.role && (
                <Badge variant='secondary' className='text-xs'>
                  {comment.author.role}
                </Badge>
              )}
              {comment.isPinned && (
                <Badge variant='outline' className='text-xs'>
                  <Pin className='mr-1 h-3 w-3' />
                  Pinned
                </Badge>
              )}
              <span className='text-xs text-gray-500'>
                {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
              </span>
              {comment.isEdited && (
                <span className='text-xs text-gray-400'>(edited)</span>
              )}
            </div>

            {/* Comment content */}
            <div className='rounded-lg bg-gray-50 p-3'>
              {isEditing ? (
                <div className='space-y-2'>
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className='min-h-[80px] resize-none'
                    placeholder='Edit your comment...'
                  />
                  <div className='flex gap-2'>
                    <Button
                      size='sm'
                      onClick={() => handleEditComment(comment.id)}
                      disabled={!editContent.trim()}
                    >
                      <Check className='mr-1 h-4 w-4' />
                      Save
                    </Button>
                    <Button size='sm' variant='outline' onClick={cancelEdit}>
                      <X className='mr-1 h-4 w-4' />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className='text-sm whitespace-pre-wrap'>{comment.content}</p>
              )}
            </div>

            {/* Comment actions */}
            {!isEditing && (
              <div className='flex items-center gap-4'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => handleLike(comment.id)}
                  className={cn(
                    'h-8 px-2 text-xs',
                    comment.isLiked && 'text-red-500'
                  )}
                >
                  <Heart
                    className={cn(
                      'mr-1 h-4 w-4',
                      comment.isLiked && 'fill-current'
                    )}
                  />
                  {comment.likes || 0}
                </Button>

                {!isReply && (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setReplyingTo(comment.id)}
                    className='h-8 px-2 text-xs'
                  >
                    <Reply className='mr-1 h-4 w-4' />
                    Reply
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                      <MoreHorizontal className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    {comment.author.id === 'current-user' && (
                      <>
                        <DropdownMenuItem onClick={() => startEdit(comment)}>
                          <Edit className='mr-2 h-4 w-4' />
                          Edit
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash2 className='mr-2 h-4 w-4' />
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Comment
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this comment?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(comment.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                    {canModerate && (
                      <>
                        <DropdownMenuItem onClick={() => handlePin(comment.id)}>
                          <Pin className='mr-2 h-4 w-4' />
                          {comment.isPinned ? 'Unpin' : 'Pin'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            onReportComment?.(comment.id, 'inappropriate')
                          }
                        >
                          <Flag className='mr-2 h-4 w-4' />
                          Report
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Reply form */}
            {replyingTo === comment.id && (
              <div className='mt-3 space-y-2'>
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={`Reply to ${comment.author.name}...`}
                  className='min-h-[80px] resize-none'
                />
                <div className='flex gap-2'>
                  <Button
                    size='sm'
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || isSubmitting}
                  >
                    <Send className='mr-1 h-4 w-4' />
                    Reply
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => {
                      setReplyingTo(null);
                      setNewComment('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className='mt-4 space-y-4'>
                {comment.replies.map((reply) => renderComment(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <MessageCircle className='h-5 w-5' />
            Comments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {[...Array(3)].map((_, i) => (
              <div key={i} className='flex animate-pulse gap-3'>
                <div className='h-8 w-8 flex-shrink-0 rounded-full bg-gray-200'></div>
                <div className='flex-1 space-y-2'>
                  <div className='h-4 w-1/4 rounded bg-gray-200'></div>
                  <div className='h-16 rounded bg-gray-200'></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <MessageCircle className='h-5 w-5' />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Add new comment */}
        {canComment && !replyingTo && (
          <div className='space-y-3'>
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder='Add a comment...'
              className='min-h-[100px] resize-none'
            />
            <div className='flex justify-end'>
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
              >
                <Send className='mr-2 h-4 w-4' />
                {isSubmitting ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>
          </div>
        )}

        {/* Comments list */}
        {comments.length > 0 ? (
          <div className='space-y-6'>
            {comments
              .sort((a, b) => {
                // Pinned comments first
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                // Then by creation date (newest first)
                return (
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
                );
              })
              .map((comment) => renderComment(comment))}
          </div>
        ) : (
          <div className='py-8 text-center'>
            <MessageCircle className='mx-auto mb-4 h-12 w-12 text-gray-300' />
            <p className='mb-2 text-gray-500'>No comments yet</p>
            <p className='text-sm text-gray-400'>
              Be the first to share your thoughts on this requirement.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RequirementComments;
