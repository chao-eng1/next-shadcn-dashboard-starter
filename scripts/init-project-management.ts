import { PrismaClient } from '@prisma/client';
import { seedProjectManagement } from '../prisma/seed/project-management';
import { assignAdminProjectPermissions } from '../prisma/seed/admin-permissions';

const prisma = new PrismaClient();

/**
 * 项目管理模块初始化脚本
 */
async function initProjectManagement() {
  console.log('=== 项目管理模块初始化 ===');

  try {
    // 1. 初始化项目管理模块数据
    await seedProjectManagement();

    // 2. 为管理员分配项目管理权限
    await assignAdminProjectPermissions();

    // 3. 创建演示数据（可选）
    if (process.env.SEED_DEMO_DATA === 'true') {
      console.log('创建演示数据已启用');
    }

    console.log('=== 项目管理模块初始化完成 ===');
  } catch (error) {
    console.error('初始化失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行初始化
initProjectManagement();
