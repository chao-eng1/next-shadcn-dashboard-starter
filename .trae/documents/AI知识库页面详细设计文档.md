# AI知识库页面详细设计文档

## 1. 页面概述

AI知识库页面是一个智能化的知识管理系统，集成了LangChain和LangGraph技术，为用户提供智能文档管理、知识检索、内容生成和知识图谱构建等功能。该页面旨在帮助团队高效地组织、管理和利用知识资产。

### 1.1 核心价值

- **智能检索**: 基于语义理解的智能搜索和推荐
- **知识图谱**: 自动构建知识之间的关联关系
- **内容生成**: AI辅助的文档创建和内容优化
- **协作共享**: 团队知识的协作编辑和共享机制

### 1.2 目标用户

- **知识工作者**: 需要管理大量文档和资料的专业人员
- **研究团队**: 需要协作整理和分享研究成果的团队
- **项目经理**: 需要维护项目知识库的管理人员
- **技术团队**: 需要构建技术文档和最佳实践库的开发团队

## 2. 功能需求

### 2.1 智能文档管理

- **文档上传**: 支持多种格式文档的批量上传和解析
- **自动分类**: AI自动识别文档类型和主题进行分类
- **版本控制**: 文档版本管理和变更追踪
- **权限管理**: 细粒度的文档访问和编辑权限控制

### 2.2 智能检索系统

- **语义搜索**: 基于内容理解的智能搜索
- **相关推荐**: 根据用户行为和内容相似性推荐相关文档
- **快速预览**: 搜索结果的快速预览和高亮显示
- **搜索历史**: 个人搜索历史和常用查询管理

### 2.3 AI内容助手

- **智能摘要**: 自动生成文档摘要和关键信息提取
- **内容生成**: AI辅助的文档创建和内容扩展
- **翻译服务**: 多语言文档的智能翻译
- **质量检查**: 文档质量评估和改进建议

### 2.4 知识图谱

- **关系发现**: 自动发现文档和概念之间的关联
- **可视化展示**: 知识关系的图形化展示
- **路径分析**: 知识点之间的关联路径分析
- **图谱导航**: 基于知识图谱的导航和探索

### 2.5 协作功能

- **实时编辑**: 多人协作的实时文档编辑
- **评论系统**: 文档评论和讨论功能
- **分享机制**: 灵活的文档分享和权限设置
- **通知提醒**: 文档更新和协作活动的通知

### 2.6 用户角色权限

| 角色       | 权限描述                                     |
| ---------- | -------------------------------------------- |
| 知识管理员 | 全部权限：管理知识库结构、用户权限、系统配置 |
| 内容编辑者 | 创建、编辑、删除文档，管理分类和标签         |
| 协作者     | 编辑指定文档，添加评论，参与协作             |
| 查看者     | 浏览和搜索文档，查看公开内容                 |

## 3. 前端设计

### 3.1 页面布局

```typescript
// components/KnowledgeBasePage.tsx
import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Grid, List, BookOpen, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KnowledgeSearchBar } from './KnowledgeSearchBar';
import { DocumentGrid } from './DocumentGrid';
import { KnowledgeGraph } from './KnowledgeGraph';
import { AIAssistantPanel } from './AIAssistantPanel';
import { DocumentEditor } from './DocumentEditor';

interface KnowledgeBasePageProps {
  projectId: string;
}

export const KnowledgeBasePage: React.FC<KnowledgeBasePageProps> = ({
  projectId
}) => {
  const [activeView, setActiveView] = useState<'grid' | 'list' | 'graph'>('grid');
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: [],
    tags: [],
    dateRange: null,
    author: []
  });

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 侧边栏 */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* 搜索区域 */}
        <div className="p-4 border-b border-gray-200">
          <KnowledgeSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={(query) => {
              // 执行搜索逻辑
            }}
            placeholder="搜索知识库..."
          />
        </div>

        {/* 分类导航 */}
        <div className="flex-1 overflow-y-auto">
          <CategoryNavigation
            projectId={projectId}
            onCategorySelect={(category) => {
              setFilters(prev => ({
                ...prev,
                category: [category]
              }));
            }}
          />
        </div>

        {/* 快捷操作 */}
        <div className="p-4 border-t border-gray-200">
          <div className="space-y-2">
            <Button
              onClick={() => setSelectedDocument('new')}
              className="w-full"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              新建文档
            </Button>

            <Button
              onClick={() => setShowAIAssistant(!showAIAssistant)}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <Brain className="w-4 h-4 mr-2" />
              AI助手
            </Button>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col">
        {/* 工具栏 */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                知识库
              </h1>

              <div className="flex items-center space-x-2">
                <Button
                  variant={activeView === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveView('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>

                <Button
                  variant={activeView === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveView('list')}
                >
                  <List className="w-4 h-4" />
                </Button>

                <Button
                  variant={activeView === 'graph' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveView('graph')}
                >
                  <BookOpen className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <FilterPanel
                filters={filters}
                onFiltersChange={setFilters}
              />

              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                上传文档
              </Button>
            </div>
          </div>
        </div>

        {/* 内容展示区域 */}
        <div className="flex-1 overflow-hidden">
          {selectedDocument ? (
            <DocumentEditor
              documentId={selectedDocument}
              onClose={() => setSelectedDocument(null)}
              onSave={(document) => {
                // 保存文档逻辑
              }}
            />
          ) : (
            <Tabs value={activeView} className="h-full">
              <TabsContent value="grid" className="h-full">
                <DocumentGrid
                  projectId={projectId}
                  searchQuery={searchQuery}
                  filters={filters}
                  onDocumentSelect={setSelectedDocument}
                />
              </TabsContent>

              <TabsContent value="list" className="h-full">
                <DocumentList
                  projectId={projectId}
                  searchQuery={searchQuery}
                  filters={filters}
                  onDocumentSelect={setSelectedDocument}
                />
              </TabsContent>

              <TabsContent value="graph" className="h-full">
                <KnowledgeGraph
                  projectId={projectId}
                  onNodeSelect={(nodeId) => {
                    if (nodeId.startsWith('doc_')) {
                      setSelectedDocument(nodeId.replace('doc_', ''));
                    }
                  }}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* AI助手面板 */}
      {showAIAssistant && (
        <AIAssistantPanel
          projectId={projectId}
          context={{
            currentDocument: selectedDocument,
            searchQuery,
            selectedDocuments: []
          }}
          onClose={() => setShowAIAssistant(false)}
          onAction={(action, data) => {
            // 处理AI助手操作
          }}
        />
      )}
    </div>
  );
};
```

### 3.2 UI组件设计

#### 3.2.1 智能搜索组件

