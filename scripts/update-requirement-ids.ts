import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateRequirementIds() {
  try {
    console.log('开始更新需求ID...');

    // 获取所有需求
    const requirements = await prisma.requirement.findMany({
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`找到 ${requirements.length} 个需要更新的需求`);

    // 为每个需求生成requirementId
    for (let i = 0; i < requirements.length; i++) {
      const requirement = requirements[i];
      const requirementId = `REQ-${String(i + 1).padStart(4, '0')}`;

      await prisma.requirement.update({
        where: { id: requirement.id },
        data: { requirementId }
      });

      console.log(`更新需求 ${requirement.title} -> ${requirementId}`);
    }

    console.log('需求ID更新完成!');
  } catch (error) {
    console.error('更新需求ID时发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateRequirementIds();
