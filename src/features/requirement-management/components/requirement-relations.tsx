'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  Link,
  Unlink,
  MoreHorizontal,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Target,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Requirement {
  id: string;
  title: string;
  status: string;
  priority: string;
  type: string;
  project?: {
    id: string;
    name: string;
  };
  assignee?: {
    id: string;
    name: string;
  };
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  project?: {
    id: string;
    name: string;
  };
  assignee?: {
    id: string;
    name: string;
  };
}

interface Project {
  id: string;
  name: string;
  status: string;
  description?: string;
}

interface Relation {
  id: string;
  type: 'REQUIREMENT' | 'TASK' | 'PROJECT';
  relationType: 'DEPENDS_ON' | 'BLOCKS' | 'RELATES_TO' | 'DUPLICATES' | 'PARENT_OF' | 'CHILD_OF';
  target: Requirement | Task | Project;
  description?: string;
  createdAt: Date;
}

interface RequirementRelationsProps {
  requirementId: string;
}

const relationTypeConfig = {
  DEPENDS_ON: { label: '依赖于', color: 'bg-blue-100 text-blue-800' },
  BLOCKS: { label: '阻塞', color: 'bg-red-100 text-red-800' },
  RELATES_TO: { label: '关联', color: 'bg-gray-100 text-gray-800' },
  DUPLICATES: { label: '重复', color: 'bg-yellow-100 text-yellow-800' },
  PARENT_OF: { label: '父级', color: 'bg-green-100 text-green-800' },
  CHILD_OF: { label: '子级', color: 'bg-purple-100 text-purple-800' }
};