```typescript
// components/KnowledgeSearchBar.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Search, Clock, Sparkles, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/useDebounce';
import { useKnowledgeSearch } from '@/hooks/useKnowledgeSearch';

interface KnowledgeSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
}

export const KnowledgeSearchBar: React.FC<KnowledgeSearchBarProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = '搜索知识库...'
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(value, 300);

  const {
    suggestions,
    loading: suggestionsLoading
  } = useKnowledgeSearch(debouncedQuery);

  useEffect(() => {
    // 加载最近搜索历史
    const recent = localStorage.getItem('knowledge_recent_searches');
    if (recent) {
      setRecentSearches(JSON.parse(recent));
    }
  }, []);

  const handleSearch = (query: string) => {
    if (!query.trim()) return;

    // 添加到搜索历史
    const newRecentSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(newRecentSearches);
    localStorage.setItem('knowledge_recent_searches', JSON.stringify(newRecentSearches));

    onSearch(query);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(value);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="pl-10 pr-10"
        />
        {value && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* 搜索建议下拉框 */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
          {/* AI智能建议 */}
          {suggestions.length > 0 && (
            <div className="p-2">
              <div className="flex items-center text-xs text-gray-500 mb-2">
                <Sparkles className="w-3 h-3 mr-1" />
                智能建议
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm"
                  onClick={() => {
                    onChange(suggestion.query);
                    handleSearch(suggestion.query);
                  }}
                >
                  <div className="font-medium">{suggestion.query}</div>
                  {suggestion.description && (
                    <div className="text-xs text-gray-500 mt-1">
                      {suggestion.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* 最近搜索 */}
          {recentSearches.length > 0 && (
            <div className="p-2 border-t border-gray-100">
              <div className="flex items-center text-xs text-gray-500 mb-2">
                <Clock className="w-3 h-3 mr-1" />
                最近搜索
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm flex items-center justify-between"
                  onClick={() => {
                    onChange(search);
                    handleSearch(search);
                  }}
                >
                  <span>{search}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newRecentSearches = recentSearches.filter((_, i) => i !== index);
                      setRecentSearches(newRecentSearches);
                      localStorage.setItem('knowledge_recent_searches', JSON.stringify(newRecentSearches));
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

#### 3.2.2 文档卡片组件

```typescript
// components/DocumentCard.tsx
import React, { useState } from 'react';
import { FileText, Download, Share, Edit, Trash2, Eye, Clock, User, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Document {
  id: string;
  title: string;
  description?: string;
  content: string;
  category: string;
  tags: string[];
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  downloadCount: number;
  fileType: string;
  fileSize: number;
  aiSummary?: string;
  relevanceScore?: number;
}

interface DocumentCardProps {
  document: Document;
  onSelect: (documentId: string) => void;
  onEdit: (documentId: string) => void;
  onDelete: (documentId: string) => void;
  onShare: (documentId: string) => void;
  showAISummary?: boolean;
  highlighted?: string[];
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onSelect,
  onEdit,
  onDelete,
  onShare,
  showAISummary = false,
  highlighted = []
}) => {
  const [showFullSummary, setShowFullSummary] = useState(false);

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'ppt':
      case 'pptx':
        return '📊';
      case 'xls':
      case 'xlsx':
        return '📈';
      default:
        return '📄';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const highlightText = (text: string, highlights: string[]) => {
    if (!highlights.length) return text;

    let highlightedText = text;
    highlights.forEach(highlight => {
      const regex = new RegExp(`(${highlight})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });

    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

  return (
    <Card className="group hover:shadow-md transition-shadow duration-200 cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="text-2xl">{getFileIcon(document.fileType)}</div>

            <div className="flex-1 min-w-0">
              <h3
                className="font-medium text-gray-900 truncate hover:text-blue-600 transition-colors"
                onClick={() => onSelect(document.id)}
              >
                {highlightText(document.title, highlighted)}
              </h3>

              {document.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {highlightText(document.description, highlighted)}
                </p>
              )}

              {/* AI摘要 */}
              {showAISummary && document.aiSummary && (
                <div className="mt-2 p-2 bg-blue-50 rounded-md">
                  <div className="flex items-center text-xs text-blue-600 mb-1">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI摘要
                  </div>
                  <p className="text-sm text-gray-700">
                    {showFullSummary
                      ? document.aiSummary
                      : `${document.aiSummary.slice(0, 100)}${document.aiSummary.length > 100 ? '...' : ''}`
                    }
                    {document.aiSummary.length > 100 && (
                      <button
                        className="text-blue-600 hover:text-blue-800 ml-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowFullSummary(!showFullSummary);
                        }}
                      >
                        {showFullSummary ? '收起' : '展开'}
                      </button>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 相关性评分 */}
          {document.relevanceScore && (
            <Badge variant="secondary" className="ml-2">
              {Math.round(document.relevanceScore * 100)}%
            </Badge>
          )}
        </div>

        {/* 标签 */}
        {document.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {document.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </Badge>
            ))}
            {document.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{document.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* 文档信息 */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <User className="w-3 h-3 mr-1" />
              <Avatar className="w-4 h-4 mr-1">
                <AvatarImage src={document.author.avatar} />
                <AvatarFallback className="text-xs">
                  {document.author.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span>{document.author.name}</span>
            </div>

            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              <span>
                {formatDistanceToNow(document.updatedAt, {
                  addSuffix: true,
                  locale: zhCN
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span>{formatFileSize(document.fileSize)}</span>
            <span>•</span>
            <div className="flex items-center">
              <Eye className="w-3 h-3 mr-1" />
              <span>{document.viewCount}</span>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(document.id);
              }}
            >
              <Edit className="w-3 h-3" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onShare(document.id);
              }}
            >
              <Share className="w-3 h-3" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                // 下载逻辑
              }}
            >
              <Download className="w-3 h-3" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(document.id);
              }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>

          <Badge variant="outline" className="text-xs">
            {document.category}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
```

#### 3.2.3 知识图谱组件

```typescript
// components/KnowledgeGraph.tsx
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useKnowledgeGraph } from '@/hooks/useKnowledgeGraph';

interface GraphNode {
  id: string;
  label: string;
  type: 'document' | 'concept' | 'person' | 'project';
  size: number;
  color: string;
  metadata: any;
}

interface GraphLink {
  source: string;
  target: string;
  weight: number;
  type: 'reference' | 'similarity' | 'collaboration' | 'dependency';
  label?: string;
}

interface KnowledgeGraphProps {
  projectId: string;
  onNodeSelect: (nodeId: string) => void;
  height?: number;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  projectId,
  onNodeSelect,
  height = 600
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const {
    nodes,
    links,
    loading,
    error,
    refreshGraph
  } = useKnowledgeGraph(projectId);

  useEffect(() => {
    if (!nodes.length || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;

    // 清除之前的内容
    svg.selectAll('*').remove();

    // 创建缩放行为
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom);

    // 创建容器组
    const container = svg.append('g');

    // 创建力导向图模拟
    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links)
        .id(d => d.id)
        .distance(d => 100 / (d.weight || 1))
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.size + 5));

    // 创建连线
    const link = container.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => Math.sqrt(d.weight || 1));

    // 创建连线标签
    const linkLabel = container.append('g')
      .selectAll('text')
      .data(links.filter(d => d.label))
      .enter().append('text')
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .attr('text-anchor', 'middle')
      .text(d => d.label || '');

    // 创建节点组
    const node = container.append('g')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // 添加节点圆圈
    node.append('circle')
      .attr('r', d => d.size)
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .on('click', (event, d) => {
        setSelectedNode(d.id);
        onNodeSelect(d.id);
      })
      .on('mouseover', function(event, d) {
        // 高亮相关节点和连线
        const connectedNodes = new Set();
        links.forEach(link => {
          if (link.source === d.id || link.target === d.id) {
            connectedNodes.add(link.source);
            connectedNodes.add(link.target);
          }
        });

        node.style('opacity', n => connectedNodes.has(n.id) ? 1 : 0.3);
        link.style('opacity', l =>
          l.source === d.id || l.target === d.id ? 1 : 0.1
        );
      })
      .on('mouseout', () => {
        node.style('opacity', 1);
        link.style('opacity', 0.6);
      });

    // 添加节点标签
    node.append('text')
      .attr('dy', d => d.size + 15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#333')
      .text(d => d.label.length > 15 ? d.label.slice(0, 15) + '...' : d.label);

    // 添加节点类型图标
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', d => d.size * 0.8)
      .text(d => {
        switch (d.type) {
          case 'document': return '📄';
          case 'concept': return '💡';
          case 'person': return '👤';
          case 'project': return '📁';
          default: return '⚪';
        }
      });

    // 更新位置
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as any).x)
        .attr('y1', d => (d.source as any).y)
        .attr('x2', d => (d.target as any).x)
        .attr('y2', d => (d.target as any).y);

      linkLabel
        .attr('x', d => ((d.source as any).x + (d.target as any).x) / 2)
        .attr('y', d => ((d.source as any).y + (d.target as any).y) / 2);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // 搜索高亮
    if (searchTerm) {
      node.select('circle')
        .attr('stroke', d =>
          d.label.toLowerCase().includes(searchTerm.toLowerCase())
            ? '#ff6b6b' : '#fff'
        )
        .attr('stroke-width', d =>
          d.label.toLowerCase().includes(searchTerm.toLowerCase()) ? 3 : 2
        );
    }

    return () => {
      simulation.stop();
    };
  }, [nodes, links, searchTerm, height]);

  const handleZoomIn = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      d3.zoom<SVGSVGElement, unknown>().scaleBy as any,
      1.5
    );
  };

  const handleZoomOut = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      d3.zoom<SVGSVGElement, unknown>().scaleBy as any,
      1 / 1.5
    );
  };

  const handleReset = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      d3.zoom<SVGSVGElement, unknown>().transform as any,
      d3.zoomIdentity
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">正在构建知识图谱...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600 mb-2">加载知识图谱失败</p>
          <Button onClick={refreshGraph} size="sm">
            重试
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full bg-white">
      {/* 控制面板 */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-md p-3 space-y-2">
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4 text-gray-400" />
          <Input
            placeholder="搜索节点..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-40 h-8"
          />
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            className="h-8 w-8 p-0"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            className="h-8 w-8 p-0"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-8 w-8 p-0"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        <div className="text-xs text-gray-500">
          缩放: {Math.round(zoomLevel * 100)}%
        </div>
      </div>

      {/* 图例 */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-md p-3">
        <h4 className="text-sm font-medium mb-2">图例</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <span>📄</span>
            <span>文档</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>💡</span>
            <span>概念</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>👤</span>
            <span>人员</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>📁</span>
            <span>项目</span>
          </div>
        </div>
      </div>

      {/* 图谱画布 */}
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        className="border border-gray-200"
      />

      {/* 节点信息面板 */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-md p-4 max-w-sm">
          <NodeInfoPanel
            nodeId={selectedNode}
            onClose={() => setSelectedNode(null)}
          />
        </div>
      )}
    </div>
  );
};
```

### 3.3 状态管理

```typescript
// hooks/useKnowledgeStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface Document {
  id: string;
  title: string;
  description?: string;
  content: string;
  category: string;
  tags: string[];
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  downloadCount: number;
  fileType: string;
  fileSize: number;
  aiSummary?: string;
  relevanceScore?: number;
}

interface SearchFilters {
  category: string[];
  tags: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  } | null;
  author: string[];
  fileType: string[];
}

interface KnowledgeState {
  documents: Document[];
  categories: string[];
  tags: string[];
  searchQuery: string;
  searchResults: Document[];
  filters: SearchFilters;
  selectedDocument: string | null;
  loading: {
    documents: boolean;
    search: boolean;
    upload: boolean;
  };
  error: string | null;
}

interface KnowledgeActions {
  // 文档管理
  loadDocuments: (projectId: string) => Promise<void>;
  createDocument: (document: Partial<Document>) => Promise<void>;
  updateDocument: (documentId: string, updates: Partial<Document>) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;

  // 搜索功能
  search: (query: string, filters?: Partial<SearchFilters>) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  clearSearch: () => void;

  // 文档操作
  selectDocument: (documentId: string | null) => void;
  incrementViewCount: (documentId: string) => void;
  incrementDownloadCount: (documentId: string) => void;

  // AI功能
  generateSummary: (documentId: string) => Promise<void>;
  generateTags: (documentId: string) => Promise<void>;
  findSimilarDocuments: (documentId: string) => Promise<Document[]>;

  // 分类和标签
  loadCategories: (projectId: string) => Promise<void>;
  loadTags: (projectId: string) => Promise<void>;
  createCategory: (name: string) => Promise<void>;
  createTag: (name: string) => Promise<void>;
}

export const useKnowledgeStore = create<KnowledgeState & KnowledgeActions>()
  subscribeWithSelector(
    immer((set, get) => ({
      // 初始状态
      documents: [],
      categories: [],
      tags: [],
      searchQuery: '',
      searchResults: [],
      filters: {
        category: [],
        tags: [],
        dateRange: null,
        author: [],
        fileType: []
      },
      selectedDocument: null,
      loading: {
        documents: false,
        search: false,
        upload: false
      },
      error: null,

      // 文档管理
      loadDocuments: async (projectId: string) => {
        set((state) => {
          state.loading.documents = true;
          state.error = null;
        });

        try {
          const response = await fetch(`/api/projects/${projectId}/documents`);
          if (!response.ok) throw new Error('加载文档失败');

          const documents = await response.json();

          set((state) => {
            state.documents = documents;
            state.loading.documents = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : '加载文档失败';
            state.loading.documents = false;
          });
        }
      },

      createDocument: async (document: Partial<Document>) => {
        set((state) => {
          state.loading.upload = true;
          state.error = null;
        });

        try {
          const response = await fetch('/api/documents', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(document)
          });

          if (!response.ok) throw new Error('创建文档失败');

          const newDocument = await response.json();

          set((state) => {
            state.documents.unshift(newDocument);
            state.loading.upload = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : '创建文档失败';
            state.loading.upload = false;
          });
        }
      },

      updateDocument: async (documentId: string, updates: Partial<Document>) => {
        try {
          const response = await fetch(`/api/documents/${documentId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
          });

          if (!response.ok) throw new Error('更新文档失败');

          const updatedDocument = await response.json();

          set((state) => {
            const index = state.documents.findIndex(doc => doc.id === documentId);
            if (index !== -1) {
              state.documents[index] = updatedDocument;
            }

            // 更新搜索结果中的文档
            const searchIndex = state.searchResults.findIndex(doc => doc.id === documentId);
            if (searchIndex !== -1) {
              state.searchResults[searchIndex] = updatedDocument;
            }
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : '更新文档失败';
          });
        }
      },

      deleteDocument: async (documentId: string) => {
        try {
          const response = await fetch(`/api/documents/${documentId}`, {
            method: 'DELETE'
          });

          if (!response.ok) throw new Error('删除文档失败');

          set((state) => {
            state.documents = state.documents.filter(doc => doc.id !== documentId);
            state.searchResults = state.searchResults.filter(doc => doc.id !== documentId);

            if (state.selectedDocument === documentId) {
              state.selectedDocument = null;
            }
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : '删除文档失败';
          });
        }
      },

      // 搜索功能
      search: async (query: string, filters?: Partial<SearchFilters>) => {
        set((state) => {
          state.loading.search = true;
          state.error = null;
          state.searchQuery = query;

          if (filters) {
            state.filters = { ...state.filters, ...filters };
          }
        });

        try {
          const searchParams = new URLSearchParams({
            q: query,
            ...Object.entries(get().filters).reduce((acc, [key, value]) => {
              if (Array.isArray(value) && value.length > 0) {
                acc[key] = value.join(',');
              } else if (value && typeof value === 'object' && 'start' in value) {
                if (value.start) acc[`${key}_start`] = value.start.toISOString();
                if (value.end) acc[`${key}_end`] = value.end.toISOString();
              }
              return acc;
            }, {} as Record<string, string>)
          });

          const response = await fetch(`/api/documents/search?${searchParams}`);
          if (!response.ok) throw new Error('搜索失败');

          const results = await response.json();

          set((state) => {
            state.searchResults = results;
            state.loading.search = false;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : '搜索失败';
            state.loading.search = false;
          });
        }
      },

      setSearchQuery: (query: string) => {
        set((state) => {
          state.searchQuery = query;
        });
      },

      setFilters: (filters: Partial<SearchFilters>) => {
        set((state) => {
          state.filters = { ...state.filters, ...filters };
        });
      },

      clearSearch: () => {
        set((state) => {
          state.searchQuery = '';
          state.searchResults = [];
          state.filters = {
            category: [],
            tags: [],
            dateRange: null,
            author: [],
            fileType: []
          };
        });
      },

      // 文档操作
      selectDocument: (documentId: string | null) => {
        set((state) => {
          state.selectedDocument = documentId;
        });
      },

      incrementViewCount: async (documentId: string) => {
        try {
          await fetch(`/api/documents/${documentId}/view`, {
            method: 'POST'
          });

          set((state) => {
            const document = state.documents.find(doc => doc.id === documentId);
            if (document) {
              document.viewCount += 1;
            }

            const searchResult = state.searchResults.find(doc => doc.id === documentId);
            if (searchResult) {
              searchResult.viewCount += 1;
            }
          });
        } catch (error) {
          console.error('更新浏览次数失败:', error);
        }
      },

      incrementDownloadCount: async (documentId: string) => {
        try {
          await fetch(`/api/documents/${documentId}/download`, {
            method: 'POST'
          });

          set((state) => {
            const document = state.documents.find(doc => doc.id === documentId);
            if (document) {
              document.downloadCount += 1;
            }

            const searchResult = state.searchResults.find(doc => doc.id === documentId);
            if (searchResult) {
              searchResult.downloadCount += 1;
            }
          });
        } catch (error) {
          console.error('更新下载次数失败:', error);
        }
      },

      // AI功能
      generateSummary: async (documentId: string) => {
        try {
          const response = await fetch(`/api/documents/${documentId}/ai/summary`, {
            method: 'POST'
          });

          if (!response.ok) throw new Error('生成摘要失败');

          const { summary } = await response.json();

          set((state) => {
            const document = state.documents.find(doc => doc.id === documentId);
            if (document) {
              document.aiSummary = summary;
            }

            const searchResult = state.searchResults.find(doc => doc.id === documentId);
            if (searchResult) {
              searchResult.aiSummary = summary;
            }
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : '生成摘要失败';
          });
        }
      },

      generateTags: async (documentId: string) => {
        try {
          const response = await fetch(`/api/documents/${documentId}/ai/tags`, {
            method: 'POST'
          });

          if (!response.ok) throw new Error('生成标签失败');

          const { tags } = await response.json();

          set((state) => {
            const document = state.documents.find(doc => doc.id === documentId);
            if (document) {
              document.tags = [...new Set([...document.tags, ...tags])];
            }

            const searchResult = state.searchResults.find(doc => doc.id === documentId);
            if (searchResult) {
              searchResult.tags = [...new Set([...searchResult.tags, ...tags])];
            }
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : '生成标签失败';
          });
        }
      },

      findSimilarDocuments: async (documentId: string) => {
        try {
          const response = await fetch(`/api/documents/${documentId}/similar`);
          if (!response.ok) throw new Error('查找相似文档失败');

          return await response.json();
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : '查找相似文档失败';
          });
          return [];
        }
      },

      // 分类和标签
      loadCategories: async (projectId: string) => {
        try {
          const response = await fetch(`/api/projects/${projectId}/categories`);
          if (!response.ok) throw new Error('加载分类失败');

          const categories = await response.json();

          set((state) => {
            state.categories = categories;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : '加载分类失败';
          });
        }
      },

      loadTags: async (projectId: string) => {
        try {
          const response = await fetch(`/api/projects/${projectId}/tags`);
          if (!response.ok) throw new Error('加载标签失败');

          const tags = await response.json();

          set((state) => {
            state.tags = tags;
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : '加载标签失败';
          });
        }
      },

      createCategory: async (name: string) => {
        try {
          const response = await fetch('/api/categories', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
          });

          if (!response.ok) throw new Error('创建分类失败');

          set((state) => {
            if (!state.categories.includes(name)) {
              state.categories.push(name);
            }
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : '创建分类失败';
          });
        }
      },

      createTag: async (name: string) => {
        try {
          const response = await fetch('/api/tags', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
          });

          if (!response.ok) throw new Error('创建标签失败');

          set((state) => {
            if (!state.tags.includes(name)) {
              state.tags.push(name);
            }
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : '创建标签失败';
          });
        }
      }
    }))
  )
);

