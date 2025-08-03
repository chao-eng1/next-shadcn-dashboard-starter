import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 初始化需求管理权限
 */
export async function seedRequirementPermissions() {
  console.log('正在初始化需求管理权限...');

  const permissions = [
    // 需求权限
    { name: 'requirement.view', description: '查看需求列表和需求详情' },
    { name: 'requirement.create', description: '创建新需求' },
    { name: 'requirement.update', description: '编辑需求信息' },
    { name: 'requirement.delete', description: '删除需求' },
    { name: 'requirement.assign', description: '分配需求给成员' },
    { name: 'requirement.status.update', description: '更新需求状态' },
    { name: 'requirement.comment', description: '添加需求评论' },
    { name: 'requirement.attachment', description: '管理需求附件' },
    { name: 'requirement.version', description: '管理需求版本' }
  ];

  // 创建权限
  for (const permissionData of permissions) {
    await prisma.permission.upsert({
      where: { name: permissionData.name },
      update: { description: permissionData.description },
      create: permissionData
    });
    console.log(`权限已创建/更新: ${permissionData.name}`);
  }

  // 为管理员角色分配需求管理权限
  const adminRole = await prisma.role.findFirst({
    where: { name: 'admin' }
  });

  if (adminRole) {
    for (const permissionData of permissions) {
      const permission = await prisma.permission.findFirst({
        where: { name: permissionData.name }
      });

      if (permission) {
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
        console.log(`管理员权限已分配: ${permission.name}`);
      }
    }
  } else {
    console.log('未找到管理员角色，跳过权限分配');
  }

  console.log('需求管理权限初始化完成');
}

/**
 * 清理需求管理权限
 */
export async function cleanRequirementPermissions() {
  console.log('正在清理需求管理权限...');

  const permissionNames = [
    'requirement.view',
    'requirement.create',
    'requirement.update',
    'requirement.delete',
    'requirement.assign',
    'requirement.status.update',
    'requirement.comment',
    'requirement.attachment',
    'requirement.version'
  ];

  // 删除角色权限关联
  await prisma.rolePermission.deleteMany({
    where: {
      permission: {
        name: {
          in: permissionNames
        }
      }
    }
  });

  // 删除权限
  await prisma.permission.deleteMany({
    where: {
      name: {
        in: permissionNames
      }
    }
  });

  console.log('需求管理权限清理完成');
}

// 如果直接运行此文件
if (require.main === module) {
  seedRequirementPermissions()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
