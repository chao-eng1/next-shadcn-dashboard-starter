import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 为管理员角色分配项目管理权限
 */
export async function assignAdminProjectPermissions() {
  console.log('开始为管理员分配项目管理权限...');

  // 查找管理员角色
  const adminRole = await prisma.role.findUnique({
    where: { name: 'admin' }
  });

  if (!adminRole) {
    console.log('未找到管理员角色');
    return;
  }

  // 获取所有项目管理权限
  const projectPermissions = await prisma.permission.findMany({
    where: {
      OR: [
        { name: { startsWith: 'project.' } },
        { name: { startsWith: 'task.' } },
        { name: { startsWith: 'sprint.' } },
        { name: { startsWith: 'comment.' } },
        { name: { startsWith: 'attachment.' } },
        { name: { startsWith: 'document.' } }
      ]
    }
  });

  console.log(`找到 ${projectPermissions.length} 个项目管理权限`);

  // 为管理员角色分配所有项目管理权限
  for (const permission of projectPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id
        }
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id
      }
    });

    console.log(`为管理员分配权限: ${permission.name}`);
  }

  console.log('管理员权限分配完成');
}