// 选择器
export const useDocuments = () => useKnowledgeStore(state => state.documents);
export const useSearchResults = () => useKnowledgeStore(state => state.searchResults);
export const useSelectedDocument = () => useKnowledgeStore(state => state.selectedDocument);
export const useKnowledgeLoading = () => useKnowledgeStore(state => state.loading);
export const useKnowledgeError = () => useKnowledgeStore(state => state.error);
export const useSearchQuery = () => useKnowledgeStore(state => state.searchQuery);
export const useSearchFilters = () => useKnowledgeStore(state => state.filters);
```

## 4. 后端API设计

### 4.1 文档管理接口

```typescript
// pages/api/documents/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { DocumentService } from '@/lib/services/DocumentService';
import { LangChainDocumentProcessor } from '@/lib/ai/DocumentProcessor';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: '未授权访问' });
  }

  const documentService = new DocumentService();
  const documentProcessor = new LangChainDocumentProcessor();

  switch (req.method) {
    case 'GET':
      try {
        const { projectId, category, tags, search } = req.query;
        const documents = await documentService.getDocuments({
          projectId: projectId as string,
          category: category as string,
          tags: tags ? (tags as string).split(',') : undefined,
          search: search as string,
          userId: session.user.id
        });

        res.status(200).json(documents);
      } catch (error) {
        res.status(500).json({ error: '获取文档失败' });
      }
      break;

    case 'POST':
      try {
        const documentData = req.body;

        // 创建文档
        const document = await documentService.createDocument({
          ...documentData,
          authorId: session.user.id
        });

        // AI处理：生成摘要和标签
        const aiEnhancements =
          await documentProcessor.processDocument(document);

        // 更新文档
        const enhancedDocument = await documentService.updateDocument(
          document.id,
          aiEnhancements
        );

        res.status(201).json(enhancedDocument);
      } catch (error) {
        res.status(500).json({ error: '创建文档失败' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
```

### 4.2 智能搜索接口

```typescript
// pages/api/documents/search.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { LangChainSearchEngine } from '@/lib/ai/SearchEngine';
import { DocumentService } from '@/lib/services/DocumentService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: '未授权访问' });
  }

  try {
    const { q: query, projectId, ...filters } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: '搜索查询不能为空' });
    }

    const searchEngine = new LangChainSearchEngine();
    const documentService = new DocumentService();

    // 执行语义搜索
    const searchResults = await searchEngine.semanticSearch({
      query,
      projectId: projectId as string,
      filters: {
        category: filters.category
          ? (filters.category as string).split(',')
          : [],
        tags: filters.tags ? (filters.tags as string).split(',') : [],
        author: filters.author ? (filters.author as string).split(',') : [],
        fileType: filters.fileType
          ? (filters.fileType as string).split(',')
          : [],
        dateRange: {
          start: filters.dateRange_start
            ? new Date(filters.dateRange_start as string)
            : null,
          end: filters.dateRange_end
            ? new Date(filters.dateRange_end as string)
            : null
        }
      },
      userId: session.user.id,
      limit: 50
    });

    // 记录搜索历史
    await documentService.recordSearchHistory({
      userId: session.user.id,
      query,
      projectId: projectId as string,
      resultCount: searchResults.length
    });

    res.status(200).json(searchResults);
  } catch (error) {
    console.error('搜索失败:', error);
    res.status(500).json({ error: '搜索失败' });
  }
}
```

### 4.3 AI增强接口

```typescript
// pages/api/documents/[id]/ai/summary.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]';
import { LangChainSummaryChain } from '@/lib/ai/chains/SummaryChain';
import { DocumentService } from '@/lib/services/DocumentService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: '未授权访问' });
  }

  try {
    const { id: documentId } = req.query;

    const documentService = new DocumentService();
    const document = await documentService.getDocumentById(
      documentId as string,
      session.user.id
    );

    if (!document) {
      return res.status(404).json({ error: '文档不存在' });
    }

    // 使用LangChain生成摘要
    const summaryChain = new LangChainSummaryChain();
    const summary = await summaryChain.generateSummary({
      content: document.content,
      title: document.title,
      context: {
        category: document.category,
        tags: document.tags
      }
    });

    // 更新文档摘要
    await documentService.updateDocument(documentId as string, {
      aiSummary: summary
    });

    res.status(200).json({ summary });
  } catch (error) {
    console.error('生成摘要失败:', error);
    res.status(500).json({ error: '生成摘要失败' });
  }
}
```

## 5. LangChain集成

### 5.1 文档处理链

```typescript
// lib/ai/chains/DocumentProcessingChain.ts
import { BaseChain, ChainInputs } from 'langchain/chains';
import { OpenAI } from 'langchain/llms/openai';
import { PromptTemplate } from 'langchain/prompts';
import { LLMChain } from 'langchain/chains';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';

interface DocumentProcessingInput {
  content: string;
  title: string;
  metadata: {
    category?: string;
    author: string;
    fileType: string;
  };
}

interface DocumentProcessingOutput {
  summary: string;
  tags: string[];
  keyPoints: string[];
  embeddings: number[];
  chunks: Array<{
    content: string;
    metadata: any;
  }>;
}

export class DocumentProcessingChain extends BaseChain {
  private llm: OpenAI;
  private embeddings: OpenAIEmbeddings;
  private textSplitter: RecursiveCharacterTextSplitter;
  private summaryChain: LLMChain;
  private tagChain: LLMChain;
  private keyPointsChain: LLMChain;

  constructor() {
    super();

    this.llm = new OpenAI({
      temperature: 0.3,
      modelName: 'gpt-3.5-turbo'
    });

    this.embeddings = new OpenAIEmbeddings();

    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    });

    // 摘要生成链
    const summaryPrompt = PromptTemplate.fromTemplate(`
      请为以下文档生成一个简洁的摘要（不超过200字）：
      
      标题：{title}
      分类：{category}
      内容：{content}
      
      摘要：
    `);

    this.summaryChain = new LLMChain({
      llm: this.llm,
      prompt: summaryPrompt
    });

    // 标签生成链
    const tagPrompt = PromptTemplate.fromTemplate(`
      请为以下文档生成5-8个相关标签，标签应该简洁且具有代表性：
      
      标题：{title}
      分类：{category}
      内容：{content}
      
      请以JSON数组格式返回标签：["标签1", "标签2", ...]
    `);

    this.tagChain = new LLMChain({
      llm: this.llm,
      prompt: tagPrompt
    });

    // 关键点提取链
    const keyPointsPrompt = PromptTemplate.fromTemplate(`
      请从以下文档中提取3-5个关键点：
      
      标题：{title}
      内容：{content}
      
      请以JSON数组格式返回关键点：["关键点1", "关键点2", ...]
    `);

    this.keyPointsChain = new LLMChain({
      llm: this.llm,
      prompt: keyPointsPrompt
    });
  }

  _chainType(): string {
    return 'document_processing_chain';
  }

  get inputKeys(): string[] {
    return ['content', 'title', 'metadata'];
  }

  get outputKeys(): string[] {
    return ['summary', 'tags', 'keyPoints', 'embeddings', 'chunks'];
  }

  async _call(
    values: DocumentProcessingInput
  ): Promise<DocumentProcessingOutput> {
    const { content, title, metadata } = values;

    try {
      // 并行执行多个AI任务
      const [summaryResult, tagResult, keyPointsResult] = await Promise.all([
        this.summaryChain.call({
          title,
          category: metadata.category || '未分类',
          content: content.slice(0, 3000) // 限制长度以控制成本
        }),
        this.tagChain.call({
          title,
          category: metadata.category || '未分类',
          content: content.slice(0, 2000)
        }),
        this.keyPointsChain.call({
          title,
          content: content.slice(0, 2000)
        })
      ]);

      // 解析标签和关键点
      let tags: string[] = [];
      let keyPoints: string[] = [];

      try {
        tags = JSON.parse(tagResult.text);
      } catch {
        // 如果解析失败，尝试简单的分割
        tags = tagResult.text
          .split(',')
          .map((tag: string) => tag.trim())
          .filter(Boolean);
      }

      try {
        keyPoints = JSON.parse(keyPointsResult.text);
      } catch {
        keyPoints = keyPointsResult.text.split('\n').filter(Boolean);
      }

      // 文档分块
      const chunks = await this.textSplitter.createDocuments(
        [content],
        [{ title, ...metadata }]
      );

      // 生成嵌入向量
      const embeddings = await this.embeddings.embedQuery(content);

      return {
        summary: summaryResult.text.trim(),
        tags: tags.slice(0, 8), // 限制标签数量
        keyPoints: keyPoints.slice(0, 5), // 限制关键点数量
        embeddings,
        chunks: chunks.map((chunk) => ({
          content: chunk.pageContent,
          metadata: chunk.metadata
        }))
      };
    } catch (error) {
      console.error('文档处理失败:', error);
      throw new Error('文档处理失败');
    }
  }
}
```

### 5.2 语义搜索引擎

```typescript
// lib/ai/SearchEngine.ts
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { OpenAI } from 'langchain/llms/openai';
import { PromptTemplate } from 'langchain/prompts';
import { LLMChain } from 'langchain/chains';
import { DocumentService } from '@/lib/services/DocumentService';

