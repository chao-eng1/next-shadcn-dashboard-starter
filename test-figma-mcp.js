#!/usr/bin/env node

/**
 * Figma MCP 工具测试脚本
 *
 * 使用方法:
 * 1. 首先配置环境变量 FIGMA_ACCESS_TOKEN 和 FIGMA_FILE_KEY
 * 2. 运行: node test-figma-mcp.js
 */

const fs = require('fs');
const path = require('path');

// 检查环境变量配置
function checkEnvironmentConfig() {
  console.log('🔍 检查 Figma MCP 配置...');

  const envFiles = ['.env.local', '.env'];
  let configFound = false;

  for (const envFile of envFiles) {
    const envPath = path.join(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      console.log(`✅ 找到配置文件: ${envFile}`);
      const content = fs.readFileSync(envPath, 'utf8');

      const hasFigmaToken = content.includes('FIGMA_ACCESS_TOKEN');
      const hasFigmaFileKey = content.includes('FIGMA_FILE_KEY');

      console.log(
        `   - FIGMA_ACCESS_TOKEN: ${hasFigmaToken ? '✅ 已配置' : '❌ 未配置'}`
      );
      console.log(
        `   - FIGMA_FILE_KEY: ${hasFigmaFileKey ? '✅ 已配置' : '❌ 未配置'}`
      );

      if (hasFigmaToken && hasFigmaFileKey) {
        configFound = true;
      }
    }
  }

  if (!configFound) {
    console.log('❌ 未找到完整的 Figma 配置');
    console.log('');
    console.log('请按照以下步骤配置:');
    console.log('1. 复制环境变量模板:');
    console.log('   cp env.example.txt .env.local');
    console.log('');
    console.log('2. 在 .env.local 文件末尾添加:');
    console.log('   FIGMA_ACCESS_TOKEN=your_figma_token_here');
    console.log('   FIGMA_FILE_KEY=your_figma_file_key_here');
    console.log('');
    console.log('3. 获取 Figma 访问令牌:');
    console.log('   - 登录 https://www.figma.com/');
    console.log('   - 进入 Settings > Account > Personal access tokens');
    console.log('   - 创建新令牌并复制');
    console.log('');
    console.log('4. 获取 Figma 文件 Key:');
    console.log('   - 从 Figma 文件 URL 中提取');
    console.log('   - 格式: https://www.figma.com/file/[FILE_KEY]/...');
    return false;
  }

  return true;
}

// 模拟 Figma MCP 调用
function simulateFigmaMCPCall() {
  console.log('');
  console.log('🚀 模拟 Figma MCP 调用...');

  // 模拟成功的调用示例
  const mockFigmaData = {
    name: '测试设计文件',
    lastModified: new Date().toISOString(),
    thumbnailUrl: 'https://example.com/thumbnail.png',
    version: '1.0',
    document: {
      id: '0:0',
      name: 'Document',
      type: 'DOCUMENT',
      children: [
        {
          id: '0:1',
          name: 'Page 1',
          type: 'CANVAS',
          children: [
            {
              id: '1:2',
              name: 'Frame 1',
              type: 'FRAME',
              absoluteBoundingBox: {
                x: 0,
                y: 0,
                width: 375,
                height: 812
              }
            }
          ]
        }
      ]
    }
  };

  console.log('✅ 模拟数据获取成功:');
  console.log(JSON.stringify(mockFigmaData, null, 2));

  console.log('');
  console.log('📥 模拟图像下载:');
  console.log('- 下载节点 1:2 为 SVG 格式');
  console.log('- 保存路径: ./public/assets/frame-1.svg');
  console.log('- 状态: ✅ 成功');
}

// 提供配置建议
function provideConfigurationAdvice() {
  console.log('');
  console.log('💡 配置建议:');
  console.log('');
  console.log('1. 安全性:');
  console.log('   - 不要将访问令牌提交到版本控制');
  console.log('   - 使用 .env.local 文件（已在 .gitignore 中）');
  console.log('');
  console.log('2. 权限:');
  console.log('   - 确保令牌有访问目标文件的权限');
  console.log('   - 文件必须是公开的或你有访问权限');
  console.log('');
  console.log('3. 测试:');
  console.log('   - 先用简单的文件测试连接');
  console.log('   - 逐步增加复杂度');
  console.log('');
  console.log('4. 调试:');
  console.log('   - 检查网络连接');
  console.log('   - 验证文件 Key 格式');
  console.log('   - 确认令牌有效性');
}

// 主函数
function main() {
  console.log('🎨 Figma MCP 工具测试');
  console.log('='.repeat(50));

  const isConfigured = checkEnvironmentConfig();

  if (isConfigured) {
    console.log('');
    console.log('✅ 配置检查通过！');
    console.log('现在可以使用 Figma MCP 工具了。');

    simulateFigmaMCPCall();
  }

  provideConfigurationAdvice();

  console.log('');
  console.log('📚 更多信息请查看:');
  console.log('   - figma-mcp-demo.md');
  console.log('   - figma-mcp-test.md');
  console.log('');
}

// 运行测试
if (require.main === module) {
  main();
}

module.exports = {
  checkEnvironmentConfig,
  simulateFigmaMCPCall,
  provideConfigurationAdvice
};
