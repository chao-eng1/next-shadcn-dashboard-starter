import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting message system tests...');
    const adminUserId = await getAdminUserId();

    // 1. Test global message (to all users)
    await testGlobalMessage(adminUserId);

    // 2. Test role-based message
    await testRoleBasedMessage(adminUserId);

    // 3. Test user-specific message
    await testUserSpecificMessage(adminUserId);

    console.log('\nMessage system tests completed successfully!');
  } catch (error) {
    console.error('Error running tests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function getAdminUserId() {
  // Get the first admin user
  const adminUser = await prisma.user.findFirst({
    where: {
      roles: {
        some: {
          role: {
            permissions: {
              some: {
                permission: {
                  name: 'message.manage'
                }
              }
            }
          }
        }
      }
    }
  });

  if (!adminUser) {
    throw new Error('No admin user found with message.manage permission');
  }

  return adminUser.id;
}

async function testGlobalMessage(senderId: string) {
  console.log('\nTest 1: Creating a global message');

  // Create global message
  const message = await prisma.message.create({
    data: {
      title: '测试全局消息',
      content: '这是一条发送给所有用户的测试消息。',
      isGlobal: true as boolean,
      senderId: senderId
    }
  });
  console.log(`Global message created with ID: ${message.id}`);

  // Send to all users
  const allUsers = await prisma.user.findMany({
    select: { id: true }
  });

  await prisma.userMessage.createMany({
    data: allUsers.map((user) => ({
      userId: user.id,
      messageId: message.id,
      isRead: false as boolean
    })),
    skipDuplicates: true as boolean
  });
  console.log(`Message sent to ${allUsers.length} users`);

  // Verify
  const userMessageCount = await prisma.userMessage.count({
    where: { messageId: message.id }
  });
  console.log(`Verification: ${userMessageCount} user message records created`);
}

async function testRoleBasedMessage(senderId: string) {
  console.log('\nTest 2: Creating a role-based message');

  // Get a role for testing
  const testRole = await prisma.role.findFirst();
  if (!testRole) {
    throw new Error('No roles found in the database');
  }

  // Create role-based message
  const message = await prisma.message.create({
    data: {
      title: '测试角色消息',
      content: `这是一条发送给特定角色(${testRole.name})用户的测试消息。`,
      isGlobal: false as boolean,
      senderId: senderId
    }
  });
  console.log(`Role-based message created with ID: ${message.id}`);

  // Find users with the role
  const usersInRole = await prisma.userRole.findMany({
    where: { roleId: testRole.id },
    select: { userId: true }
  });

  // Send message to users with the role
  await prisma.userMessage.createMany({
    data: usersInRole.map((ur) => ({
      userId: ur.userId,
      messageId: message.id,
      isRead: false as boolean
    })),
    skipDuplicates: true as boolean
  });
  console.log(
    `Message sent to ${usersInRole.length} users with role: ${testRole.name}`
  );

  // Verify
  const userMessageCount = await prisma.userMessage.count({
    where: { messageId: message.id }
  });
  console.log(`Verification: ${userMessageCount} user message records created`);
}

async function testUserSpecificMessage(senderId: string) {
  console.log('\nTest 3: Creating a user-specific message');

  // Get a few test users (excluding the sender)
  const testUsers = await prisma.user.findMany({
    where: { id: { not: senderId } },
    take: 2
  });

  if (testUsers.length === 0) {
    throw new Error('No users found in the database');
  }

  // Create user-specific message
  const message = await prisma.message.create({
    data: {
      title: '测试指定用户消息',
      content: '这是一条发送给指定用户的测试消息。',
      isGlobal: false as boolean,
      senderId: senderId
    }
  });
  console.log(`User-specific message created with ID: ${message.id}`);

  // Send message to specific users
  await prisma.userMessage.createMany({
    data: testUsers.map((user) => ({
      userId: user.id,
      messageId: message.id,
      isRead: false as boolean
    })),
    skipDuplicates: true as boolean
  });

  const recipientNames = testUsers.map((u) => u.name || u.email).join(', ');
  console.log(
    `Message sent to ${testUsers.length} specific users: ${recipientNames}`
  );

  // Verify
  const userMessageCount = await prisma.userMessage.count({
    where: { messageId: message.id }
  });
  console.log(`Verification: ${userMessageCount} user message records created`);
}

main();
