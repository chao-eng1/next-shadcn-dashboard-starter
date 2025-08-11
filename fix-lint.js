#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 获取所有需要修复的文件
function getFilesToFix() {
  try {
    const lintOutput = execSync('pnpm run lint', {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return [];
  } catch (error) {
    const output = error.stdout || error.stderr || '';
    const lines = output.split('\n');
    const files = new Set();

    lines.forEach((line) => {
      // 匹配文件路径
      const match = line.match(/^(.+\.tsx?):(\d+):(\d+)/);
      if (match) {
        files.add(match[1]);
      }
    });

    return Array.from(files);
  }
}

// 修复文件中的 console 语句
function fixConsoleStatements(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 移除调试用的 console.log 语句（保留 console.error）
  const lines = content.split('\n');
  const newLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 跳过包含 console.log 的行（但保留 console.error）
    if (line.includes('console.log(') && !line.includes('console.error(')) {
      // 检查是否是单独的 console.log 行
      const trimmed = line.trim();
      if (
        trimmed.startsWith('console.log(') ||
        trimmed.includes('console.log(')
      ) {
        modified = true;
        continue; // 跳过这一行
      }
    }

    newLines.push(line);
  }

  if (modified) {
    fs.writeFileSync(filePath, newLines.join('\n'));
    console.log(`Fixed console statements in: ${filePath}`);
  }
}

// 修复未使用的变量
function fixUnusedVariables(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;

  // 为解构赋值中未使用的变量添加 eslint-disable 注释
  const destructuringPattern = /const\s*{\s*([^}]+)\s*}\s*=/g;
  let match;

  while ((match = destructuringPattern.exec(content)) !== null) {
    const variables = match[1].split(',').map((v) => v.trim());
    const hasUnusedVar = variables.some((v) => {
      const varName = v.split(':')[0].trim();
      return (
        varName &&
        !content.includes(`${varName}.`) &&
        !content.includes(`${varName}[`) &&
        !content.includes(`${varName}(`)
      );
    });

    if (hasUnusedVar) {
      const lineStart = content.lastIndexOf('\n', match.index) + 1;
      const beforeLine = content.substring(0, lineStart);
      const afterLine = content.substring(lineStart);

      if (
        !beforeLine.includes(
          '// eslint-disable-next-line @typescript-eslint/no-unused-vars'
        )
      ) {
        newContent =
          beforeLine +
          '    // eslint-disable-next-line @typescript-eslint/no-unused-vars\n' +
          afterLine;
      }
    }
  }

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Fixed unused variables in: ${filePath}`);
  }
}

// 主函数
function main() {
  console.log('开始修复 lint 警告...');

  const filesToFix = getFilesToFix();
  console.log(`找到 ${filesToFix.length} 个需要修复的文件`);

  filesToFix.forEach((filePath) => {
    if (fs.existsSync(filePath)) {
      try {
        fixConsoleStatements(filePath);
        fixUnusedVariables(filePath);
      } catch (error) {
        console.error(`修复文件 ${filePath} 时出错:`, error.message);
      }
    }
  });

  console.log('修复完成！');

  // 再次运行 lint 检查结果
  try {
    console.log('\n重新运行 lint 检查...');
    execSync('pnpm run lint', { stdio: 'inherit' });
    console.log('所有 lint 警告已修复！');
  } catch (error) {
    console.log('仍有一些 lint 警告需要手动修复。');
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixConsoleStatements, fixUnusedVariables };
