const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCurrentUser() {
  try {
    console.log('=== 检查当前用户状态 ===\n');
    
    // 1. 检查所有用户的未读消息详情
    console.log('1. 检查所有用户的未读消息详情:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true
      }
    });
    
    for (const user of users) {
      console.log(`\n用户: ${user.name} (${user.email}) - ID: ${user.id}`);
      
      // 获取该用户的未读消息
      const unreadMessages = await prisma.userMessage.findMany({
        where: {
          userId: user.id,
          isRead: false
        },
        include: {
          message: {
            include: {
              sender: {
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
      
      console.log(`  未读消息数量: ${unreadMessages.length}`);
      
      if (unreadMessages.length > 0) {
        console.log('  最新的未读消息:');
        unreadMessages.forEach((userMsg, index) => {
          console.log(`    ${index + 1}. "${userMsg.message.title}"`);
          console.log(`       发送者: ${userMsg.message.sender.name}`);
          console.log(`       发送时间: ${userMsg.message.createdAt}`);
          console.log(`       消息类型: ${userMsg.message.isGlobal ? '全局消息' : '定向消息'}`);
        });
      }
    }
    
    // 2. 检查最近的消息发送记录
    console.log('\n\n2. 检查最近的消息发送记录:');
    const recentMessages = await prisma.message.findMany({
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
      take: 3
    });
    
    recentMessages.forEach((message, index) => {
      console.log(`\n消息 ${index + 1}: "${message.title}"`);
      console.log(`  发送者: ${message.sender.name} (${message.sender.email})`);
      console.log(`  发送时间: ${message.createdAt}`);
      console.log(`  消息类型: ${message.isGlobal ? '全局消息' : '定向消息'}`);
      console.log(`  接收者数量: ${message.recipients.length}`);
      
      if (message.recipients.length > 0) {
        console.log('  接收者详情:');
        message.recipients.forEach(recipient => {
          console.log(`    - ${recipient.user.name} (${recipient.user.email}) - 已读: ${recipient.isRead}`);
        });
      }
    });
    
    // 3. 检查用户角色分配
    console.log('\n\n3. 检查用户角色分配:');
    const userRoles = await prisma.userRole.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });
    
    console.log(`找到 ${userRoles.length} 个用户角色分配:`);
    userRoles.forEach(userRole => {
      console.log(`  - ${userRole.user.name} (${userRole.user.email}) -> ${userRole.role.name}`);
    });
    
    // 4. 模拟API调用检查
    console.log('\n\n4. 模拟API响应检查:');
    
    // 模拟 /api/user-messages/unread-count 的响应
    for (const user of users) {
      const unreadCount = await prisma.userMessage.count({
        where: {
          userId: user.id,
          isRead: false
        }
      });
      
      console.log(`  用户 ${user.name} 的未读消息API响应: { "unreadCount": ${unreadCount} }`);
    }
    
    // 5. 检查最新的用户消息API响应
    console.log('\n\n5. 检查用户消息API响应格式:');
    
    for (const user of users) {
      const userMessages = await prisma.userMessage.findMany({
        where: {
          userId: user.id
        },
        include: {
          message: {
            include: {
              sender: {
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
          message: {
            createdAt: 'desc'
          }
        },
        take: 2
      });
      
      console.log(`\n  用户 ${user.name} 的消息API响应:`);
      console.log('  {');
      console.log('    "messages": [');
      
      userMessages.forEach((userMsg, index) => {
        console.log('      {');
        console.log(`        "id": "${userMsg.id}",`);
        console.log(`        "isRead": ${userMsg.isRead},`);
        console.log(`        "readAt": ${userMsg.readAt ? `"${userMsg.readAt}"` : 'null'},`);
        console.log('        "message": {');
        console.log(`          "id": "${userMsg.message.id}",`);
        console.log(`          "title": "${userMsg.message.title}",`);
        console.log(`          "content": "${userMsg.message.content.substring(0, 50)}...",`);
        console.log(`          "isGlobal": ${userMsg.message.isGlobal},`);
        console.log(`          "createdAt": "${userMsg.message.createdAt}",`);
        console.log('          "sender": {');
        console.log(`            "id": "${userMsg.message.sender.id}",`);
        console.log(`            "name": "${userMsg.message.sender.name}",`);
        console.log(`            "email": "${userMsg.message.sender.email}"`);
        console.log('          }');
        console.log('        }');
        console.log(`      }${index < userMessages.length - 1 ? ',' : ''}`);
      });
      
      console.log('    ]');
      console.log('  }');
    }
    
  } catch (error) {
    console.error('检查过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentUser();