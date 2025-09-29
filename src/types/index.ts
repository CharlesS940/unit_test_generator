// Supported programming languages for unit test generation
export type SupportedLanguage = 'python' | 'javascript' | 'typescript' | 'java' | 'go' | 'rust' | 'csharp';

// API Request type
export interface GenerateTestsRequest {
  code: string;
  language: SupportedLanguage;
}

// Language configuration for Monaco Editor and display
export interface LanguageConfig {
  value: SupportedLanguage;
  label: string;
  testFramework: string[];
}

// Available languages with their configurations
export const LANGUAGE_CONFIGS: LanguageConfig[] = [
  {
    value: 'python',
    label: 'Python',
    testFramework: ['pytest', 'unittest']
  },
  {
    value: 'javascript',
    label: 'JavaScript',
    testFramework: ['Jest', 'Mocha']
  },
  {
    value: 'typescript',
    label: 'TypeScript',
    testFramework: ['Jest', 'Mocha']
  },
  {
    value: 'java',
    label: 'Java',
    testFramework: ['JUnit', 'TestNG']
  },
  {
    value: 'go',
    label: 'Go',
    testFramework: ['testing']
  },
  {
    value: 'rust',
    label: 'Rust',
    testFramework: ['cargo test']
  },
  {
    value: 'csharp',
    label: 'C#',
    testFramework: ['NUnit', 'xUnit']
  }
];
