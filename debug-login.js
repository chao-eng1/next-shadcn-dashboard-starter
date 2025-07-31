const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function debugLogin() {
  try {
    // 查找admin用户
    const user = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });

    if (!user) {
      console.log('Admin user not found');
      return;
    }

    console.log('Found user:', {
      id: user.id,
      email: user.email,
      name: user.name,
      passwordHash: user.passwordHash.substring(0, 20) + '...'
    });

    // 测试密码验证
    const testPassword = 'admin123';
    const isValid = await bcrypt.compare(testPassword, user.passwordHash);

    console.log('Password verification result:', isValid);

    if (!isValid) {
      console.log('Password hash issue detected. Creating new hash...');
      const newHash = await bcrypt.hash(testPassword, 12);
      console.log('New hash:', newHash.substring(0, 20) + '...');

      // 更新用户密码哈希
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash }
      });

      console.log('Password hash updated for admin user');
    }
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugLogin();