interface SearchFilters {
  category: string[];
  tags: string[];
  author: string[];
  fileType: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

interface SearchOptions {
  query: string;
  projectId: string;
  filters: SearchFilters;
  userId: string;
  limit: number;
}

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  content: string;
  relevanceScore: number;
  highlights: string[];
  metadata: any;
}

export class LangChainSearchEngine {
  private embeddings: OpenAIEmbeddings;
  private vectorStore: PineconeStore;
  private llm: OpenAI;
  private queryEnhancementChain: LLMChain;
  private documentService: DocumentService;

  constructor() {
    this.embeddings = new OpenAIEmbeddings();
    this.llm = new OpenAI({ temperature: 0.1 });
    this.documentService = new DocumentService();

    // 查询增强链
    const queryEnhancementPrompt = PromptTemplate.fromTemplate(`
      用户搜索查询：{query}
      
      请分析这个查询的意图，并生成3-5个相关的搜索关键词或短语，这些关键词应该能帮助找到更相关的文档。
      
      原查询：{query}
      增强关键词：
    `);

    this.queryEnhancementChain = new LLMChain({
      llm: this.llm,
      prompt: queryEnhancementPrompt
    });
  }

  async semanticSearch(options: SearchOptions): Promise<SearchResult[]> {
    const { query, projectId, filters, userId, limit } = options;

    try {
      // 1. 查询增强
      const enhancedQuery = await this.enhanceQuery(query);

      // 2. 生成查询向量
      const queryEmbedding = await this.embeddings.embedQuery(enhancedQuery);

      // 3. 向量搜索
      const vectorResults = await this.vectorStore.similaritySearchWithScore(
        enhancedQuery,
        limit * 2 // 获取更多结果用于后续过滤
      );

      // 4. 应用过滤器
      const filteredResults = await this.applyFilters(
        vectorResults,
        filters,
        projectId,
        userId
      );

      // 5. 重新排序和评分
      const rankedResults = await this.rankResults(
        filteredResults,
        query,
        enhancedQuery
      );

      // 6. 生成高亮
      const resultsWithHighlights = await this.generateHighlights(
        rankedResults.slice(0, limit),
        query
      );

      return resultsWithHighlights;
    } catch (error) {
      console.error('语义搜索失败:', error);
      throw new Error('搜索失败');
    }
  }

  private async enhanceQuery(query: string): Promise<string> {
    try {
      const result = await this.queryEnhancementChain.call({ query });
      return `${query} ${result.text}`.trim();
    } catch (error) {
      console.error('查询增强失败:', error);
      return query;
    }
  }

