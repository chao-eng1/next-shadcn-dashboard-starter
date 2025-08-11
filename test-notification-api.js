// 测试全局通知API调用的简单脚本
// 这个脚本可以用来验证markAsRead和markAllAsRead函数的API调用是否正常工作

const testMarkAsRead = async () => {
  try {
    console.log('测试单个通知标记已读...');
    const response = await fetch(
      'http://localhost:3000/api/message-center/mark-read',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messageId: 'test-message-1',
          messageType: 'system'
        })
      }
    );

    const result = await response.json();
    console.log('单个标记已读结果:', result);
    console.log('状态码:', response.status);
  } catch (error) {
    console.error('单个标记已读测试失败:', error);
  }
};

const testMarkAllAsRead = async () => {
  try {
    console.log('测试批量通知标记已读...');
    const response = await fetch(
      'http://localhost:3000/api/message-center/mark-read',
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messageIds: ['test-message-1', 'test-message-2', 'test-message-3'],
          messageType: 'system'
        })
      }
    );

    const result = await response.json();
    console.log('批量标记已读结果:', result);
    console.log('状态码:', response.status);
  } catch (error) {
    console.error('批量标记已读测试失败:', error);
  }
};

// 运行测试
const runTests = async () => {
  console.log('开始测试全局通知API...');
  await testMarkAsRead();
  await new Promise((resolve) => setTimeout(resolve, 1000)); // 等待1秒
  await testMarkAllAsRead();
  console.log('测试完成');
};

// 如果在Node.js环境中运行
if (typeof window === 'undefined') {
  // 需要安装node-fetch: npm install node-fetch
  // const fetch = require('node-fetch');
  console.log(
    '请在浏览器控制台中运行此脚本，或安装node-fetch后在Node.js中运行'
  );
} else {
  // 在浏览器中运行
  runTests();
}

// 导出函数供浏览器控制台使用
if (typeof window !== 'undefined') {
  window.testNotificationAPI = {
    testMarkAsRead,
    testMarkAllAsRead,
    runTests
  };
  console.log('测试函数已添加到 window.testNotificationAPI');
  console.log('可以调用: window.testNotificationAPI.runTests()');
}
