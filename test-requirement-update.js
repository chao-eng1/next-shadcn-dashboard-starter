// 测试需求更新API的脚本
const testRequirementUpdate = async () => {
  const projectId = 'cme8a7y460000qqfv4oah7fhv'; // 需要替换为实际项目ID
  const requirementId = 'cme8a7y470003qqfv452ahuk4'; // 需要替换为实际需求ID

  const testData = {
    title: '测试更新的标题',
    description: '## 测试更新的描述\n\n这是一个**测试**的需求描述。',
    userStory: '# 测试用户故事\n\n作为用户，我希望...',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    businessValue: 80
  };

  console.log('发送的数据：', JSON.stringify(testData, null, 2));

  try {
    const response = await fetch(
      `http://localhost:3000/api/projects/${projectId}/requirements/${requirementId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: 'token=your_jwt_token_here' // 需要实际token
        },
        body: JSON.stringify(testData)
      }
    );

    console.log('响应状态：', response.status);
    const result = await response.json();
    console.log('响应数据：', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('请求失败：', error);
  }
};

// 在浏览器控制台中运行
// testRequirementUpdate();

module.exports = testRequirementUpdate;
