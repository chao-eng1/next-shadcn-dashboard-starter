const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // 检查项目成员
    const members = await prisma.projectMember.findMany({
      where: {
        projectId: 'cmdq080ly0009qqy7swgccib3'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    console.log('Project members:');
    members.forEach((member, index) => {
      console.log(
        `${index + 1}. User: ${member.user.email} (${member.user.name}), Role: ${member.role}`
      );
    });

    if (members.length === 0) {
      console.log('No members found for this project');
    }

    // 检查项目信息
    const project = await prisma.project.findUnique({
      where: {
        id: 'cmdq080ly0009qqy7swgccib3'
      },
      select: {
        id: true,
        name: true,
        ownerId: true
      }
    });

    console.log('\nProject info:', project);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
