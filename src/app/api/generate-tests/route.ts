import { generateTests } from '@/lib/mistral-client';
import type { GenerateTestsRequest } from '@/types';

export async function POST(request: Request) {
  try {
    const { code, language, framework }: GenerateTestsRequest = await request.json();

    const tests = await generateTests(code, language || 'python', framework || 'pytest');

    return Response.json({ tests });
    
  } catch (error) {
    console.error('Error generating tests:', error);
    return Response.json(
      { error: 'Failed to generate tests' }, 
      { status: 500 }
    );
  }
}
