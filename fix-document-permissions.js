const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDocumentPermissions() {
  try {
    console.log('🔧 修复admin用户文档权限...');

    // 获取admin角色
    const adminRole = await prisma.role.findUnique({
      where: { name: 'admin' }
    });

    if (!adminRole) {
      console.log('❌ 未找到admin角色');
      return;
    }

    // 需要添加的文档权限
    const documentPermissions = [
      {
        name: 'document.create',
        description: 'Permission to create documents (dot format)'
      },
      {
        name: 'document:create',
        description: 'Permission to create documents'
      },
      {
        name: 'document.update',
        description: 'Permission to update documents (dot format)'
      },
      {
        name: 'document:update',
        description: 'Permission to update documents'
      },
      {
        name: 'document.delete',
        description: 'Permission to delete documents (dot format)'
      },
      {
        name: 'document:delete',
        description: 'Permission to delete documents'
      },
      {
        name: 'document.template.use',
        description: 'Permission to use document templates (dot format)'
      },
      {
        name: 'document:template:use',
        description: 'Permission to use document templates'
      }
    ];

    let addedCount = 0;
    let assignedCount = 0;

    // 添加权限并分配给admin角色
    for (const permissionData of documentPermissions) {
      // 检查权限是否存在
      let permission = await prisma.permission.findUnique({
        where: { name: permissionData.name }
      });

      // 如果权限不存在，创建它
      if (!permission) {
        permission = await prisma.permission.create({
          data: permissionData
        });
        console.log(`✅ 添加权限: ${permission.name}`);
        addedCount++;
      }

      // 检查是否已分配给admin角色
      const existingRolePermission = await prisma.rolePermission.findUnique({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: permission.id
          }
        }
      });

      // 如果未分配，则分配给admin角色
      if (!existingRolePermission) {
        await prisma.rolePermission.create({
          data: {
            roleId: adminRole.id,
            permissionId: permission.id
          }
        });
        console.log(`✅ 为admin角色分配权限: ${permission.name}`);
        assignedCount++;
      }
    }

    console.log(`\n📊 权限修复统计:`);
    console.log(`   新增权限: ${addedCount} 个`);
    console.log(`   新分配权限: ${assignedCount} 个`);

    // 测试文档创建（修复tags字段问题）
    console.log('\n🧪 测试文档创建功能...');
    try {
      const testDoc = await prisma.document.create({
        data: {
          title: '权限测试文档',
          content: '这是一个用于测试权限的文档',
          status: 'DRAFT',
          tags: '测试,权限' // 添加必需的tags字段
        }
      });

      console.log(`✅ 文档创建成功: ${testDoc.title} (ID: ${testDoc.id})`);

      // 删除测试文档
      await prisma.document.delete({
        where: { id: testDoc.id }
      });

      console.log('🗑️ 测试文档已删除');
    } catch (error) {
      console.log('❌ 文档创建仍然失败:', error.message);
    }

    // 验证admin用户现在的文档权限
    console.log('\n🔍 验证修复后的权限...');
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const allPermissions = [];
    adminUser.roles.forEach((userRole) => {
      userRole.role.permissions.forEach((rolePermission) => {
        allPermissions.push(rolePermission.permission.name);
      });
    });

    const documentPerms = allPermissions.filter((p) => p.includes('document'));
    console.log(`📋 当前文档权限 (${documentPerms.length} 个):`);
    documentPerms.forEach((perm) => {
      console.log(`   ✅ ${perm}`);
    });

    console.log('\n🎉 文档权限修复完成！');
  } catch (error) {
    console.error('❌ 修复权限时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDocumentPermissions();
