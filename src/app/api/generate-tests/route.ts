// API route for generating unit tests using Mistral

import { generateTests } from '@/lib/mistral-client';

export async function POST(request: Request) {
  try {
    // Get the code from the request
    const { code, language } = await request.json();

    // Call our Mistral client
    const tests = await generateTests(code, language || 'python');

    // Return the generated tests
    return Response.json({ tests });
    
  } catch (error) {
    console.error('Error generating tests:', error);
    return Response.json(
      { error: 'Failed to generate tests' }, 
      { status: 500 }
    );
  }
}
