const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugMessageSystem() {
  try {// 1. 检查用户数据const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true
      }
    });users.forEach((user) => {- ID: ${user.id}`);
    });

    // 2. 检查角色数据const roles = await prisma.role.findMany({
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });roles.forEach((role) => {role.users.forEach((userRole) => {`);
      });
    });

    // 3. 检查现有消息const messages = await prisma.message.findMany({
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        recipients: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });messages.forEach((message) => {`
      );`
      );// 显示接收者详情
      if (message.recipients.length > 0) {message.recipients.forEach((recipient) => {- 已读: ${recipient.isRead}`
          );
        });
      }});

    // 4. 检查用户消息关联const userMessages = await prisma.userMessage.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        message: {
          select: {
            id: true,
            title: true,
            isGlobal: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });userMessages.forEach((userMessage) => {`
      );`
      );});

    // 5. 模拟发送一条测试消息// 找到admin用户
    const adminUser = await prisma.user.findFirst({
      where: {
        email: 'admin@example.com'
      }
    });

    if (!adminUser) {return;
    }`
    );

    // 创建测试消息
    const testMessage = await prisma.message.create({
      data: {
        title: '调试测试消息',
        content:
          '这是一条用于调试的测试消息，发送时间: ' +
          new Date().toLocaleString('zh-CN'),
        isGlobal: true,
        senderId: adminUser.id
      }
    });// 获取所有用户（除了发送者）
    const allUsers = await prisma.user.findMany({
      where: {
        id: {
          not: adminUser.id
        }
      },
      select: { id: true, name: true, email: true }
    });allUsers.forEach((user) => {`);
    });

    // 创建用户消息关联
    if (allUsers.length > 0) {
      const userMessageData = allUsers.map((user) => ({
        userId: user.id,
        messageId: testMessage.id,
        isRead: false
      }));

      const result = await prisma.userMessage.createMany({
        data: userMessageData
      });} else {}

    // 6. 验证消息发送结果const sentMessage = await prisma.message.findUnique({
      where: { id: testMessage.id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        recipients: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (sentMessage) {sentMessage.recipients.forEach((recipient) => {`);
      });
    }

    // 7. 检查特定用户的未读消息数量for (const user of users) {
      const unreadCount = await prisma.userMessage.count({
        where: {
          userId: user.id,
          isRead: false
        }
      });}
  } catch (error) {} finally {
    await prisma.$disconnect();
  }
}

debugMessageSystem();
