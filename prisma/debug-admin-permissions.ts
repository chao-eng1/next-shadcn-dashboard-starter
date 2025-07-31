import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 调试和修复admin用户的权限
 */
async function main() {
  console.log('开始调试admin用户权限...');

  try {
    // 查找admin用户
    const adminUser = await prisma.user.findFirst({
      where: {
        email: 'admin@example.com'
      },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!adminUser) {
      console.log('未找到admin用户，请确认用户数据已正确初始化');
      return;
    }

    console.log(`找到admin用户: ${adminUser.name} (${adminUser.email})`);

    // 查找admin角色
    const adminRole = await prisma.role.findFirst({
      where: { name: 'admin' },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!adminRole) {
      console.log('未找到admin角色，请确认角色数据已正确初始化');
      return;
    }

    console.log(`找到admin角色: ${adminRole.name}`);
    console.log(`admin角色拥有 ${adminRole.permissions.length} 个权限`);

    // 检查admin是否有project.view权限
    const projectViewPermission = await prisma.permission.findFirst({
      where: { name: 'project.view' }
    });

    if (!projectViewPermission) {
      console.log('未找到project.view权限，将创建此权限');

      // 创建project.view权限
      const newPermission = await prisma.permission.create({
        data: {
          name: 'project.view',
          description: '查看项目列表和项目详情'
        }
      });

      console.log(`创建了新权限: ${newPermission.name}`);

      // 将新权限分配给admin角色
      await prisma.rolePermission.create({
        data: {
          roleId: adminRole.id,
          permissionId: newPermission.id
        }
      });

      console.log(`将权限 ${newPermission.name} 分配给了admin角色`);
    } else {
      console.log(`找到project.view权限: ${projectViewPermission.name}`);

      // 检查admin角色是否已经有这个权限
      const hasPermission = adminRole.permissions.some(
        (p) => p.permission.name === 'project.view'
      );

      if (!hasPermission) {
        // 将权限分配给admin角色
        await prisma.rolePermission.create({
          data: {
            roleId: adminRole.id,
            permissionId: projectViewPermission.id
          }
        });

        console.log(`将权限 ${projectViewPermission.name} 分配给了admin角色`);
      } else {
        console.log(`admin角色已拥有 ${projectViewPermission.name} 权限`);
      }
    }

    // 检查用户是否关联了admin角色
    const userHasAdminRole = adminUser.roles.some(
      (r) => r.role.name === 'admin'
    );

    if (!userHasAdminRole) {
      // 将admin角色分配给用户
      await prisma.userRole.create({
        data: {
          userId: adminUser.id,
          roleId: adminRole.id
        }
      });

      console.log(`将admin角色分配给了用户 ${adminUser.name}`);
    } else {
      console.log(`用户 ${adminUser.name} 已拥有admin角色`);
    }

    // 检查admin是否有project.create权限
    const projectCreatePermission = await prisma.permission.findFirst({
      where: { name: 'project.create' }
    });

    if (!projectCreatePermission) {
      console.log('未找到project.create权限，将创建此权限');

      // 创建project.create权限
      const newPermission = await prisma.permission.create({
        data: {
          name: 'project.create',
          description: '创建新项目'
        }
      });

      console.log(`创建了新权限: ${newPermission.name}`);

      // 将新权限分配给admin角色
      await prisma.rolePermission.create({
        data: {
          roleId: adminRole.id,
          permissionId: newPermission.id
        }
      });

      console.log(`将权限 ${newPermission.name} 分配给了admin角色`);
    } else {
      console.log(`找到project.create权限: ${projectCreatePermission.name}`);

      // 检查admin角色是否已经有这个权限
      const hasPermission = adminRole.permissions.some(
        (p) => p.permission.name === 'project.create'
      );

      if (!hasPermission) {
        // 将权限分配给admin角色
        await prisma.rolePermission.create({
          data: {
            roleId: adminRole.id,
            permissionId: projectCreatePermission.id
          }
        });

        console.log(`将权限 ${projectCreatePermission.name} 分配给了admin角色`);
      } else {
        console.log(`admin角色已拥有 ${projectCreatePermission.name} 权限`);
      }
    }

    // 检查项目菜单关联的权限
    const projectsMenu = await prisma.menu.findFirst({
      where: { path: '/dashboard/projects' },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!projectsMenu) {
      console.log('未找到项目菜单，请确认菜单数据已正确初始化');
    } else {
      console.log(`找到项目菜单: ${projectsMenu.name}`);
      console.log(`菜单路径: ${projectsMenu.path}`);
      console.log(
        `菜单权限: ${projectsMenu.permissions.map((p) => p.permission.name).join(', ') || '无'}`
      );

      // 确保菜单关联了project.view权限
      if (
        projectViewPermission &&
        !projectsMenu.permissions.some(
          (p) => p.permission.name === 'project.view'
        )
      ) {
        await prisma.menuPermission.create({
          data: {
            menuId: projectsMenu.id,
            permissionId: projectViewPermission.id
          }
        });

        console.log(
          `将权限 ${projectViewPermission.name} 关联到了菜单 ${projectsMenu.name}`
        );
      }
    }

    console.log('admin用户权限调试完成');
  } catch (error) {
    console.error('调试admin权限失败:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
