import { PrismaClient } from '@prisma/client';
import { fixProjectMenuAndPermissions } from './seed/fix-project-menu';

const prisma = new PrismaClient();

/**
 * 修复项目菜单和管理员权限的入口函数
 */
async function main() {
  console.log('开始修复项目菜单和权限...');

  await fixProjectMenuAndPermissions();

  console.log('修复完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