  private async applyFilters(
    vectorResults: Array<[any, number]>,
    filters: SearchFilters,
    projectId: string,
    userId: string
  ): Promise<Array<[any, number]>> {
    // 获取文档详细信息并应用过滤器
    const documentIds = vectorResults.map(([doc]) => doc.metadata.documentId);
    const documents = await this.documentService.getDocumentsByIds(
      documentIds,
      userId
    );

    const documentMap = new Map(documents.map((doc) => [doc.id, doc]));

    return vectorResults.filter(([doc, score]) => {
      const document = documentMap.get(doc.metadata.documentId);
      if (!document || document.projectId !== projectId) return false;

      // 应用分类过滤
      if (
        filters.category.length > 0 &&
        !filters.category.includes(document.category)
      ) {
        return false;
      }

      // 应用标签过滤
      if (filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some((tag) =>
          document.tags.includes(tag)
        );
        if (!hasMatchingTag) return false;
      }

      // 应用作者过滤
      if (
        filters.author.length > 0 &&
        !filters.author.includes(document.authorId)
      ) {
        return false;
      }

      // 应用文件类型过滤
      if (
        filters.fileType.length > 0 &&
        !filters.fileType.includes(document.fileType)
      ) {
        return false;
      }

      // 应用日期范围过滤
      if (
        filters.dateRange.start &&
        document.createdAt < filters.dateRange.start
      ) {
        return false;
      }
      if (filters.dateRange.end && document.createdAt > filters.dateRange.end) {
        return false;
      }

      return true;
    });
  }

  private async rankResults(
    results: Array<[any, number]>,
    originalQuery: string,
    enhancedQuery: string
  ): Promise<SearchResult[]> {
    const documentIds = results.map(([doc]) => doc.metadata.documentId);
    const documents = await this.documentService.getDocumentsByIds(documentIds);
    const documentMap = new Map(documents.map((doc) => [doc.id, doc]));

    return results
      .map(([doc, vectorScore]) => {
        const document = documentMap.get(doc.metadata.documentId);
        if (!document) return null;

        // 计算综合相关性评分
        const titleMatch = this.calculateTextMatch(
          originalQuery,
          document.title
        );
        const contentMatch = this.calculateTextMatch(
          originalQuery,
          doc.pageContent
        );
        const tagMatch = this.calculateTagMatch(originalQuery, document.tags);

        // 综合评分
        const relevanceScore =
          vectorScore * 0.4 +
          titleMatch * 0.3 +
          contentMatch * 0.2 +
          tagMatch * 0.1;

        return {
          id: document.id,
          title: document.title,
          description: document.description,
          content: doc.pageContent,
          relevanceScore,
          highlights: [],
          metadata: {
            ...document,
            chunkIndex: doc.metadata.chunkIndex
          }
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.relevanceScore - a!.relevanceScore) as SearchResult[];
  }

  private calculateTextMatch(query: string, text: string): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const textWords = text.toLowerCase().split(/\s+/);

    let matches = 0;
    queryWords.forEach((queryWord) => {
      if (textWords.some((textWord) => textWord.includes(queryWord))) {
        matches++;
      }
    });

    return matches / queryWords.length;
  }

  private calculateTagMatch(query: string, tags: string[]): number {
    const queryLower = query.toLowerCase();
    const matchingTags = tags.filter(
      (tag) =>
        tag.toLowerCase().includes(queryLower) ||
        queryLower.includes(tag.toLowerCase())
    );

    return matchingTags.length / Math.max(tags.length, 1);
  }

  private async generateHighlights(
    results: SearchResult[],
    query: string
  ): Promise<SearchResult[]> {
    const queryWords = query.toLowerCase().split(/\s+/);

    return results.map((result) => {
      const highlights: string[] = [];

      // 在标题中查找高亮
      queryWords.forEach((word) => {
        if (result.title.toLowerCase().includes(word)) {
          highlights.push(word);
        }
      });

      // 在内容中查找高亮片段
      const contentHighlights = this.extractHighlightSnippets(
        result.content,
        queryWords
      );
      highlights.push(...contentHighlights);

      return {
        ...result,
        highlights: [...new Set(highlights)] // 去重
      };
    });
  }

  private extractHighlightSnippets(
    content: string,
    queryWords: string[]
  ): string[] {
    const snippets: string[] = [];
    const sentences = content.split(/[.!?]+/);

    sentences.forEach((sentence) => {
      const sentenceLower = sentence.toLowerCase();
      const hasMatch = queryWords.some((word) => sentenceLower.includes(word));

      if (hasMatch && sentence.trim().length > 10) {
        snippets.push(sentence.trim().slice(0, 150));
      }
    });

    return snippets.slice(0, 3); // 最多返回3个片段
  }
}
```

## 6. LangGraph工作流引擎

### 6.1 知识图谱构建工作流

```typescript
// lib/ai/workflows/KnowledgeGraphWorkflow.ts
import { StateGraph, END } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';
import { OpenAI } from 'langchain/llms/openai';
import { PromptTemplate } from 'langchain/prompts';

interface KnowledgeGraphState {
  documents: Array<{
    id: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
  }>;
  entities: Array<{
    name: string;
    type: string;
    description: string;
    documentIds: string[];
  }>;
  relationships: Array<{
    source: string;
    target: string;
    type: string;
    weight: number;
    description: string;
  }>;
  currentStep: string;
  error?: string;
}

export class KnowledgeGraphWorkflow {
  private llm: OpenAI;
  private workflow: StateGraph<KnowledgeGraphState>;

  constructor() {
    this.llm = new OpenAI({ temperature: 0.1 });
    this.workflow = this.createWorkflow();
  }

  private createWorkflow(): StateGraph<KnowledgeGraphState> {
    const workflow = new StateGraph<KnowledgeGraphState>({
      channels: {
        documents: {
          reducer: (x, y) => y ?? x,
          default: () => []
        },
        entities: {
          reducer: (x, y) => y ?? x,
          default: () => []
        },
        relationships: {
          reducer: (x, y) => y ?? x,
          default: () => []
        },
        currentStep: {
          reducer: (x, y) => y ?? x,
          default: () => 'start'
        },
        error: {
          reducer: (x, y) => y ?? x
        }
      }
    });

    // 添加节点
    workflow.addNode('extract_entities', this.extractEntities.bind(this));
    workflow.addNode('find_relationships', this.findRelationships.bind(this));
    workflow.addNode('validate_graph', this.validateGraph.bind(this));
    workflow.addNode('optimize_graph', this.optimizeGraph.bind(this));

    // 定义边
    workflow.addEdge('__start__', 'extract_entities');
    workflow.addEdge('extract_entities', 'find_relationships');
    workflow.addEdge('find_relationships', 'validate_graph');
    workflow.addEdge('validate_graph', 'optimize_graph');
    workflow.addEdge('optimize_graph', '__end__');

    return workflow;
  }

  private async extractEntities(
    state: KnowledgeGraphState
  ): Promise<Partial<KnowledgeGraphState>> {
    try {
      const entityPrompt = PromptTemplate.fromTemplate(`
        从以下文档中提取关键实体（人物、概念、技术、项目等）：
        
        标题：{title}
        分类：{category}
        内容：{content}
        
        请以JSON格式返回实体列表：
        [
          {
            "name": "实体名称",
            "type": "实体类型（person/concept/technology/project/other）",
            "description": "简短描述"
          }
        ]
      `);

      const allEntities = [];

      for (const doc of state.documents) {
        const result = await this.llm.call(
          await entityPrompt.format({
            title: doc.title,
            category: doc.category,
            content: doc.content.slice(0, 2000) // 限制长度
          })
        );

        try {
          const entities = JSON.parse(result);
          entities.forEach((entity: any) => {
            const existingEntity = allEntities.find(
              (e) => e.name === entity.name
            );
            if (existingEntity) {
              existingEntity.documentIds.push(doc.id);
            } else {
              allEntities.push({
                ...entity,
                documentIds: [doc.id]
              });
            }
          });
        } catch (error) {
          console.error('解析实体失败:', error);
        }
      }

      return {
        entities: allEntities,
        currentStep: 'extract_entities_completed'
      };
    } catch (error) {
      return {
        error: `实体提取失败: ${error.message}`,
        currentStep: 'error'
      };
    }
  }

