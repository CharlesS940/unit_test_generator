import { generateTestsFromCode, generateTestsFromPR } from '@/lib/mistral-client'
import { PRAnalysis, SupportedLanguage, SupportedFramework } from '@/types'

// Mock the Mistral SDK module
jest.mock('@mistralai/mistralai', () => {
  const mockChatComplete = jest.fn()
  
  return {
    Mistral: jest.fn().mockImplementation(() => ({
      chat: {
        complete: mockChatComplete
      }
    })),
    __mockChatComplete: mockChatComplete
  }
})

import mockMistralModule from '@mistralai/mistralai'
const mockChatComplete = (mockMistralModule as any).__mockChatComplete

describe('mistral-client', () => {
  const mockCode = 'function add(a: number, b: number): number { return a + b }'
  const mockLanguage: SupportedLanguage = 'typescript'
  const mockFramework: SupportedFramework = 'Jest'

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockChatComplete.mockResolvedValue({
      choices: [
        {
          message: {
            content: 'test("should add numbers", () => {\n  expect(add(2, 3)).toBe(5);\n});'
          }
        }
      ]
    })
  })

  describe('generateTestsFromCode', () => {
    test('should generate tests successfully with valid inputs', async () => {
      const result = await generateTestsFromCode(mockCode, mockLanguage, mockFramework)

      expect(result).toBe('test("should add numbers", () => {\n  expect(add(2, 3)).toBe(5);\n});')
      expect(mockChatComplete).toHaveBeenCalledTimes(1)
    })

    test('should throw error when no response choices', async () => {
      mockChatComplete.mockResolvedValue({ choices: [] })

      await expect(generateTestsFromCode(mockCode, mockLanguage, mockFramework))
        .rejects.toThrow('No response from Mistral API')
    })

    test('should throw error when choices is null/undefined', async () => {
      mockChatComplete.mockResolvedValue({ choices: null })

      await expect(generateTestsFromCode(mockCode, mockLanguage, mockFramework))
        .rejects.toThrow('No response from Mistral API')
    })

    test('should throw error when message content is empty', async () => {
      mockChatComplete.mockResolvedValue({
        choices: [{ message: { content: null } }]
      })

      await expect(generateTestsFromCode(mockCode, mockLanguage, mockFramework))
        .rejects.toThrow('Empty response from Mistral API')
    })

    test('should throw error when message content is empty string', async () => {
      mockChatComplete.mockResolvedValue({
        choices: [{ message: { content: '' } }]
      })

      await expect(generateTestsFromCode(mockCode, mockLanguage, mockFramework))
        .rejects.toThrow('Empty response from Mistral API')
    })

    test('should propagate API errors', async () => {
      const apiError = new Error('API connection failed')
      mockChatComplete.mockRejectedValue(apiError)

      await expect(generateTestsFromCode(mockCode, mockLanguage, mockFramework))
        .rejects.toThrow('API connection failed')
    })
  })

  describe('generateTestsFromPR', () => {
    const mockPRAnalysis: PRAnalysis = {
      pr: {
        number: 123,
        title: 'Test PR',
        head: { sha: 'abc123' },
        base: {
          repo: {
            full_name: 'owner/repo',
            private: false,
            language: 'TypeScript'
          }
        },
        user: { login: 'testuser' }
      },
      files: [
        {
          filename: 'src/utils.ts',
          status: 'modified',
          additions: 1,
          deletions: 0,
          patch: '@@ -1,3 +1,4 @@\n function add(a, b) {\n+  // Added comment\n   return a + b;\n }',
          fileContent: 'function add(a, b) {\n  // Added comment\n  return a + b;\n}'
        },
        {
          filename: 'src/component.jsx',
          status: 'added',
          additions: 3,
          deletions: 0,
          patch: '@@ -0,0 +1,5 @@\n+function multiply(x, y) {\n+  return x * y;\n+}',
          fileContent: 'function multiply(x, y) {\n  return x * y;\n}'
        }
      ],
      repository: {
        name: 'owner/repo',
        language: 'TypeScript',
        isPrivate: false
      }
    }

    test('should process all files and concatenate results', async () => {
      mockChatComplete
        .mockResolvedValueOnce({
          choices: [{ message: { content: '// src/utils.ts\ntest("add function", () => {\n  expect(add(2, 3)).toBe(5);\n});' } }]
        })
        .mockResolvedValueOnce({
          choices: [{ message: { content: '// src/component.jsx\ntest("multiply function", () => {\n  expect(multiply(2, 3)).toBe(6);\n});' } }]
        })

      const result = await generateTestsFromPR(mockPRAnalysis, mockLanguage, mockFramework)

      expect(result).toBe('\n\n// src/utils.ts\ntest("add function", () => {\n  expect(add(2, 3)).toBe(5);\n});\n\n// src/component.jsx\ntest("multiply function", () => {\n  expect(multiply(2, 3)).toBe(6);\n});')
      expect(mockChatComplete).toHaveBeenCalledTimes(2)
    })

    test('should include file content and patch in prompts', async () => {
      await generateTestsFromPR(mockPRAnalysis, mockLanguage, mockFramework)

      const firstCall = mockChatComplete.mock.calls[0][0]
      const firstPrompt = firstCall.messages[0].content

      expect(firstPrompt).toContain('src/utils.ts')
      expect(firstPrompt).toContain('function add(a, b) {\n  // Added comment\n  return a + b;\n}')
      expect(firstPrompt).toContain('@@ -1,3 +1,4 @@')
    })

    test('should handle rate limiting gracefully', async () => {
      const rateLimitError = new Error('Rate limit exceeded') as any
      rateLimitError.statusCode = 429

      mockChatComplete
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({
          choices: [{ message: { content: '// src/component.jsx\ntest("multiply function", () => {\n  expect(multiply(2, 3)).toBe(6);\n});' } }]
        })

      const result = await generateTestsFromPR(mockPRAnalysis, mockLanguage, mockFramework)

      expect(result).toContain('Rate limited - could not generate tests for src/utils.ts')
      expect(result).toContain('// src/component.jsx\ntest("multiply function", () => {\n  expect(multiply(2, 3)).toBe(6);\n});')
      expect(mockChatComplete).toHaveBeenCalledTimes(2)
    })

    test('should throw error for non-rate-limit API errors', async () => {
      const serverError = new Error('Server error') as any
      serverError.statusCode = 500
      mockChatComplete.mockRejectedValue(serverError)

      await expect(generateTestsFromPR(mockPRAnalysis, mockLanguage, mockFramework))
        .rejects.toThrow('Server error')
    })

    test('should throw specific error when no response for a file', async () => {
      mockChatComplete.mockResolvedValue({ choices: [] })

      await expect(generateTestsFromPR(mockPRAnalysis, mockLanguage, mockFramework))
        .rejects.toThrow('No response from Mistral API for file: src/utils.ts')
    })

    test('should throw specific error when empty content for a file', async () => {
      mockChatComplete.mockResolvedValue({
        choices: [{ message: { content: null } }]
      })

      await expect(generateTestsFromPR(mockPRAnalysis, mockLanguage, mockFramework))
        .rejects.toThrow('Empty response from Mistral API for file: src/utils.ts')
    })
  })
})