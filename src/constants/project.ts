// 项目状态
export const PROJECT_STATUS = {
  PLANNING: { key: 'planning', color: 'blue' },
  ACTIVE: { key: 'active', color: 'green' },
  COMPLETED: { key: 'completed', color: 'purple' },
  ARCHIVED: { key: 'archived', color: 'gray' }
};

// 项目可见性
export const PROJECT_VISIBILITY = {
  PRIVATE: { key: 'private', descriptionKey: 'privateDescription' },
  TEAM: { key: 'team', descriptionKey: 'teamDescription' },
  PUBLIC: { key: 'public', descriptionKey: 'publicDescription' }
};

// 任务状态
export const TASK_STATUS = {
  TODO: { key: 'todo', label: '待办', color: 'gray' },
  IN_PROGRESS: { key: 'inProgress', label: '进行中', color: 'blue' },
  REVIEW: { key: 'review', label: '评审中', color: 'yellow' },
  DONE: { key: 'done', label: '已完成', color: 'green' },
  BLOCKED: { key: 'blocked', label: '已阻塞', color: 'red' }
};

// 任务优先级
export const TASK_PRIORITY = {
  LOW: { key: 'low', label: '低', color: 'gray' },
  MEDIUM: { key: 'medium', label: '中', color: 'blue' },
  HIGH: { key: 'high', label: '高', color: 'orange' },
  URGENT: { key: 'urgent', label: '紧急', color: 'red' }
};

// 迭代状态
export const SPRINT_STATUS = {
  PLANNED: { key: 'planned', label: '计划中', color: 'gray' },
  ACTIVE: { key: 'active', label: '进行中', color: 'green' },
  COMPLETED: { key: 'completed', label: '已完成', color: 'blue' },
  CANCELLED: { key: 'cancelled', label: '已取消', color: 'red' }
};

// 项目成员角色
export const PROJECT_MEMBER_ROLE = {
  OWNER: { key: 'owner', descriptionKey: 'ownerDescription' },
  ADMIN: { key: 'admin', descriptionKey: 'adminDescription' },
  MEMBER: { key: 'member', descriptionKey: 'memberDescription' },
  VIEWER: { key: 'viewer', descriptionKey: 'viewerDescription' }
};

// 获取项目成员角色的翻译标签
export const getProjectMemberRoleLabels = (t: (key: string) => string) => ({
  OWNER: {
    label: t('projects.team.owner'),
    description: t('projects.team.ownerDescription')
  },
  ADMIN: {
    label: t('projects.team.admin'),
    description: t('projects.team.adminDescription')
  },
  MEMBER: {
    label: t('projects.team.member'),
    description: t('projects.team.memberDescription')
  },
  VIEWER: {
    label: t('projects.team.viewer'),
    description: t('projects.team.viewerDescription')
  }
});

// 邀请状态
export const INVITATION_STATUS = {
  PENDING: { key: 'pending', color: 'blue' },
  ACCEPTED: { key: 'accepted', color: 'green' },
  REJECTED: { key: 'rejected', color: 'red' },
  EXPIRED: { key: 'expired', color: 'gray' }
};

// 文档格式
export const DOCUMENT_FORMAT = {
  MARKDOWN: { key: 'markdown', icon: 'markdown' },
  RICH_TEXT: { key: 'richText', icon: 'text' },
  PLAIN_TEXT: { key: 'plainText', icon: 'file' }
};

// 文档状态
export const DOCUMENT_STATUS = {
  DRAFT: { key: 'draft', color: 'gray' },
  REVIEW: { key: 'review', color: 'yellow' },
  PUBLISHED: { key: 'published', color: 'green' },
  ARCHIVED: { key: 'archived', color: 'blue' }
};
