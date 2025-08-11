/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import * as path from 'path';

export async function GET(_req: NextRequest) {
  try {
    // Calculate the path to the markdown file
    const filePath = path.join(
      process.cwd(),
      'src',
      'features',
      'system-management',
      'docs',
      'implementation-records.md'
    );

    // Read the file content
    const content = await fs.readFile(filePath, 'utf-8');

    // Return the content as JSON
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to load implementation records',
        content: '# Error\n\nUnable to load the implementation records.'
      },
      { status: 500 }
    );
  }
}
