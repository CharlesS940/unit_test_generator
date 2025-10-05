import { Mistral } from '@mistralai/mistralai';

import { PRAnalysis, SupportedLanguage, SupportedFramework } from '@/types';

const apiKey = process.env.MISTRAL_API_KEY;

const client = new Mistral({apiKey: apiKey});

export async function generateTestsFromCode(code: string, language: SupportedLanguage, framework: SupportedFramework): Promise<string> {
  const prompt = `Generate unit tests for the following ${language} code using the ${framework} testing framework. Return only the generated code in your answer,
  do not use any markdown formatting or code blocks.
  
  Code: ${code}
  
  Unit tests:`;
  
  const response = await client.chat.complete({
    model: 'mistral-small-latest',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
  });

  if (!response.choices || response.choices.length === 0) {
    throw new Error('No response from Mistral API');
  }

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('Empty response from Mistral API');
  }

  return content as string;
}

export async function generateTestsFromPR(PRAnalysis: PRAnalysis, language: SupportedLanguage, framework: SupportedFramework): Promise<string> {
  const prompt = `Generate unit tests for the following ${language} code using the ${framework} testing framework. Return only the generated code in your answer,
  do not use any markdown formatting or code blocks.

  Code: ${PRAnalysis.files.map((file: any) => file.patch).join('\n')}

  Unit tests:`;

  const response = await client.chat.complete({
    model: 'mistral-small-latest',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
  });

  if (!response.choices || response.choices.length === 0) {
    throw new Error('No response from Mistral API');
  }

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('Empty response from Mistral API');
  }

  return content as string;
}
