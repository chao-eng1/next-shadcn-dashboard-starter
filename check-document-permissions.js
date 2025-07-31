const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDocumentPermissions() {
  try {
    console.log('🔍 检查admin用户文档权限...');

    // 获取admin用户信息
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

    if (!adminUser) {
      console.log('❌ 未找到admin用户');
      return;
    }

    console.log(`✅ Admin用户: ${adminUser.email} (ID: ${adminUser.id})`);

    // 检查文档相关权限
    const documentPermissions = [];
    adminUser.roles.forEach((userRole) => {
      userRole.role.permissions.forEach((rolePermission) => {
        if (rolePermission.permission.name.includes('document')) {
          documentPermissions.push(rolePermission.permission.name);
        }
      });
    });

    console.log('\n📋 文档相关权限:');
    if (documentPermissions.length === 0) {
      console.log('❌ 没有任何文档权限！');
    } else {
      documentPermissions.forEach((perm) => {
        console.log(`✅ ${perm}`);
      });
    }

    // 检查具体权限
    const requiredPermissions = [
      'document.create',
      'document:create',
      'document.view',
      'document:view',
      'document.update',
      'document:update',
      'document.delete',
      'document:delete'
    ];

    console.log('\n🔑 必需权限检查:');
    requiredPermissions.forEach((perm) => {
      const hasPermission = documentPermissions.includes(perm);
      console.log(`${hasPermission ? '✅' : '❌'} ${perm}`);
    });

    // 检查现有文档
    console.log('\n📄 现有文档:');
    const documents = await prisma.document.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        projectId: true,
        project: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (documents.length === 0) {
      console.log('📝 数据库中暂无文档');
    } else {
      documents.forEach((doc) => {
        console.log(
          `📄 ${doc.title} (状态: ${doc.status}, 项目: ${doc.project?.name || '独立文档'})`
        );
      });
    }

    // 测试文档创建权限
    console.log('\n🧪 测试文档创建权限...');
    try {
      const testDoc = await prisma.document.create({
        data: {
          title: '权限测试文档',
          content: '这是一个用于测试权限的文档',
          status: 'DRAFT'
        }
      });

      console.log(`✅ 文档创建成功: ${testDoc.title} (ID: ${testDoc.id})`);

      // 删除测试文档
      await prisma.document.delete({
        where: { id: testDoc.id }
      });

      console.log('🗑️ 测试文档已删除');
    } catch (error) {
      console.log('❌ 文档创建失败:', error.message);
    }
  } catch (error) {
    console.error('❌ 检查过程出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDocumentPermissions();
