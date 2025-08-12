const testUpdate = async () => {
  console.log('开始测试需求更新功能...');

  // 模拟从前端发送的数据
  const testData = {
    title: '更新测试标题',
    description: '## 更新的描述\n\n这是一个**测试**更新。',
    userStory: '# 用户故事\n\n作为用户，我希望能够更新需求。',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    businessValue: 85, // 前端发送数字
    estimatedEffort: 16.5 // 前端发送数字
  };

  console.log('发送数据：', JSON.stringify(testData, null, 2));

  // 测试 schema 验证
  try {
    const { updateRequirementSchema } = await import(
      './src/features/requirement-management/schemas/requirement-schema.ts'
    );

    const result = updateRequirementSchema.safeParse(testData);

    if (result.success) {
      console.log('✅ Schema 验证通过');
      console.log('转换后数据：', JSON.stringify(result.data, null, 2));
    } else {
      console.log('❌ Schema 验证失败：', result.error.errors);
    }
  } catch (error) {
    console.error('导入schema失败：', error.message);
  }
};

// testUpdate();

module.exports = testUpdate;
