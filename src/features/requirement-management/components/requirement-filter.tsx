'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Filter,
  X,
  Calendar as CalendarIcon,
  ChevronDown,
  User,
  Flag,
  Tag,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface FilterOptions {
  search?: string;
  status?: string[];
  priority?: string[];
  type?: string[];
  complexity?: string[];
  projectId?: string[];
  assigneeId?: string[];
  creatorId?: string[];
  tags?: string[];
  dueDateFrom?: Date;
  dueDateTo?: Date;
  createdFrom?: Date;
  createdTo?: Date;
  businessValueMin?: number;
  businessValueMax?: number;
  effortMin?: number;
  effortMax?: number;
}

interface RequirementFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
  projectId?: string;
}

const statusOptions = [
  { value: 'DRAFT', label: '草稿' },
  { value: 'PENDING', label: '待评估' },
  { value: 'APPROVED', label: '已确认' },
  { value: 'IN_PROGRESS', label: '开发中' },
  { value: 'TESTING', label: '测试中' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'REJECTED', label: '已拒绝' },
  { value: 'CANCELLED', label: '已取消' }
];

const priorityOptions = [
  { value: 'LOW', label: '低' },
  { value: 'MEDIUM', label: '中' },
  { value: 'HIGH', label: '高' },
  { value: 'URGENT', label: '紧急' }
];

const typeOptions = [
  { value: 'FUNCTIONAL', label: '功能性' },
  { value: 'NON_FUNCTIONAL', label: '非功能性' },
  { value: 'TECHNICAL', label: '技术性' },
  { value: 'BUSINESS', label: '业务性' }
];

const complexityOptions = [
  { value: 'SIMPLE', label: '简单' },
  { value: 'MEDIUM', label: '中等' },
  { value: 'COMPLEX', label: '复杂' },
  { value: 'VERY_COMPLEX', label: '非常复杂' }
];

