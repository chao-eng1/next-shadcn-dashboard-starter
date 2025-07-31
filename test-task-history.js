const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // First create a test user if it doesn't exist
    let testUser = await prisma.user.findFirst();
    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          passwordHash: 'test-hash'
        }
      });
      console.log('Created test user:', testUser);
    }

    // Then create a test project if it doesn't exist
    let testProject = await prisma.project.findFirst();
    if (!testProject) {
      testProject = await prisma.project.create({
        data: {
          name: 'Test Project',
          ownerId: testUser.id
        }
      });
      console.log('Created test project:', testProject);
    }

    // Then create a test task if it doesn't exist
    let testTask = await prisma.task.findFirst();
    if (!testTask) {
      testTask = await prisma.task.create({
        data: {
          title: 'Test Task',
          projectId: testProject.id
        }
      });
      console.log('Created test task:', testTask);
    }

    // Now try to create a TaskHistory record
    const taskHistory = await prisma.taskHistory.create({
      data: {
        taskId: testTask.id,
        performedById: testUser.id,
        fromStatus: 'TODO',
        toStatus: 'IN_PROGRESS',
        changeSummary: JSON.stringify({
          status: { from: 'TODO', to: 'IN_PROGRESS' }
        }),
        comment: 'Test history record'
      }
    });

    console.log('Successfully created TaskHistory record:', taskHistory);
  } catch (error) {
    console.error('Error creating TaskHistory record:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
