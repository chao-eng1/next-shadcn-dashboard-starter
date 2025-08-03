const { hasProjectPermission } = require('./src/lib/permissions');

async function testPermission() {
  try {
    const result = await hasProjectPermission(
      'cmdq080ly0009qqy7swgccib3',
      'task.view',
      'cmdh5smh7002pfy60npvxlraf'
    );

    console.log('Permission check result:', result);
  } catch (error) {
    console.error('Error checking permission:', error);
  }
}

testPermission();