export function RequirementFilter({ onFilterChange, projectId }: RequirementFilterProps) {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [tags, setTags] = useState<Array<{ id: string; name: string; color: string }>>([]);

  useEffect(() => {
    fetchFilterData();
  }, []);

  useEffect(() => {
    if (typeof onFilterChange === 'function') {
      onFilterChange(filters);
    }
  }, [filters, onFilterChange]);

  const fetchFilterData = async () => {
    try {
      // 获取项目列表
      if (!projectId) {
        const projectsResponse = await fetch('/api/projects');
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setProjects(projectsData.data || []);
        }
      }

      // 获取用户列表
      const usersResponse = await fetch('/api/users');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.data || []);
      }

      // 获取标签列表
      const tagsResponse = await fetch('/api/tags');
      if (tagsResponse.ok) {
        const tagsData = await tagsResponse.json();
        setTags(tagsData.data || []);
      }
    } catch (error) {
      console.error('获取过滤器数据失败:', error);
    }
  };

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const updateArrayFilter = (key: keyof FilterOptions, value: string, checked: boolean) => {
    setFilters(prev => {
      const currentArray = (prev[key] as string[]) || [];
      if (checked) {
        return { ...prev, [key]: [...currentArray, value] };
      } else {
        return { ...prev, [key]: currentArray.filter(item => item !== value) };
      }
    });
  };

  const clearFilters = () => {
    setFilters({});
  };

  const getActiveFilterCount = () => {
    let count = 0;
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length > 0) count++;
        else if (!Array.isArray(value)) count++;
      }
    });
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="space-y-6">
      {/* 基础搜索 */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                placeholder="搜索需求标题、描述或ID..."
                value={filters.search || ''}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-12 h-12 text-base bg-background/80 border-border/50 focus:bg-background transition-all duration-200 shadow-sm"
              />
            </div>
            <Button
              variant={showAdvanced ? 'default' : 'outline'}
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-2 h-12 px-6 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Filter className="h-4 w-4" />
              <span className="font-medium">高级筛选</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                  {activeFilterCount}
                </Badge>
              )}
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform duration-200",
                showAdvanced && "rotate-180"
              )} />
            </Button>
            {activeFilterCount > 0 && (
              <Button variant="ghost" onClick={clearFilters} className="h-12 px-4 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-colors">
                <RefreshCw className="h-4 w-4 mr-2" />
                清除筛选
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 高级筛选 */}
      {showAdvanced && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50/50 to-gray-50/50 dark:from-slate-950/20 dark:to-gray-950/20">
          <CardContent className="p-8 space-y-8">
            {/* 状态和优先级 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Flag className="h-4 w-4 text-blue-500" />
                  状态筛选
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {statusOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${option.value}`}
                        checked={(filters.status || []).includes(option.value)}
                        onCheckedChange={(checked) => 
                          updateArrayFilter('status', option.value, checked as boolean)
                        }
                      />
                      <Label htmlFor={`status-${option.value}`} className="text-sm">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Flag className="h-4 w-4 text-orange-500" />
                  优先级筛选
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {priorityOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`priority-${option.value}`}
                        checked={(filters.priority || []).includes(option.value)}
                        onCheckedChange={(checked) => 
                          updateArrayFilter('priority', option.value, checked as boolean)
                        }
                      />
                      <Label htmlFor={`priority-${option.value}`} className="text-sm">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Separator className="bg-border/50" />
            
            {/* 类型和复杂度 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Tag className="h-4 w-4 text-green-500" />
                  需求类型
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {typeOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${option.value}`}
                        checked={(filters.type || []).includes(option.value)}
                        onCheckedChange={(checked) => 
                          updateArrayFilter('type', option.value, checked as boolean)
                        }
                      />
                      <Label htmlFor={`type-${option.value}`} className="text-sm">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Tag className="h-4 w-4 text-purple-500" />
                  复杂度评估
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {complexityOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`complexity-${option.value}`}
                        checked={(filters.complexity || []).includes(option.value)}
                        onCheckedChange={(checked) => 
                          updateArrayFilter('complexity', option.value, checked as boolean)
                        }
                      />
                      <Label htmlFor={`complexity-${option.value}`} className="text-sm">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Separator className="bg-border/50" />
            
            {/* 项目和人员 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {!projectId && (
                <div className="space-y-4">
                  <Label className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Tag className="h-4 w-4 text-indigo-500" />
                    所属项目
                  </Label>
                  <Select
                    value={filters.projectId?.[0] || ''}
                    onValueChange={(value) => updateFilter('projectId', value ? [value] : [])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择项目" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">全部项目</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-4">
                <Label className="text-base font-semibold text-foreground flex items-center gap-2">
                  <User className="h-4 w-4 text-cyan-500" />
                  负责人员
                </Label>
                <Select
                  value={filters.assigneeId?.[0] || ''}
                  onValueChange={(value) => updateFilter('assigneeId', value ? [value] : [])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择负责人" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部负责人</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator className="bg-border/50" />
            
            {/* 日期范围 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label className="text-base font-semibold text-foreground flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-red-500" />
                  截止日期范围
                </Label>
                <div className="flex items-center space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.dueDateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dueDateFrom ? (
                          format(filters.dueDateFrom, "PPP", { locale: zhCN })
                        ) : (
                          "开始日期"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dueDateFrom}
                        onSelect={(date) => updateFilter('dueDateFrom', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <span className="text-muted-foreground">至</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.dueDateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dueDateTo ? (
                          format(filters.dueDateTo, "PPP", { locale: zhCN })
                        ) : (
                          "结束日期"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dueDateTo}
                        onSelect={(date) => updateFilter('dueDateTo', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold text-foreground flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-emerald-500" />
                  创建日期范围
                </Label>
                <div className="flex items-center space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.createdFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.createdFrom ? (
                          format(filters.createdFrom, "PPP", { locale: zhCN })
                        ) : (
                          "开始日期"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.createdFrom}
                        onSelect={(date) => updateFilter('createdFrom', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <span className="text-muted-foreground">至</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.createdTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.createdTo ? (
                          format(filters.createdTo, "PPP", { locale: zhCN })
                        ) : (
                          "结束日期"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.createdTo}
                        onSelect={(date) => updateFilter('createdTo', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <Separator className="bg-border/50" />
            
            {/* 业务价值和工作量 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Tag className="h-4 w-4 text-yellow-500" />
                  业务价值范围
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    placeholder="最小值"
                    value={filters.businessValueMin || ''}
                    onChange={(e) => updateFilter('businessValueMin', e.target.value ? Number(e.target.value) : undefined)}
                  />
                  <span className="text-muted-foreground">至</span>
                  <Input
                    type="number"
                    placeholder="最大值"
                    value={filters.businessValueMax || ''}
                    onChange={(e) => updateFilter('businessValueMax', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Tag className="h-4 w-4 text-pink-500" />
                  预估工作量（小时）
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    placeholder="最小值"
                    value={filters.effortMin || ''}
                    onChange={(e) => updateFilter('effortMin', e.target.value ? Number(e.target.value) : undefined)}
                  />
                  <span className="text-muted-foreground">至</span>
                  <Input
                    type="number"
                    placeholder="最大值"
                    value={filters.effortMax || ''}
                    onChange={(e) => updateFilter('effortMax', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </div>

            <Separator className="bg-border/50" />
            
            {/* 标签 */}
            {tags.length > 0 && (
              <div className="space-y-4">
                <Label className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Tag className="h-4 w-4 text-violet-500" />
                  标签筛选
                </Label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <div key={tag.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag.id}`}
                        checked={(filters.tags || []).includes(tag.id)}
                        onCheckedChange={(checked) => 
                          updateArrayFilter('tags', tag.id, checked as boolean)
                        }
                      />
                      <Label htmlFor={`tag-${tag.id}`}>
                        <Badge
                          variant="outline"
                          style={{ backgroundColor: tag.color + '20', borderColor: tag.color }}
                        >
                          {tag.name}
                        </Badge>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}