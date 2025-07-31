const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProjectTasks() {
  try {
    const projectId = 'cmdq080ly0009qqy7swgccib3';
    
    // 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, status: true }
    });
    
    console.log('Project:', project);
    
    if (!project) {
      console.log('Project not found!');
      return;
    }
    
    // 检查该项目的任务
    const tasks = await prisma.task.findMany({
      where: { projectId },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        projectId: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' }
    });
    
    console.log(`\nTasks for project ${projectId}:`);
    console.log('Total tasks:', tasks.length);
    
    tasks.forEach((task, index) => {
      console.log(`Task ${index + 1}:`, {
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        projectId: task.projectId,
        updatedAt: task.updatedAt
      });
    });
    
    // 检查所有任务（不限项目）
    const allTasks = await prisma.task.findMany({
      select: {
        id: true,
        title: true,
        projectId: true,
        project: {
          select: { name: true }
        }
      }
    });
    
    console.log('\nAll tasks in database:');
    allTasks.forEach((task, index) => {
      console.log(`Task ${index + 1}:`, {
        id: task.id,
        title: task.title,
        projectId: task.projectId,
        projectName: task.project.name
      });
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProjectTasks();