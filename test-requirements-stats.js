const fetch = require('node-fetch');

// 测试需求统计API
async function testRequirementsStatsAPI() {
  try {
    console.log('测试需求统计API...');
    
    // 首先测试登录
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });
    
    console.log('登录状态:', loginResponse.status);
    
    if (loginResponse.status === 200) {
      // 获取cookie
      const cookies = loginResponse.headers.get('set-cookie');
      console.log('获取到的cookies:', cookies);
      
      if (cookies) {
        // 测试需求统计API
        const statsResponse = await fetch('http://localhost:3000/api/requirements/stats', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': cookies
          }
        });
        
        console.log('统计API状态:', statsResponse.status);
        
        if (statsResponse.status === 200) {
          const data = await statsResponse.json();
          console.log('统计数据:', JSON.stringify(data, null, 2));
        } else {
          const errorData = await statsResponse.json().catch(() => null);
          console.log('统计API错误:', errorData);
        }
      }
    } else {
      const loginError = await loginResponse.json().catch(() => null);
      console.log('登录失败:', loginError);
    }
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testRequirementsStatsAPI();