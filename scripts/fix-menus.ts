import { PrismaClient } from '@prisma/client';
import {
  addProjectMenus,
  ensureSystemManagementMenu
} from '../prisma/seed/project-menus';
import { assignAdminProjectPermissions } from '../src/lib/permissions-utils';

const prisma = new PrismaClient();

/**
 * 修复菜单和权限
 */
async function fixMenusAndPermissions() {
  console.log('开始修复菜单和权限...');

  try {
    // 1. 修复管理员项目权限
    console.log('Step 1: 修复管理员项目权限');
    const permissionsResult = await assignAdminProjectPermissions();
    console.log(permissionsResult.message);

    // 2. 添加项目管理菜单
    console.log('Step 2: 添加项目管理菜单');
    await addProjectMenus();

    // 3. 确保系统管理菜单存在
    console.log('Step 3: 确保系统管理菜单存在');
    await ensureSystemManagementMenu();

    console.log('菜单和权限修复完成');
  } catch (error) {
    console.error('菜单和权限修复失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行修复
fixMenusAndPermissions();
