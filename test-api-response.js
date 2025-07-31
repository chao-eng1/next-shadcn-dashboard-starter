const fetch = require('node-fetch');

// 模拟浏览器请求，包含cookie
async function testAPIWithCookies() {
  try {
    // 首先获取登录页面来获取session cookie
    const loginResponse = await fetch('http://localhost:3001/api/auth/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=your-session-token' // 这里需要实际的session token
      }
    });
    
    console.log('Auth check status:', loginResponse.status);
    
    // 测试任务API
    const response = await fetch('http://localhost:3001/api/projects/cmdq080ly0009qqy7swgccib3/tasks?page=1&limit=10&sortBy=updatedAt&sortOrder=desc', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Tasks API status:', response.status);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
      
      if (data.tasks) {
        console.log('Tasks count:', data.tasks.length);
        if (data.tasks.length > 0) {
          console.log('First task:', {
            id: data.tasks[0].id,
            title: data.tasks[0].title,
            status: data.tasks[0].status,
            projectId: data.tasks[0].projectId
          });
        }
      }
    } else {
      const errorData = await response.json();
      console.log('Error response:', errorData);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testAPIWithCookies();