  private async findRelationships(
    state: KnowledgeGraphState
  ): Promise<Partial<KnowledgeGraphState>> {
    try {
      const relationshipPrompt = PromptTemplate.fromTemplate(`
        分析以下实体之间的关系：
        
        实体列表：{entities}
        
        请识别实体之间的关系，并以JSON格式返回：
        [
          {
            "source": "源实体名称",
            "target": "目标实体名称",
            "type": "关系类型（related_to/part_of/depends_on/similar_to/collaborates_with）",
            "weight": 关系强度（0-1之间的数值）,
            "description": "关系描述"
          }
        ]
      `);

      const entityNames = state.entities.map((e) => e.name).join(', ');
      const result = await this.llm.call(
        await relationshipPrompt.format({
          entities: entityNames
        })
      );

      let relationships = [];
      try {
        relationships = JSON.parse(result);
      } catch (error) {
        console.error('解析关系失败:', error);
      }

      return {
        relationships,
        currentStep: 'find_relationships_completed'
      };
    } catch (error) {
      return {
        error: `关系发现失败: ${error.message}`,
        currentStep: 'error'
      };
    }
  }

  private async validateGraph(
    state: KnowledgeGraphState
  ): Promise<Partial<KnowledgeGraphState>> {
    try {
      // 验证实体和关系的有效性
      const validEntities = state.entities.filter(
        (entity) => entity.name && entity.type && entity.documentIds.length > 0
      );

      const entityNames = new Set(validEntities.map((e) => e.name));
      const validRelationships = state.relationships.filter(
        (rel) =>
          entityNames.has(rel.source) &&
          entityNames.has(rel.target) &&
          rel.source !== rel.target &&
          rel.weight > 0.1 // 过滤弱关系
      );

      return {
        entities: validEntities,
        relationships: validRelationships,
        currentStep: 'validate_graph_completed'
      };
    } catch (error) {
      return {
        error: `图谱验证失败: ${error.message}`,
        currentStep: 'error'
      };
    }
  }

  private async optimizeGraph(
    state: KnowledgeGraphState
  ): Promise<Partial<KnowledgeGraphState>> {
    try {
      // 优化图谱结构
      const optimizedRelationships = state.relationships
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 100); // 限制关系数量

      // 移除孤立节点
      const connectedEntityNames = new Set();
      optimizedRelationships.forEach((rel) => {
        connectedEntityNames.add(rel.source);
        connectedEntityNames.add(rel.target);
      });

      const optimizedEntities = state.entities.filter((entity) =>
        connectedEntityNames.has(entity.name)
      );

      return {
        entities: optimizedEntities,
        relationships: optimizedRelationships,
        currentStep: 'optimize_graph_completed'
      };
    } catch (error) {
      return {
        error: `图谱优化失败: ${error.message}`,
        currentStep: 'error'
      };
    }
  }

  async buildKnowledgeGraph(documents: any[]): Promise<{
    entities: any[];
    relationships: any[];
  }> {
    const initialState: KnowledgeGraphState = {
      documents,
      entities: [],
      relationships: [],
      currentStep: 'start'
    };

    const result = await this.workflow.invoke(initialState);

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      entities: result.entities,
      relationships: result.relationships
    };
  }
}
```

## 7. 数据库设计

### 7.1 数据表结构

```sql
-- 文档表
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category VARCHAR(100),
  file_type VARCHAR(50),
  file_size BIGINT,
  file_path VARCHAR(500),
  project_id UUID NOT NULL REFERENCES projects(id),
  author_id UUID NOT NULL REFERENCES users(id),
  ai_summary TEXT,
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- 文档标签表
CREATE TABLE document_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  tag_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 文档分块表（用于向量搜索）
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI embedding维度
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 搜索历史表
CREATE TABLE search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  project_id UUID REFERENCES projects(id),
  query TEXT NOT NULL,
  result_count INTEGER,
  filters JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 知识图谱实体表
