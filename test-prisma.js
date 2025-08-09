const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Available models in Prisma client:');
  console.log(Object.keys(prisma));

  // Check if taskHistory exists
  if (prisma.taskHistory) {
    console.log('taskHistory model exists in Prisma client');
  } else {
    console.log('taskHistory model does NOT exist in Prisma client');
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

function a(a, b) {
  return a - b > 0 ? 'a large' : 'b large';
}
console.log(a(2, 1));
