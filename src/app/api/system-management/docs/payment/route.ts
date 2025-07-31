import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import * as path from 'path';

export async function GET(req: NextRequest) {
  try {
    // Calculate the path to the markdown file
    // Note: In a production environment, you might want to store these files in a more accessible location
    // or use a CMS or database instead of reading from the filesystem
    const filePath = path.join(
      process.cwd(),
      'src',
      'features',
      'system-management',
      'docs',
      'payment-system.md'
    );

    // Read the file content
    const content = await fs.readFile(filePath, 'utf-8');

    // Return the content as JSON
    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error fetching payment system documentation:', error);
    return NextResponse.json(
      {
        error: 'Failed to load payment system documentation',
        content: '# Error\n\nUnable to load the payment system documentation.'
      },
      { status: 500 }
    );
  }
}
