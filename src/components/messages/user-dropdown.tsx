'use client';

import React, { useState, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';

// 用户接口
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  isOnline?: boolean;
  role?: string;
}

interface UserDropdownProps {
  users: User[];
  selectedUser: User | null;
  onUserSelect: (user: User | null) => void;
  placeholder?: string;
  className?: string;
  showOnlineStatus?: boolean;
  showRole?: boolean;
  excludeUserIds?: string[];
  currentUserId?: string;
  disabled?: boolean;
}

export function UserDropdown({
  users,
  selectedUser,
  onUserSelect,
  placeholder = '选择用户...',
  className,
  showOnlineStatus = true,
  showRole = true,
  excludeUserIds = [],
  currentUserId,
  disabled = false
}: UserDropdownProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // 过滤用户列表
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // 排除当前用户
      if (currentUserId && user.id === currentUserId) {
        return false;
      }

      // 排除指定用户
      if (excludeUserIds.includes(user.id)) {
        return false;
      }

      // 根据搜索查询过滤
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          (user.role && user.role.toLowerCase().includes(query))
        );
      }

      return true;
    });
  }, [users, searchQuery, excludeUserIds, currentUserId]);

  const handleValueChange = (value: string) => {
    if (value === 'none') {
      onUserSelect(null);
    } else {
      const user = users.find((u) => u.id === value);
      onUserSelect(user || null);
    }
    setIsOpen(false);
  };

  return (
    <Select
      value={selectedUser?.id || 'none'}
      onValueChange={handleValueChange}
      disabled={disabled}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <SelectTrigger className={cn('w-full', className)}>
        <SelectValue>
          {selectedUser ? (
            <div className='flex items-center gap-2'>
              <Avatar className='h-6 w-6'>
                <AvatarImage src={selectedUser.image} alt={selectedUser.name} />
                <AvatarFallback className='text-xs'>
                  {selectedUser.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className='truncate'>{selectedUser.name}</span>
              {showOnlineStatus && selectedUser.isOnline && (
                <div className='h-2 w-2 rounded-full bg-green-500' />
              )}
            </div>
          ) : (
            <span className='text-muted-foreground'>{placeholder}</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className='w-full'>
        {/* 搜索框 */}
        <div className='border-b p-2'>
          <div className='relative'>
            <Search className='text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 transform' />
            <Input
              placeholder='搜索用户...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='h-8 pl-8'
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        <ScrollArea className='max-h-60'>
          {filteredUsers.length === 0 ? (
            <div className='text-muted-foreground p-4 text-center'>
              <User className='mx-auto mb-2 h-8 w-8 opacity-50' />
              <p className='text-sm'>未找到匹配的用户</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <SelectItem key={user.id} value={user.id} className='p-3'>
                <div className='flex w-full items-center gap-3'>
                  <Avatar className='h-8 w-8'>
                    <AvatarImage src={user.image} alt={user.name} />
                    <AvatarFallback className='text-xs'>
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-2'>
                      <p className='truncate font-medium'>{user.name}</p>
                      {showOnlineStatus && user.isOnline && (
                        <div
                          className='h-2 w-2 rounded-full bg-green-500'
                          title='在线'
                        />
                      )}
                    </div>
                    <p className='text-muted-foreground truncate text-sm'>
                      {user.email}
                    </p>
                    {showRole && user.role && (
                      <Badge variant='secondary' className='mt-1 text-xs'>
                        {user.role}
                      </Badge>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))
          )}
        </ScrollArea>
      </SelectContent>
    </Select>
  );
}
