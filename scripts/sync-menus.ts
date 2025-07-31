import { PrismaClient } from '@prisma/client';
import {
  addProjectMenus,
  ensureSystemManagementMenu
} from '../prisma/seed/project-menus';

const prisma = new PrismaClient();

/**
 * 同步菜单到数据库
 */
async function syncMenus() {
  console.log('开始同步菜单数据...');

  try {
    // 查找或创建仪表盘根菜单
    let dashboardMenu = await prisma.menu.findFirst({
      where: { path: '/dashboard' }
    });

    if (!dashboardMenu) {
      dashboardMenu = await prisma.menu.create({
        data: {
          name: '仪表盘',
          path: '/dashboard',
          icon: 'Layout',
          order: 1,
          isVisible: true
        }
      });
      console.log('创建仪表盘根菜单');
    }

    // 添加项目管理菜单
    await addProjectMenus();

    // 确保系统管理菜单存在
    await ensureSystemManagementMenu();

    console.log('菜单同步完成');
  } catch (error) {
    console.error('菜单同步失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行同步
syncMenus();
