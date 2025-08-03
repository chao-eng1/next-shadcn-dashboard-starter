const fetch = require('node-fetch');

async function testTaskAPI() {
  try {
    const projectId = 'cmdi9bmzd000dqqxs1xrqtb0s';
    const baseUrl = 'http://localhost:3001';

    // 模拟前端的API调用
    const params = new URLSearchParams({
      page: '1',
      limit: '10',
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    });

    const apiUrl = `${baseUrl}/api/projects/${projectId}/tasks?${params.toString()}`;
    console.log('Testing API URL:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
        // 注意：在实际应用中，这里需要包含认证信息
        // 但由于我们在测试环境中，可能需要模拟登录状态
      }
    });

    console.log('Response status:', response.status);
    console.log(
      'Response headers:',
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testTaskAPI();
