'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  History,
  Clock,
  User,
  Edit,
  Plus,
  Trash2,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  FileText,
  Tag,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Target,
  Zap,
  Filter,
  Search,
  RotateCcw
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

interface HistoryEntry {
  id: string;
  action:
    | 'created'
    | 'updated'
    | 'status_changed'
    | 'assigned'
    | 'commented'
    | 'deleted'
    | 'restored';
  field?: string;
  oldValue?: any;
  newValue?: any;
  description?: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  };
  timestamp: Date;
  metadata?: {
    ip?: string;
    userAgent?: string;
    source?: 'web' | 'api' | 'mobile';
  };
}

interface RequirementHistoryProps {
  requirementId: string;
  history?: HistoryEntry[];
  loading?: boolean;
  canRevert?: boolean;
  onRevert?: (entryId: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

// Mock data for demonstration
const mockHistory: HistoryEntry[] = [
  {
    id: '1',
    action: 'created',
    description: 'Requirement created',
    user: {
      id: 'user1',
      name: 'Jane Smith',
      avatar: '/avatars/jane.jpg',
      role: 'Product Manager'
    },
    timestamp: new Date('2024-01-10T09:00:00'),
    metadata: {
      source: 'web',
      ip: '192.168.1.100'
    }
  },
  {
    id: '2',
    action: 'updated',
    field: 'title',
    oldValue: 'User Auth System',
    newValue: 'User Authentication System',
    user: {
      id: 'user1',
      name: 'Jane Smith',
      avatar: '/avatars/jane.jpg',
      role: 'Product Manager'
    },
    timestamp: new Date('2024-01-10T09:15:00'),
    metadata: {
      source: 'web'
    }
  },
  {
    id: '3',
    action: 'updated',
    field: 'description',
    oldValue: 'Basic auth system',
    newValue:
      'Implement a comprehensive user authentication system with multi-factor authentication support, password policies, and session management.',
    user: {
      id: 'user1',
      name: 'Jane Smith',
      avatar: '/avatars/jane.jpg',
      role: 'Product Manager'
    },
    timestamp: new Date('2024-01-10T10:30:00'),
    metadata: {
      source: 'web'
    }
  },
  {
    id: '4',
    action: 'status_changed',
    field: 'status',
    oldValue: 'draft',
    newValue: 'review',
    user: {
      id: 'user1',
      name: 'Jane Smith',
      avatar: '/avatars/jane.jpg',
      role: 'Product Manager'
    },
    timestamp: new Date('2024-01-12T14:20:00'),
    metadata: {
      source: 'web'
    }
  },
  {
    id: '5',
    action: 'assigned',
    field: 'assignee',
    oldValue: null,
    newValue: 'John Doe',
    user: {
      id: 'user2',
      name: 'Bob Wilson',
      avatar: '/avatars/bob.jpg',
      role: 'Tech Lead'
    },
    timestamp: new Date('2024-01-13T11:45:00'),
    metadata: {
      source: 'web'
    }
  },
  {
    id: '6',
    action: 'updated',
    field: 'priority',
    oldValue: 'medium',
    newValue: 'high',
    user: {
      id: 'user2',
      name: 'Bob Wilson',
      avatar: '/avatars/bob.jpg',
      role: 'Tech Lead'
    },
    timestamp: new Date('2024-01-15T16:30:00'),
    metadata: {
      source: 'api'
    }
  },
  {
    id: '7',
    action: 'status_changed',
    field: 'status',
    oldValue: 'review',
    newValue: 'approved',
    user: {
      id: 'user3',
      name: 'Alice Johnson',
      avatar: '/avatars/alice.jpg',
      role: 'Product Owner'
    },
    timestamp: new Date('2024-01-16T09:15:00'),
    metadata: {
      source: 'web'
    }
  },
  {
    id: '8',
    action: 'status_changed',
    field: 'status',
    oldValue: 'approved',
    newValue: 'in_progress',
    user: {
      id: 'user4',
      name: 'John Doe',
      avatar: '/avatars/john.jpg',
      role: 'Developer'
    },
    timestamp: new Date('2024-01-18T08:00:00'),
    metadata: {
      source: 'mobile'
    }
  },
  {
    id: '9',
    action: 'commented',
    description: 'Added comment about implementation approach',
    user: {
      id: 'user4',
      name: 'John Doe',
      avatar: '/avatars/john.jpg',
      role: 'Developer'
    },
    timestamp: new Date('2024-01-20T14:45:00'),
    metadata: {
      source: 'web'
    }
  }
];

const actionConfig = {
  created: {
    label: 'Created',
    icon: Plus,
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  updated: {
    label: 'Updated',
    icon: Edit,
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  status_changed: {
    label: 'Status Changed',
    icon: ArrowRight,
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  assigned: {
    label: 'Assigned',
    icon: User,
    color: 'bg-orange-100 text-orange-800 border-orange-200'
  },
  commented: {
    label: 'Commented',
    icon: FileText,
    color: 'bg-gray-100 text-gray-800 border-gray-200'
  },
  deleted: {
    label: 'Deleted',
    icon: Trash2,
    color: 'bg-red-100 text-red-800 border-red-200'
  },
  restored: {
    label: 'Restored',
    icon: RotateCcw,
    color: 'bg-green-100 text-green-800 border-green-200'
  }
};

const fieldConfig = {
  title: { label: 'Title', icon: FileText },
  description: { label: 'Description', icon: FileText },
  status: { label: 'Status', icon: CheckCircle2 },
  priority: { label: 'Priority', icon: AlertCircle },
  type: { label: 'Type', icon: Tag },
  complexity: { label: 'Complexity', icon: Target },
  businessValue: { label: 'Business Value', icon: Target },
  effort: { label: 'Effort', icon: Zap },
  assignee: { label: 'Assignee', icon: User },
  dueDate: { label: 'Due Date', icon: Calendar },
  tags: { label: 'Tags', icon: Tag }
};

const sourceConfig = {
  web: { label: 'Web', color: 'bg-blue-100 text-blue-800' },
  api: { label: 'API', color: 'bg-green-100 text-green-800' },
  mobile: { label: 'Mobile', color: 'bg-purple-100 text-purple-800' }
};

export function RequirementHistory({
  requirementId,
  history = mockHistory,
  loading = false,
  canRevert = false,
  onRevert,
  onLoadMore,
  hasMore = false
}: RequirementHistoryProps) {
  const t = useTranslations('requirements');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(
    new Set()
  );
  const [showFilters, setShowFilters] = useState(false);

  const toggleExpanded = (entryId: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  const filteredHistory = history.filter((entry) => {
    const matchesSearch =
      searchTerm === '' ||
      entry.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.field?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction =
      filterAction === 'all' || entry.action === filterAction;
    const matchesUser = filterUser === 'all' || entry.user.id === filterUser;

    return matchesSearch && matchesAction && matchesUser;
  });

  const uniqueUsers = Array.from(new Set(history.map((entry) => entry.user.id)))
    .map((userId) => history.find((entry) => entry.user.id === userId)?.user)
    .filter(Boolean);

  const formatValue = (value: any, field?: string) => {
    if (value === null || value === undefined) {
      return <span className='text-gray-400 italic'>None</span>;
    }

    if (
      field === 'status' ||
      field === 'priority' ||
      field === 'type' ||
      field === 'complexity'
    ) {
      return (
        <Badge variant='secondary' className='text-xs'>
          {String(value).replace('_', ' ')}
        </Badge>
      );
    }

    if (field === 'dueDate' && value instanceof Date) {
      return format(value, 'PPP');
    }

    if (typeof value === 'string' && value.length > 50) {
      return <span className='text-sm'>{value.substring(0, 50)}...</span>;
    }

    return <span className='text-sm'>{String(value)}</span>;
  };

  const renderHistoryEntry = (entry: HistoryEntry) => {
    const ActionIcon = actionConfig[entry.action].icon;
    const FieldIcon = entry.field
      ? fieldConfig[entry.field as keyof typeof fieldConfig]?.icon
      : null;
    const isExpanded = expandedEntries.has(entry.id);
    const hasDetails =
      entry.oldValue !== undefined ||
      entry.newValue !== undefined ||
      entry.metadata;

    return (
      <div key={entry.id} className='relative'>
        {/* Timeline line */}
        <div className='absolute top-12 bottom-0 left-6 w-px bg-gray-200'></div>

        <div className='flex gap-4'>
          {/* Timeline dot */}
          <div
            className={cn(
              'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 bg-white',
              actionConfig[entry.action].color
            )}
          >
            <ActionIcon className='h-5 w-5' />
          </div>

          {/* Content */}
          <div className='flex-1 pb-8'>
            <div className='rounded-lg border bg-white p-4 shadow-sm'>
              {/* Header */}
              <div className='mb-2 flex items-start justify-between'>
                <div className='flex items-center gap-2'>
                  <Avatar className='h-6 w-6'>
                    <AvatarImage src={entry.user.avatar} />
                    <AvatarFallback className='text-xs'>
                      {entry.user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className='text-sm font-medium'>{entry.user.name}</span>
                  {entry.user.role && (
                    <Badge variant='outline' className='text-xs'>
                      {entry.user.role}
                    </Badge>
                  )}
                  {entry.metadata?.source && (
                    <Badge
                      className={cn(
                        'text-xs',
                        sourceConfig[entry.metadata.source].color
                      )}
                    >
                      {sourceConfig[entry.metadata.source].label}
                    </Badge>
                  )}
                </div>
                <div className='flex items-center gap-2'>
                  <span className='text-xs text-gray-500'>
                    {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
                  </span>
                  {canRevert && entry.action !== 'created' && (
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => onRevert?.(entry.id)}
                      className='h-6 px-2 text-xs'
                    >
                      <RotateCcw className='mr-1 h-3 w-3' />
                      Revert
                    </Button>
                  )}
                </div>
              </div>

              {/* Action description */}
              <div className='mb-2 flex items-center gap-2'>
                <Badge
                  className={cn('text-xs', actionConfig[entry.action].color)}
                >
                  {actionConfig[entry.action].label}
                </Badge>
                {entry.field && FieldIcon && (
                  <>
                    <FieldIcon className='h-4 w-4 text-gray-400' />
                    <span className='text-sm text-gray-600'>
                      {fieldConfig[entry.field as keyof typeof fieldConfig]
                        ?.label || entry.field}
                    </span>
                  </>
                )}
              </div>

              {/* Description or changes */}
              {entry.description ? (
                <p className='text-sm text-gray-700'>{entry.description}</p>
              ) : entry.field &&
                (entry.oldValue !== undefined ||
                  entry.newValue !== undefined) ? (
                <div className='text-sm'>
                  {entry.oldValue !== undefined && (
                    <div className='mb-1 flex items-center gap-2'>
                      <span className='text-gray-500'>From:</span>
                      {formatValue(entry.oldValue, entry.field)}
                    </div>
                  )}
                  {entry.newValue !== undefined && (
                    <div className='flex items-center gap-2'>
                      <span className='text-gray-500'>To:</span>
                      {formatValue(entry.newValue, entry.field)}
                    </div>
                  )}
                </div>
              ) : null}

              {/* Expandable details */}
              {hasDetails && (
                <Collapsible
                  open={isExpanded}
                  onOpenChange={() => toggleExpanded(entry.id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='mt-2 h-6 px-2 text-xs'
                    >
                      {isExpanded ? (
                        <ChevronDown className='mr-1 h-3 w-3' />
                      ) : (
                        <ChevronRight className='mr-1 h-3 w-3' />
                      )}
                      {isExpanded ? 'Hide' : 'Show'} Details
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className='mt-2'>
                    <div className='space-y-2 rounded bg-gray-50 p-3 text-xs'>
                      <div className='flex justify-between'>
                        <span className='text-gray-500'>Timestamp:</span>
                        <span>{format(entry.timestamp, 'PPP p')}</span>
                      </div>
                      {entry.metadata?.ip && (
                        <div className='flex justify-between'>
                          <span className='text-gray-500'>IP Address:</span>
                          <span className='font-mono'>{entry.metadata.ip}</span>
                        </div>
                      )}
                      {entry.metadata?.userAgent && (
                        <div className='flex justify-between'>
                          <span className='text-gray-500'>User Agent:</span>
                          <span className='max-w-xs truncate font-mono text-xs'>
                            {entry.metadata.userAgent}
                          </span>
                        </div>
                      )}
                      <div className='flex justify-between'>
                        <span className='text-gray-500'>Entry ID:</span>
                        <span className='font-mono'>{entry.id}</span>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
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
            <History className='h-5 w-5' />
            History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {[...Array(5)].map((_, i) => (
              <div key={i} className='flex animate-pulse gap-4'>
                <div className='h-12 w-12 flex-shrink-0 rounded-full bg-gray-200'></div>
                <div className='flex-1 space-y-2'>
                  <div className='h-4 w-1/3 rounded bg-gray-200'></div>
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
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <History className='h-5 w-5' />
            History ({history.length})
          </CardTitle>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className='mr-2 h-4 w-4' />
            Filters
          </Button>
        </div>

        {/* Filters */}
        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleContent className='mt-4'>
            <div className='grid grid-cols-1 gap-4 rounded-lg bg-gray-50 p-4 md:grid-cols-3'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Search</label>
                <div className='relative'>
                  <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
                  <Input
                    placeholder='Search history...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='pl-10'
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium'>Action</label>
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Actions</SelectItem>
                    {Object.entries(actionConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium'>User</label>
                <Select value={filterUser} onValueChange={setFilterUser}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Users</SelectItem>
                    {uniqueUsers.map((user) => (
                      <SelectItem key={user!.id} value={user!.id}>
                        {user!.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>

      <CardContent>
        {filteredHistory.length > 0 ? (
          <div className='space-y-0'>
            {filteredHistory.map((entry) => renderHistoryEntry(entry))}

            {/* Load more */}
            {hasMore && (
              <div className='pt-4 text-center'>
                <Button variant='outline' onClick={onLoadMore}>
                  <Clock className='mr-2 h-4 w-4' />
                  Load More History
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className='py-8 text-center'>
            <History className='mx-auto mb-4 h-12 w-12 text-gray-300' />
            <p className='mb-2 text-gray-500'>
              {searchTerm || filterAction !== 'all' || filterUser !== 'all'
                ? 'No history entries match your filters'
                : 'No history available'}
            </p>
            {(searchTerm || filterAction !== 'all' || filterUser !== 'all') && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  setSearchTerm('');
                  setFilterAction('all');
                  setFilterUser('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RequirementHistory;
