'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, User, Check, Users } from 'lucide-react';
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

interface UserSelectorProps {
  users: User[];
  selectedUser: User | null;
  onUserSelect: (user: User) => void;
  searchPlaceholder?: string;
  placeholder?: string;
  title?: string;
  className?: string;
  maxHeight?: string;
  showOnlineStatus?: boolean;
  showRole?: boolean;
  excludeUserIds?: string[];
  currentUserId?: string;
}

export function UserSelector({
  users,
  selectedUser,
  onUserSelect,
  searchPlaceholder = "搜索用户姓名、邮箱或角色...",
  placeholder,
  title = "选择用户",
  className,
  maxHeight = "h-96",
  showOnlineStatus = true,
  showRole = true,
  excludeUserIds = [],
  currentUserId
}: UserSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>(users);

  // 使用 useMemo 来稳定 excludeUserIds 引用，添加字符串化比较避免数组引用问题
  const memoizedExcludeUserIds = useMemo(() => excludeUserIds, [JSON.stringify(excludeUserIds)]);

  // 过滤用户列表
  useEffect(() => {
    let filtered = users.filter(user => {
      // 排除当前用户
      if (currentUserId && user.id === currentUserId) {
        return false;
      }
      
      // 排除指定用户
      if (memoizedExcludeUserIds.includes(user.id)) {
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
    
    setFilteredUsers(filtered);
  }, [searchQuery, users, memoizedExcludeUserIds, currentUserId]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={placeholder || searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* 用户列表 */}
          <ScrollArea className={maxHeight}>
            <div className="space-y-2">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>未找到匹配的用户</p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <UserItem
                    key={user.id}
                    user={user}
                    isSelected={selectedUser?.id === user.id}
                    onSelect={() => onUserSelect(user)}
                    showOnlineStatus={showOnlineStatus}
                    showRole={showRole}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

// 用户项组件
interface UserItemProps {
  user: User;
  isSelected: boolean;
  onSelect: () => void;
  showOnlineStatus: boolean;
  showRole: boolean;
}

function UserItem({ user, isSelected, onSelect, showOnlineStatus, showRole }: UserItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:bg-accent"
      )}
      onClick={onSelect}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={user.image} alt={user.name} />
        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{user.name}</p>
          {showOnlineStatus && user.isOnline && (
            <div className="h-2 w-2 bg-green-500 rounded-full" title="在线" />
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
        {showRole && user.role && (
          <Badge variant="secondary" className="mt-1 text-xs">
            {user.role}
          </Badge>
        )}
      </div>
      
      {isSelected && (
        <Check className="h-5 w-5 text-primary" />
      )}
    </div>
  );
}