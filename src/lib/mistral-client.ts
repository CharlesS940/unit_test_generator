import { Mistral } from '@mistralai/mistralai';

const apiKey = process.env.MISTRAL_API_KEY;

const client = new Mistral({apiKey: apiKey});

export async function generateTests(code: string, language: string, framework: string): Promise<string> {
  const prompt = `Generate unit tests for the following ${language} code using the ${framework} testing framework:\n\n${code}\n\nUnit tests:`;
  
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