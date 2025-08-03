const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProjects() {
  try {
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        status: true
      },
      take: 5
    });

    console.log('Projects found:', projects.length);
    console.log(JSON.stringify(projects, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProjects();
