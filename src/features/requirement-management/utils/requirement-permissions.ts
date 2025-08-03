import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { hasProjectPermission } from '@/lib/permissions';

// 需求管理权限常量
export const REQUIREMENT_PERMISSIONS = {
  VIEW: 'requirement.view',
  CREATE: 'requirement.create',
  UPDATE: 'requirement.update',
  DELETE: 'requirement.delete',
  ASSIGN: 'requirement.assign',
  STATUS_UPDATE: 'requirement.status.update',
  COMMENT: 'requirement.comment',
  ATTACHMENT: 'requirement.attachment',
  VERSION: 'requirement.version'
} as const;

export type RequirementPermission =
  (typeof REQUIREMENT_PERMISSIONS)[keyof typeof REQUIREMENT_PERMISSIONS];

/**
 * 检查用户是否有需求管理权限
 * @param projectId 项目ID
 * @param permission 权限名称
 * @param userId 用户ID（可选）
 * @returns 是否有权限
 */
export async function hasRequirementPermission(
  projectId: string,
  permission: RequirementPermission,
  userId?: string
): Promise<boolean> {
  if (!userId) {
    const user = await getCurrentUser();
    if (!user) return false;
    userId = user.id;
  }

  // 检查基础项目权限
  const hasProjectAccess = await hasProjectPermission(
    projectId,
    'project.view',
    userId
  );

  if (!hasProjectAccess) {
    return false;
  }

  // 获取项目信息
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true }
  });

  if (!project) {
    return false;
  }

  // 项目所有者拥有所有权限
  if (project.ownerId === userId) {
    return true;
  }

  // 获取用户在项目中的角色
  const projectMember = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId
      }
    }
  });

  if (!projectMember) {
    return false;
  }

  // 基于项目角色的权限映射
  const rolePermissions = {
    ADMIN: [
      REQUIREMENT_PERMISSIONS.VIEW,
      REQUIREMENT_PERMISSIONS.CREATE,
      REQUIREMENT_PERMISSIONS.UPDATE,
      REQUIREMENT_PERMISSIONS.DELETE,
      REQUIREMENT_PERMISSIONS.ASSIGN,
      REQUIREMENT_PERMISSIONS.STATUS_UPDATE,
      REQUIREMENT_PERMISSIONS.COMMENT,
      REQUIREMENT_PERMISSIONS.ATTACHMENT,
      REQUIREMENT_PERMISSIONS.VERSION
    ],
    MEMBER: [
      REQUIREMENT_PERMISSIONS.VIEW,
      REQUIREMENT_PERMISSIONS.CREATE,
      REQUIREMENT_PERMISSIONS.UPDATE,
      REQUIREMENT_PERMISSIONS.ASSIGN,
      REQUIREMENT_PERMISSIONS.STATUS_UPDATE,
      REQUIREMENT_PERMISSIONS.COMMENT,
      REQUIREMENT_PERMISSIONS.ATTACHMENT,
      REQUIREMENT_PERMISSIONS.VERSION
    ],
    VIEWER: [REQUIREMENT_PERMISSIONS.VIEW, REQUIREMENT_PERMISSIONS.COMMENT]
  };

  const userPermissions =
    rolePermissions[projectMember.role as keyof typeof rolePermissions] || [];
  return userPermissions.includes(permission);
}

/**
 * 检查用户是否可以编辑特定需求
 * @param requirementId 需求ID
 * @param userId 用户ID（可选）
 * @returns 是否可以编辑
 */
export async function canEditRequirement(
  requirementId: string,
  userId?: string
): Promise<boolean> {
  if (!userId) {
    const user = await getCurrentUser();
    if (!user) return false;
    userId = user.id;
  }

  const requirement = await prisma.requirement.findUnique({
    where: { id: requirementId },
    select: {
      projectId: true,
      createdById: true,
      assignedToId: true
    }
  });

  if (!requirement) {
    return false;
  }

  // 检查基础更新权限
  const hasUpdatePermission = await hasRequirementPermission(
    requirement.projectId,
    REQUIREMENT_PERMISSIONS.UPDATE,
    userId
  );

  if (!hasUpdatePermission) {
    return false;
  }

  // 需求创建者和分配人可以编辑
  return (
    requirement.createdById === userId || requirement.assignedToId === userId
  );
}

/**
 * 检查用户是否可以删除特定需求
 * @param requirementId 需求ID
 * @param userId 用户ID（可选）
 * @returns 是否可以删除
 */
export async function canDeleteRequirement(
  requirementId: string,
  userId?: string
): Promise<boolean> {
  if (!userId) {
    const user = await getCurrentUser();
    if (!user) return false;
    userId = user.id;
  }

  const requirement = await prisma.requirement.findUnique({
    where: { id: requirementId },
    select: {
      projectId: true,
      createdById: true,
      _count: {
        select: {
          children: true,
          tasks: true
        }
      }
    }
  });

  if (!requirement) {
    return false;
  }

  // 有子需求或关联任务的需求不能删除
  if (requirement._count.children > 0 || requirement._count.tasks > 0) {
    return false;
  }

  // 检查基础删除权限
  const hasDeletePermission = await hasRequirementPermission(
    requirement.projectId,
    REQUIREMENT_PERMISSIONS.DELETE,
    userId
  );

  if (!hasDeletePermission) {
    return false;
  }

  // 只有需求创建者可以删除
  return requirement.createdById === userId;
}

/**
 * 批量获取需求权限
 * @param projectId 项目ID
 * @param userId 用户ID（可选）
 * @returns 权限映射
 */
export async function getRequirementPermissions(
  projectId: string,
  userId?: string
): Promise<Record<RequirementPermission, boolean>> {
  if (!userId) {
    const user = await getCurrentUser();
    if (!user) {
      return Object.values(REQUIREMENT_PERMISSIONS).reduce(
        (acc, permission) => {
          acc[permission] = false;
          return acc;
        },
        {} as Record<RequirementPermission, boolean>
      );
    }
    userId = user.id;
  }

  const permissions: Record<RequirementPermission, boolean> = {} as any;

  for (const permission of Object.values(REQUIREMENT_PERMISSIONS)) {
    permissions[permission] = await hasRequirementPermission(
      projectId,
      permission,
      userId
    );
  }

  return permissions;
}

/**
 * 检查用户是否可以查看需求
 * @param projectId 项目ID
 * @param userId 用户ID（可选）
 * @returns 是否可以查看
 */
export async function canViewRequirements(
  projectId: string,
  userId?: string
): Promise<boolean> {
  return hasRequirementPermission(
    projectId,
    REQUIREMENT_PERMISSIONS.VIEW,
    userId
  );
}

/**
 * 检查用户是否可以创建需求
 * @param projectId 项目ID
 * @param userId 用户ID（可选）
 * @returns 是否可以创建
 */
export async function canCreateRequirement(
  projectId: string,
  userId?: string
): Promise<boolean> {
  return hasRequirementPermission(
    projectId,
    REQUIREMENT_PERMISSIONS.CREATE,
    userId
  );
}