CREATE TABLE knowledge_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- person, concept, technology, project, other
  description TEXT,
  project_id UUID NOT NULL REFERENCES projects(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 知识图谱关系表
CREATE TABLE knowledge_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_entity_id UUID NOT NULL REFERENCES knowledge_entities(id) ON DELETE CASCADE,
  target_entity_id UUID NOT NULL REFERENCES knowledge_entities(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL, -- related_to, part_of, depends_on, similar_to, collaborates_with
  weight DECIMAL(3,2) DEFAULT 0.5,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 实体文档关联表
CREATE TABLE entity_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES knowledge_entities(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  relevance_score DECIMAL(3,2) DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 文档分享表
CREATE TABLE document_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES users(id),
  shared_with UUID REFERENCES users(id),
  share_token VARCHAR(255) UNIQUE,
  permissions JSONB DEFAULT '{"read": true, "download": false}',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 文档评论表
CREATE TABLE document_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  parent_id UUID REFERENCES document_comments(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- 创建索引
CREATE INDEX idx_documents_project_id ON documents(project_id);
CREATE INDEX idx_documents_author_id ON documents(author_id);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_created_at ON documents(created_at);
CREATE INDEX idx_document_tags_document_id ON document_tags(document_id);
CREATE INDEX idx_document_tags_tag_name ON document_tags(tag_name);
CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_search_history_user_id ON search_history(user_id);
CREATE INDEX idx_knowledge_entities_project_id ON knowledge_entities(project_id);
CREATE INDEX idx_knowledge_entities_type ON knowledge_entities(type);
CREATE INDEX idx_entity_documents_entity_id ON entity_documents(entity_id);
CREATE INDEX idx_entity_documents_document_id ON entity_documents(document_id);

-- 全文搜索索引
CREATE INDEX idx_documents_content_fts ON documents USING gin(to_tsvector('chinese', content));
CREATE INDEX idx_documents_title_fts ON documents USING gin(to_tsvector('chinese', title));
```

### 7.2 数据访问层

```typescript
// lib/dao/DocumentDAO.ts
import { Pool } from 'pg';
import { Document, DocumentFilters, SearchResult } from '@/types/knowledge';

export class DocumentDAO {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createDocument(document: Partial<Document>): Promise<Document> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // 插入文档
      const documentResult = await client.query(
        `
        INSERT INTO documents (
          title, description, content, category, file_type, file_size, 
          file_path, project_id, author_id, ai_summary
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `,
        [
          document.title,
          document.description,
          document.content,
          document.category,
          document.fileType,
          document.fileSize,
          document.filePath,
          document.projectId,
          document.authorId,
          document.aiSummary
        ]
      );

      const newDocument = documentResult.rows[0];

      // 插入标签
      if (document.tags && document.tags.length > 0) {
        for (const tag of document.tags) {
          await client.query(
            `
            INSERT INTO document_tags (document_id, tag_name)
            VALUES ($1, $2)
          `,
            [newDocument.id, tag]
          );
        }
      }

      await client.query('COMMIT');

      return await this.getDocumentById(newDocument.id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getDocumentById(
    documentId: string,
    userId?: string
  ): Promise<Document | null> {
    const result = await this.pool.query(
      `
      SELECT 
        d.*,
        u.name as author_name,
        u.avatar as author_avatar,
        ARRAY_AGG(dt.tag_name) FILTER (WHERE dt.tag_name IS NOT NULL) as tags
      FROM documents d
      LEFT JOIN users u ON d.author_id = u.id
      LEFT JOIN document_tags dt ON d.id = dt.document_id
      WHERE d.id = $1 AND d.deleted_at IS NULL
      GROUP BY d.id, u.name, u.avatar
    `,
      [documentId]
    );

    if (result.rows.length === 0) return null;

    const doc = result.rows[0];

    // 增加浏览次数
    if (userId) {
      await this.incrementViewCount(documentId);
    }

    return this.mapRowToDocument(doc);
  }

  async getDocuments(filters: DocumentFilters): Promise<Document[]> {
    let query = `
      SELECT 
        d.*,
        u.name as author_name,
        u.avatar as author_avatar,
        ARRAY_AGG(DISTINCT dt.tag_name) FILTER (WHERE dt.tag_name IS NOT NULL) as tags
      FROM documents d
      LEFT JOIN users u ON d.author_id = u.id
      LEFT JOIN document_tags dt ON d.id = dt.document_id
      WHERE d.deleted_at IS NULL
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (filters.projectId) {
      query += ` AND d.project_id = $${paramIndex}`;
      params.push(filters.projectId);
      paramIndex++;
    }

    if (filters.category) {
      query += ` AND d.category = $${paramIndex}`;
      params.push(filters.category);
      paramIndex++;
    }

    if (filters.authorId) {
      query += ` AND d.author_id = $${paramIndex}`;
      params.push(filters.authorId);
      paramIndex++;
    }

    if (filters.search) {
      query += ` AND (
        to_tsvector('chinese', d.title) @@ plainto_tsquery('chinese', $${paramIndex})
        OR to_tsvector('chinese', d.content) @@ plainto_tsquery('chinese', $${paramIndex})
      )`;
      params.push(filters.search);
      paramIndex++;
    }

    query += ` GROUP BY d.id, u.name, u.avatar`;

    // 标签过滤（需要在GROUP BY之后）
    if (filters.tags && filters.tags.length > 0) {
      query += ` HAVING ARRAY_AGG(DISTINCT dt.tag_name) && $${paramIndex}`;
      params.push(filters.tags);
      paramIndex++;
    }

    query += ` ORDER BY d.updated_at DESC`;

    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }

    if (filters.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(filters.offset);
    }

    const result = await this.pool.query(query, params);

    return result.rows.map((row) => this.mapRowToDocument(row));
  }

  async updateDocument(
    documentId: string,
    updates: Partial<Document>
  ): Promise<Document> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // 更新文档基本信息
      const updateFields = [];
      const params = [];
      let paramIndex = 1;

      if (updates.title !== undefined) {
        updateFields.push(`title = $${paramIndex}`);
        params.push(updates.title);
        paramIndex++;
      }

      if (updates.description !== undefined) {
        updateFields.push(`description = $${paramIndex}`);
        params.push(updates.description);
        paramIndex++;
      }

      if (updates.content !== undefined) {
        updateFields.push(`content = $${paramIndex}`);
        params.push(updates.content);
        paramIndex++;
      }

      if (updates.category !== undefined) {
        updateFields.push(`category = $${paramIndex}`);
        params.push(updates.category);
        paramIndex++;
      }

      if (updates.aiSummary !== undefined) {
        updateFields.push(`ai_summary = $${paramIndex}`);
        params.push(updates.aiSummary);
        paramIndex++;
      }

      updateFields.push(`updated_at = NOW()`);

      if (updateFields.length > 1) {
        // 除了updated_at之外还有其他字段
        params.push(documentId);
        await client.query(
          `
          UPDATE documents 
          SET ${updateFields.join(', ')}
          WHERE id = $${paramIndex}
        `,
          params
        );
      }

      // 更新标签
      if (updates.tags !== undefined) {
        // 删除现有标签
        await client.query('DELETE FROM document_tags WHERE document_id = $1', [
          documentId
        ]);

        // 插入新标签
        for (const tag of updates.tags) {
          await client.query(
            'INSERT INTO document_tags (document_id, tag_name) VALUES ($1, $2)',
            [documentId, tag]
          );
        }
      }

      await client.query('COMMIT');

      return await this.getDocumentById(documentId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteDocument(documentId: string): Promise<void> {
    await this.pool.query(
      'UPDATE documents SET deleted_at = NOW() WHERE id = $1',
      [documentId]
    );
  }

  async incrementViewCount(documentId: string): Promise<void> {
    await this.pool.query(
      'UPDATE documents SET view_count = view_count + 1 WHERE id = $1',
      [documentId]
    );
  }

  async incrementDownloadCount(documentId: string): Promise<void> {
    await this.pool.query(
      'UPDATE documents SET download_count = download_count + 1 WHERE id = $1',
      [documentId]
    );
  }

  async recordSearchHistory(data: {
    userId: string;
    query: string;
    projectId?: string;
    resultCount: number;
    filters?: any;
  }): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO search_history (user_id, project_id, query, result_count, filters)
      VALUES ($1, $2, $3, $4, $5)
    `,
      [
        data.userId,
        data.projectId,
        data.query,
        data.resultCount,
        JSON.stringify(data.filters || {})
      ]
    );
  }

  private mapRowToDocument(row: any): Document {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      content: row.content,
      category: row.category,
      tags: row.tags || [],
      author: {
        id: row.author_id,
        name: row.author_name,
        avatar: row.author_avatar
      },
      fileType: row.file_type,
      fileSize: row.file_size,
      filePath: row.file_path,
      projectId: row.project_id,
      aiSummary: row.ai_summary,
      viewCount: row.view_count,
      downloadCount: row.download_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
```

## 8. 性能优化

### 8.1 前端性能优化

- **虚拟化列表**: 使用react-window处理大量文档列表
- **懒加载**: 文档内容和图片的懒加载
- **缓存策略**: React Query缓存API响应
- **代码分割**: 按页面和功能模块分割代码
- **预加载**: 预加载用户可能访问的文档

### 8.2 后端性能优化

- **数据库优化**: 合理的索引设计和查询优化
- **Redis缓存**: 缓存热门文档和搜索结果
- **向量数据库**: 使用Pinecone优化语义搜索性能
- **CDN**: 文档文件的CDN分发
- **限流**: API请求限流和防护

## 9. 错误处理和监控

### 9.1 错误处理策略

- **前端错误边界**: React错误边界组件
- **API错误处理**: 统一的错误响应格式
- **用户友好提示**: 清晰的错误信息展示
- **重试机制**: 网络请求的自动重试

### 9.2 监控指标

- **性能监控**: 页面加载时间、API响应时间
- **用户行为**: 搜索查询、文档访问统计
- **AI服务监控**: LangChain调用成功率和延迟
- **错误监控**: 错误率和错误类型统计

## 10. 测试策略

### 10.1 前端测试

- **组件测试**: Jest + React Testing Library
- **集成测试**: API集成测试
- **E2E测试**: Playwright端到端测试
- **性能测试**: Lighthouse性能测试

### 10.2 后端测试

- **单元测试**: API函数和服务类测试
- **集成测试**: 数据库和外部服务集成测试
- **AI功能测试**: LangChain链和工作流测试
- **负载测试**: 高并发场景测试

## 11. 部署配置

### 11.1 环境变量

```bash
# AI服务配置
OPENAI_API_KEY=your_openai_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX_NAME=knowledge_base

# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/knowledge_db
REDIS_URL=redis://localhost:6379

# 文件存储配置
FILE_STORAGE_TYPE=s3
AWS_S3_BUCKET=knowledge-files
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# 搜索配置
MAX_SEARCH_RESULTS=50
SEARCH_CACHE_TTL=300

# AI配置
AI_PROCESSING_ENABLED=true
MAX_DOCUMENT_SIZE=10485760
AI_SUMMARY_MAX_LENGTH=200
```

### 11.2 Docker配置

```dockerfile
# Dockerfile.knowledge
FROM node:18-alpine

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
```

## 12. 总结

AI知识库页面是一个功能丰富的智能文档管理系统，具有以下特点：

- **智能化**: 基于LangChain和LangGraph的AI增强功能
- **高性能**: 优化的搜索和渲染性能
- **用户友好**: 直观的界面设计和交互体验
- **可扩展**: 模块化的架构设计
- **安全可靠**: 完善的权限控制和错误处理

该设计文档为开发团队提供了完整的技术实现指南，确保项目的高质量交付。
