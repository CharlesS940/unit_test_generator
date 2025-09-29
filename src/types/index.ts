export type SupportedLanguage = 'python' | 'javascript' | 'typescript' | 'java' | 'go' | 'rust' | 'csharp';

export type SupportedFramework = 'pytest' | 'unittest' | 'Jest' | 'Mocha' | 'JUnit' | 'TestNG' | 'testing' | 'cargo test' | 'NUnit' | 'xUnit';

export interface GenerateTestsRequest {
  code: string;
  language: SupportedLanguage;
  framework: SupportedFramework;
}

export interface LanguageConfig {
  value: SupportedLanguage;
  label: string;
  testFramework: SupportedFramework[];
}

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
