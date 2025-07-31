const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testTaskAPI() {
  try {
    const projectId = 'cmdi9bmzd000dqqxs1xrqtb0s'; // 测试的项目
    
    console.log('Testing project:', projectId);
    
    // 直接查询数据库中的任务
    const tasksFromDB = await prisma.task.findMany({
      where: {
        projectId: projectId
      },
      include: {
        assignments: {
          include: {
            member: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            subtasks: true,
            comments: true,
            attachments: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    });
    
    console.log('Tasks from database:', tasksFromDB.length);
    console.log('First task:', tasksFromDB[0] ? {
      id: tasksFromDB[0].id,
      title: tasksFromDB[0].title,
      status: tasksFromDB[0].status,
      projectId: tasksFromDB[0].projectId
    } : 'No tasks found');
    
    // 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        status: true
      }
    });
    
    console.log('Project exists:', project ? project.name : 'Not found');
    
    // 检查用户权限（假设使用admin用户）
    const adminUser = await prisma.user.findFirst({
      where: {
        email: 'admin@example.com'
      }
    });
    
    if (adminUser) {
      console.log('Admin user found:', adminUser.email);
      
      // 检查项目成员关系
      const projectMember = await prisma.projectMember.findFirst({
        where: {
          projectId: projectId,
          userId: adminUser.id
        }
      });
      
      console.log('Project member relationship:', projectMember ? 'Exists' : 'Not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTaskAPI();