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

  let output: string = '';

  for (let i = 0; i < PRAnalysis.files.length; i++) {
    const file = PRAnalysis.files[i];

    const prompt = `Generate unit tests for the following ${language} code using the ${framework} testing framework. Return only the generated code in your answer,
    with the title of the file ${file.filename} in a comment above the generated tests. You will receive both the code changes (patch) and the full file content,
    focus only on functions that have received changes. Do not use any markdown formatting or code blocks.

    Full File Content: ${file.fileContent}

    Code Changes (Patch): ${file.patch}

    Unit tests:`;

    try {
      const response = await client.chat.complete({
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      });

      if (!response.choices || response.choices.length === 0) {
        throw new Error(`No response from Mistral API for file: ${file.filename}`);
      }

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error(`Empty response from Mistral API for file: ${file.filename}`);
      }

      output += '\n\n' + content;
      
    } catch (error: any) {
      if (error.statusCode === 429) {
        console.warn(`Rate limited on file ${file.filename}, skipping...`);
        output += `\n\n// Rate limited - could not generate tests for ${file.filename}`;
        continue;
      }
      throw error;
    }
  }
  return output;
}
