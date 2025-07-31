const fs = require('fs');
const path = require('path');

// 读取主schema文件
const mainSchemaPath = path.join(__dirname, 'schema.prisma');
let mainSchema = fs.readFileSync(mainSchemaPath, 'utf8');

// 读取扩展schema文件
const extensionSchemaPath = path.join(__dirname, 'schema-extension.prisma');
const extensionSchema = fs.readFileSync(extensionSchemaPath, 'utf8');

// 确保主schema文件没有结束标记（如果有的话）
mainSchema = mainSchema.trim();

// 检查User模型是否存在，为User模型添加项目管理相关的关系字段
const userModelPattern = /model\s+User\s+{([^}]*)}/s;
const userModelMatch = mainSchema.match(userModelPattern);

if (userModelMatch) {
  // 读取用户扩展schema文件
  const userExtensionSchemaPath = path.join(
    __dirname,
    'schema-user-extension.prisma'
  );
  const userExtensionSchema = fs.readFileSync(userExtensionSchemaPath, 'utf8');

  // 提取用户扩展字段
  const userExtensionFieldsMatch = userExtensionSchema.match(
    /\/\/ 项目管理相关字段([\s\S]*?)}/
  );
  const userExtensionFields = userExtensionFieldsMatch
    ? userExtensionFieldsMatch[1].trim()
    : '';

  // 将用户扩展字段添加到主User模型中
  const updatedUserModel = `model User {${userModelMatch[1]}
  
  // 项目管理相关字段
${userExtensionFields}
}`;

  // 替换User模型
  mainSchema = mainSchema.replace(userModelPattern, updatedUserModel);
}

// 添加扩展schema到主schema文件
const updatedSchema = `${mainSchema}

// 项目管理模块扩展
${extensionSchema}`;

// 备份原始schema文件
const backupPath = `${mainSchemaPath}.backup.${Date.now()}`;
fs.writeFileSync(backupPath, mainSchema);
console.log(`原始schema文件已备份到 ${backupPath}`);

// 写入更新后的schema文件
fs.writeFileSync(mainSchemaPath, updatedSchema);
console.log('Schema文件已成功更新');
