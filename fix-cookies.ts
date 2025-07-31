import * as fs from 'fs';
import * as path from 'path';

// Function to replace cookies() with await cookies()
function fixCookiesUsage(filePath: string): boolean {
  const content = fs.readFileSync(filePath, 'utf8');

  // Check if the file contains "const cookieStore = cookies()" but not "const cookieStore = await cookies()"
  const nonAwaitPattern = /const cookieStore = cookies\(\);/g;

  if (nonAwaitPattern.test(content)) {
    // Replace with await version
    const fixed = content.replace(
      /const cookieStore = cookies\(\);/g,
      'const cookieStore = await cookies();'
    );

    fs.writeFileSync(filePath, fixed, 'utf8');
    return true;
  }

  return false;
}

// Function to recursively find and fix .ts files in a directory
function processDirectory(dirPath: string): { total: number; fixed: number } {
  let stats = { total: 0, fixed: 0 };

  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const isDirectory = fs.statSync(itemPath).isDirectory();

    if (isDirectory) {
      // Skip node_modules and .next directories
      if (item === 'node_modules' || item === '.next') continue;

      const subStats = processDirectory(itemPath);
      stats.total += subStats.total;
      stats.fixed += subStats.fixed;
    } else if (item.endsWith('.ts')) {
      // Process TypeScript files
      stats.total++;
      if (fixCookiesUsage(itemPath)) {
        console.log(`Fixed: ${itemPath}`);
        stats.fixed++;
      }
    }
  }

  return stats;
}

// Start processing from the API routes directory
const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
const stats = processDirectory(apiDir);

console.log(`\nFixed ${stats.fixed} out of ${stats.total} TypeScript files.`);
