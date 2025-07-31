const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTasks() {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        projectId: 'cmdq080ly0009qqy7swgccib3'
      },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    console.log('Tasks found:', tasks.length);
    console.log(JSON.stringify(tasks, null, 2));

    // 检查任务状态是否有null值
    const tasksWithoutStatusFilter = await prisma.task.findMany({
      where: {
        projectId: 'cmdq080ly0009qqy7swgccib3'
      },
      select: {
        id: true,
        title: true,
        status: true
      }
    });

    console.log(
      '\nAll tasks (including null status):',
      tasksWithoutStatusFilter.length
    );
    const nullStatusTasks = tasksWithoutStatusFilter.filter(
      (t) => t.status === null
    );
    console.log('Tasks with null status:', nullStatusTasks.length);
    if (nullStatusTasks.length > 0) {
      console.log(JSON.stringify(nullStatusTasks, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTasks();
