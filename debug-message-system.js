const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugMessageSystem() {
  try {
    console.log('=== 调试消息系统 ===\n');
    
    // 1. 检查用户数据
    console.log('1. 检查用户数据:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true
      }
    });
    console.log(`找到 ${users.length} 个用户:`);
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ID: ${user.id}`);
    });
    
    // 2. 检查角色数据
    console.log('\n2. 检查角色数据:');
    const roles = await prisma.role.findMany({
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
    });
    console.log(`找到 ${roles.length} 个角色:`);
    roles.forEach(role => {
      console.log(`  - ${role.name}: ${role.users.length} 个用户`);
      role.users.forEach(userRole => {
        console.log(`    * ${userRole.user.name} (${userRole.user.email})`);
      });
    });
    
    // 3. 检查现有消息
    console.log('\n3. 检查现有消息:');
    const messages = await prisma.message.findMany({
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
    });
    
    console.log(`找到 ${messages.length} 条最新消息:`);
    messages.forEach(message => {
      console.log(`  - "${message.title}" (${message.isGlobal ? '全局' : '定向'})`);
      console.log(`    发送者: ${message.sender.name} (${message.sender.email})`);
      console.log(`    接收者数量: ${message.recipients.length}`);
      console.log(`    创建时间: ${message.createdAt}`);
      
      // 显示接收者详情
      if (message.recipients.length > 0) {
        console.log('    接收者列表:');
        message.recipients.forEach(recipient => {
          console.log(`      * ${recipient.user.name} (${recipient.user.email}) - 已读: ${recipient.isRead}`);
        });
      }
      console.log('');
    });
    
    // 4. 检查用户消息关联
    console.log('4. 检查用户消息关联:');
    const userMessages = await prisma.userMessage.findMany({
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
    });
    
    console.log(`找到 ${userMessages.length} 条用户消息关联:`);
    userMessages.forEach(userMessage => {
      console.log(`  - 用户: ${userMessage.user.name} (${userMessage.user.email})`);
      console.log(`    消息: "${userMessage.message.title}" (${userMessage.message.isGlobal ? '全局' : '定向'})`);
      console.log(`    已读: ${userMessage.isRead}`);
      console.log(`    创建时间: ${userMessage.createdAt}`);
      console.log('');
    });
    
    // 5. 模拟发送一条测试消息
    console.log('5. 发送测试消息:');
    
    // 找到admin用户
    const adminUser = await prisma.user.findFirst({
      where: {
        email: 'admin@example.com'
      }
    });
    
    if (!adminUser) {
      console.log('未找到admin用户，无法发送测试消息');
      return;
    }
    
    console.log(`使用admin用户发送测试消息: ${adminUser.name} (${adminUser.email})`);
    
    // 创建测试消息
    const testMessage = await prisma.message.create({
      data: {
        title: '调试测试消息',
        content: '这是一条用于调试的测试消息，发送时间: ' + new Date().toLocaleString('zh-CN'),
        isGlobal: true,
        senderId: adminUser.id
      }
    });
    
    console.log(`创建了测试消息: ${testMessage.id}`);
    
    // 获取所有用户（除了发送者）
    const allUsers = await prisma.user.findMany({
      where: {
        id: {
          not: adminUser.id
        }
      },
      select: { id: true, name: true, email: true }
    });
    
    console.log(`准备发送给 ${allUsers.length} 个用户:`);
    allUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email})`);
    });
    
    // 创建用户消息关联
    if (allUsers.length > 0) {
      const userMessageData = allUsers.map(user => ({
        userId: user.id,
        messageId: testMessage.id,
        isRead: false
      }));
      
      const result = await prisma.userMessage.createMany({
        data: userMessageData
      });
      
      console.log(`成功创建了 ${result.count} 条用户消息关联`);
    } else {
      console.log('没有其他用户可以接收消息');
    }
    
    // 6. 验证消息发送结果
    console.log('\n6. 验证消息发送结果:');
    const sentMessage = await prisma.message.findUnique({
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
    
    if (sentMessage) {
      console.log(`消息 "${sentMessage.title}" 发送成功:`);
      console.log(`  发送者: ${sentMessage.sender.name}`);
      console.log(`  接收者数量: ${sentMessage.recipients.length}`);
      console.log('  接收者列表:');
      sentMessage.recipients.forEach(recipient => {
        console.log(`    - ${recipient.user.name} (${recipient.user.email})`);
      });
    }
    
    // 7. 检查特定用户的未读消息数量
    console.log('\n7. 检查各用户的未读消息数量:');
    for (const user of users) {
      const unreadCount = await prisma.userMessage.count({
        where: {
          userId: user.id,
          isRead: false
        }
      });
      console.log(`  - ${user.name}: ${unreadCount} 条未读消息`);
    }
    
  } catch (error) {
    console.error('调试过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugMessageSystem();