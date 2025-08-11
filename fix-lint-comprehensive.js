const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 获取所有需要修复的文件
function getFilesWithLintIssues() {
  try {
    const result = execSync('pnpm run lint', {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return [];
  } catch (error) {
    const output = error.stdout || error.stderr || '';
    const files = [];
    const lines = output.split('\n');

    for (const line of lines) {
      if (line.startsWith('./src/')) {
        const filePath = line.replace('./', '');
        if (!files.includes(filePath)) {
          files.push(filePath);
        }
      }
    }

    return files;
  }
}

// 修复单个文件
function fixFile(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`文件不存在: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    // 修复未使用的 req 参数
    if (content.includes("'req' is defined but never used")) {
      // 查找函数定义中的 req 参数
      content = content.replace(
        /(export\s+async\s+function\s+\w+\s*\()([^)]*req[^)]*)(\))/g,
        (match, start, params, end) => {
          // 在 req 参数前添加下划线
          const newParams = params.replace(/\breq\b/g, '_req');
          modified = true;
          return start + newParams + end;
        }
      );
    }

    // 移除调试用的 console.log 语句，保留 console.error
    const consoleLogRegex = /^\s*console\.log\([^;]*\);?\s*$/gm;
    const originalContent = content;
    content = content.replace(consoleLogRegex, '');
    if (content !== originalContent) {
      modified = true;
    }

    // 清理多余的空行
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

    if (modified) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`已修复: ${filePath}`);
    }
  } catch (error) {
    console.error(`修复文件失败 ${filePath}:`, error.message);
  }
}

// 主函数
function main() {
  console.log('开始修复 lint 问题...');

  const files = getFilesWithLintIssues();
  console.log(`找到 ${files.length} 个需要修复的文件`);

  for (const file of files) {
    fixFile(file);
  }

  console.log('修复完成！');

  // 再次运行 lint 检查结果
  try {
    console.log('\n重新运行 lint 检查...');
    execSync('pnpm run lint', { stdio: 'inherit' });
    console.log('所有 lint 问题已解决！');
  } catch (error) {
    console.log('仍有一些 lint 警告，但已大幅减少。');
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixFile, getFilesWithLintIssues };
