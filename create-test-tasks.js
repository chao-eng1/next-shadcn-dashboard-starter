const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestTasks() {
  try {
    // 确保项目存在
    const project = await prisma.project.findUnique({
      where: { id: 'cmdq080ly0009qqy7swgccib3' }
    });

    if (!project) {
      console.log('项目不存在');
      return;
    }

    console.log('找到项目:', project.name);

    // 创建测试任务
    const tasks = [
      {
        title: '设计用户界面原型',
        description: '为新功能设计用户界面原型，包括移动端和桌面端',
        status: 'TODO',
        priority: 'HIGH',
        projectId: 'cmdq080ly0009qqy7swgccib3'
      },
      {
        title: '实现用户注册功能',
        description: '开发用户注册页面和后端API',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        projectId: 'cmdq080ly0009qqy7swgccib3'
      },
      {
        title: '编写单元测试',
        description: '为核心功能编写单元测试',
        status: 'REVIEW',
        priority: 'MEDIUM',
        projectId: 'cmdq080ly0009qqy7swgccib3'
      },
      {
        title: '修复登录页面BUG',
        description: '修复登录页面在移动设备上的显示问题',
        status: 'DONE',
        priority: 'URGENT',
        projectId: 'cmdq080ly0009qqy7swgccib3'
      },
      {
        title: '等待第三方API接口',
        description: '支付功能依赖第三方API，目前接口尚未提供',
        status: 'BLOCKED',
        priority: 'LOW',
        projectId: 'cmdq080ly0009qqy7swgccib3'
      }
    ];

    // 批量创建任务
    const result = await prisma.task.createMany({
      data: tasks
    });

    console.log(`成功创建 ${result.count} 个任务`);

    // 查询创建的任务
    const createdTasks = await prisma.task.findMany({
      where: { projectId: 'cmdq080ly0009qqy7swgccib3' },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true
      }
    });

    console.log('创建的任务:');
    console.log(JSON.stringify(createdTasks, null, 2));
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestTasks();
