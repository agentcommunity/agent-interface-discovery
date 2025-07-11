import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

interface PackageJson {
  version?: string;
}

// The function is now async and uses await, which is best practice for I/O.
export async function GET() {
  try {
    const packageJsonPath = path.join(process.cwd(), '..', 'aid', 'package.json');

    // 1. Use async readFile and await the result.
    // 2. Use 'utf8' encoding (no hyphen).
    const fileContents = await readFile(packageJsonPath, 'utf8');

    // 3. The 'as' cast tells TypeScript the shape of the parsed JSON, fixing unsafe assignments.
    const packageJson = JSON.parse(fileContents) as PackageJson;
    const version = packageJson.version ?? '0.0.0';

    return NextResponse.json({ version });
  } catch {
    // Fallback to 0.0.0 if we can't read or parse the file.
    return NextResponse.json({ version: '0.0.0' });
  }
}