const statusConfig = {
  DRAFT: { label: '草稿', color: 'bg-gray-100 text-gray-800', icon: FileText },
  PENDING: { label: '待评估', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  APPROVED: { label: '已确认', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  IN_PROGRESS: { label: '开发中', color: 'bg-purple-100 text-purple-800', icon: Clock },
  TESTING: { label: '测试中', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
  COMPLETED: { label: '已完成', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  ACTIVE: { label: '进行中', color: 'bg-blue-100 text-blue-800', icon: Target },
  PAUSED: { label: '暂停', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  CANCELLED: { label: '已取消', color: 'bg-gray-100 text-gray-800', icon: AlertCircle }
};

export function RequirementRelations({ requirementId }: RequirementRelationsProps) {
  const [relations, setRelations] = useState<Relation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(Requirement | Task | Project)[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<'REQUIREMENT' | 'TASK' | 'PROJECT'>('REQUIREMENT');
  const [selectedRelationType, setSelectedRelationType] = useState<string>('');
  const [relationDescription, setRelationDescription] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRelations();
  }, [requirementId]);

  const fetchRelations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/requirements/${requirementId}/relations`);
      if (!response.ok) {
        throw new Error('获取关联信息失败');
      }
      
      const data = await response.json();
      setRelations(data.data);
    } catch (error) {
      console.error('获取关联信息失败:', error);
      toast({
        title: '错误',
        description: '获取关联信息失败，请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const searchTargets = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const endpoint = selectedType === 'REQUIREMENT' ? '/api/requirements/search' :
                     selectedType === 'TASK' ? '/api/tasks/search' :
                     '/api/projects/search';
      
      const response = await fetch(`${endpoint}?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('搜索失败');
      }
      
      const data = await response.json();
      setSearchResults(data.data.filter((item: any) => item.id !== requirementId));
    } catch (error) {
      console.error('搜索失败:', error);
      toast({
        title: '错误',
        description: '搜索失败，请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchTargets(query);
  };

  const handleAddRelation = async () => {
    if (!selectedTarget || !selectedRelationType) {
      toast({
        title: '错误',
        description: '请选择关联对象和关联类型',
        variant: 'destructive'
      });
      return;
    }

    try {
      setAdding(true);
      const response = await fetch(`/api/requirements/${requirementId}/relations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetType: selectedType,
          targetId: selectedTarget,
          relationType: selectedRelationType,
          description: relationDescription
        })
      });

      if (!response.ok) {
        throw new Error('添加关联失败');
      }

      toast({
        title: '成功',
        description: '关联已添加'
      });

      setShowAddDialog(false);
      resetForm();
      fetchRelations();
    } catch (error) {
      console.error('添加关联失败:', error);
      toast({
        title: '错误',
        description: '添加关联失败，请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveRelation = async (relationId: string) => {
    if (!confirm('确定要移除这个关联吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/requirements/${requirementId}/relations/${relationId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('移除关联失败');
      }

      toast({
        title: '成功',
        description: '关联已移除'
      });

      fetchRelations();
    } catch (error) {
      console.error('移除关联失败:', error);
      toast({
        title: '错误',
        description: '移除关联失败，请稍后重试',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedType('REQUIREMENT');
    setSelectedRelationType('');
    setRelationDescription('');
    setSelectedTarget('');
  };

  const getTargetUrl = (relation: Relation) => {
    switch (relation.type) {
      case 'REQUIREMENT':
        return `/dashboard/requirements/${relation.target.id}`;
      case 'TASK':
        return `/dashboard/tasks/${relation.target.id}`;
      case 'PROJECT':
        return `/dashboard/projects/${relation.target.id}`;
      default:
        return '#';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'REQUIREMENT':
        return <FileText className="h-4 w-4" />;
      case 'TASK':
        return <Target className="h-4 w-4" />;
      case 'PROJECT':
        return <Users className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">关联管理</h3>
          <p className="text-sm text-muted-foreground">
            管理需求与其他需求、任务和项目的关联关系
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              添加关联
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>添加关联</DialogTitle>
              <DialogDescription>
                为需求添加与其他对象的关联关系
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* 关联类型选择 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>关联对象类型</Label>
                  <Select value={selectedType} onValueChange={(value: any) => {
                    setSelectedType(value);
                    setSearchQuery('');
                    setSearchResults([]);
                    setSelectedTarget('');
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REQUIREMENT">需求</SelectItem>
                      <SelectItem value="TASK">任务</SelectItem>
                      <SelectItem value="PROJECT">项目</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>关联类型</Label>
                  <Select value={selectedRelationType} onValueChange={setSelectedRelationType}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择关联类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(relationTypeConfig).map(([value, config]) => (
                        <SelectItem key={value} value={value}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 搜索关联对象 */}
              <div className="space-y-2">
                <Label>搜索关联对象</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={`搜索${selectedType === 'REQUIREMENT' ? '需求' : selectedType === 'TASK' ? '任务' : '项目'}...`}
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {searchLoading && (
                  <div className="text-sm text-muted-foreground">搜索中...</div>
                )}
                {searchResults.length > 0 && (
                  <div className="max-h-48 overflow-y-auto border rounded-md">
                    {searchResults.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                          selectedTarget === item.id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                        onClick={() => setSelectedTarget(item.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(selectedType)}
                            <span className="font-medium">{item.title || (item as Project).name}</span>
                          </div>
                          <Badge className={statusConfig[item.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}>
                            {statusConfig[item.status as keyof typeof statusConfig]?.label || item.status}
                          </Badge>
                        </div>
                        {(item as Project).description && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {(item as Project).description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 关联描述 */}
              <div className="space-y-2">
                <Label>关联描述（可选）</Label>
                <Textarea
                  placeholder="描述这个关联的具体内容或原因"
                  value={relationDescription}
                  onChange={(e) => setRelationDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowAddDialog(false);
                resetForm();
              }}>
                取消
              </Button>
              <Button 
                onClick={handleAddRelation} 
                disabled={!selectedTarget || !selectedRelationType || adding}
              >
                {adding ? '添加中...' : '确认添加'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 关联列表 */}
      {relations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Link className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">暂无关联</h3>
            <p className="text-muted-foreground text-center mb-4">
              还没有添加任何关联关系
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              添加第一个关联
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>关联列表</CardTitle>
            <CardDescription>
              共 {relations.length} 个关联关系
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>关联类型</TableHead>
                  <TableHead>关联对象</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relations.map((relation) => (
                  <TableRow key={relation.id}>
                    <TableCell>
                      <Badge className={relationTypeConfig[relation.relationType].color}>
                        {relationTypeConfig[relation.relationType].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(relation.type)}
                        <div>
                          <div className="font-medium">
                            {relation.target.title || (relation.target as Project).name}
                          </div>
                          {relation.target.project && (
                            <div className="text-sm text-muted-foreground">
                              {relation.target.project.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig[relation.target.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}>
                        {statusConfig[relation.target.status as keyof typeof statusConfig]?.label || relation.target.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={relation.description}>
                        {relation.description || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(relation.createdAt), 'yyyy-MM-dd', { locale: zhCN })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <a href={getTargetUrl(relation)} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              查看详情
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleRemoveRelation(relation.id)}
                            className="text-red-600"
                          >
                            <Unlink className="mr-2 h-4 w-4" />
                            移除关联
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}