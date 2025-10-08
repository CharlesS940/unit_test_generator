import { analyzePR } from '@/lib/github-client'
import { GitHubPR, GitHubFile } from '@/types'

// Mock global fetch
global.fetch = jest.fn()
const mockFetch = fetch as jest.MockedFunction<typeof fetch>

// Mock atob function (base64 decoding)
global.atob = jest.fn()
const mockAtob = atob as jest.MockedFunction<typeof atob>

describe('github-client', () => {
  const validPRUrl = 'https://github.com/owner/repo/pull/123'
  const mockPRData: GitHubPR = {
    number: 123,
    title: 'Test PR',
    head: {
      sha: 'abc123'
    },
    base: {
      repo: {
        full_name: 'owner/repo',
        private: false,
        language: 'TypeScript'
      }
    },
    user: {
      login: 'testuser'
    }
  }

  const mockFiles: GitHubFile[] = [
    {
      filename: 'src/utils.ts',
      status: 'modified',
      additions: 1,
      deletions: 0,
      patch: '@@ -1,3 +1,4 @@\n function test() {\n+  console.log("hello");\n   return true;\n }'
    },
    {
      filename: 'README.md',
      status: 'modified',
      additions: 1,
      deletions: 0,
      patch: '@@ -1,1 +1,2 @@\n # Test\n+Added line'
    },
    {
      filename: 'src/component.jsx',
      status: 'added',
      additions: 3,
      deletions: 0,
      patch: '@@ -0,0 +1,5 @@\n+function Component() {\n+  return <div>Hello</div>;\n+}'
    }
  ]

  const mockFileContent = 'function test() {\n  console.log("hello");\n  return true;\n}'

  beforeEach(() => {
    jest.clearAllMocks()
    mockAtob.mockImplementation((str: string) => Buffer.from(str, 'base64').toString('ascii'))
  })

  describe('analyzePR', () => {

    test('should successfully analyze a valid PR', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ private: false })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPRData
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFiles
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ content: btoa(mockFileContent) })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ content: btoa('function Component() {\n  return <div>Hello</div>;\n}') })
        } as Response)

      const result = await analyzePR(validPRUrl)

      expect(result).toEqual({
        pr: mockPRData,
        files: expect.arrayContaining([
          expect.objectContaining({
            filename: 'src/utils.ts',
            status: 'modified',
            fileContent: mockFileContent
          }),
          expect.objectContaining({
            filename: 'src/component.jsx',
            status: 'added',
            fileContent: expect.any(String)
          })
        ]),
        repository: {
          name: 'owner/repo',
          language: 'TypeScript',
          isPrivate: false
        }
      })

      expect(result.files).toHaveLength(2)
      expect(mockFetch).toHaveBeenCalledTimes(5)
    })

    test('should throw error for invalid PR URL', async () => {
      const invalidUrl = 'https://invalid-url.com'

      await expect(analyzePR(invalidUrl))
        .rejects.toThrow('Invalid GitHub PR URL. Expected format: https://github.com/owner/repo/pull/123')
    })

    test('should throw error for private repository', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ private: true })
      } as Response)

      await expect(analyzePR(validPRUrl))
        .rejects.toThrow('Repository is private or does not exist. Only public repositories are supported.')
    })

    test('should throw error when repository does not exist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      } as Response)

      await expect(analyzePR(validPRUrl))
        .rejects.toThrow('Repository is private or does not exist. Only public repositories are supported.')
    })

    test('should throw error when PR not found', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ private: false })
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        } as Response)

      await expect(analyzePR(validPRUrl))
        .rejects.toThrow('PR not found. It may be in a private repository or the URL is incorrect.')
    })

    test('should throw error when failing to fetch PR files', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ private: false })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPRData
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          statusText: 'Forbidden'
        } as Response)

      await expect(analyzePR(validPRUrl))
        .rejects.toThrow('Failed to fetch PR files: 403 Forbidden')
    })

    test('should throw error when no code changes found', async () => {
      const nonCodeFiles = [
        { filename: 'README.md', status: 'modified', patch: '@@ -1,1 +1,2 @@\n # Test\n+Added line' },
        { filename: 'package.json', status: 'modified', patch: '@@ -1,1 +1,2 @@\n {\n+  "test": true' }
      ]

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ private: false })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPRData
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => nonCodeFiles
        } as Response)

      await expect(analyzePR(validPRUrl))
        .rejects.toThrow('No code changes found in this PR. It may only contain documentation or configuration changes.')
    })

    test('should filter out removed files', async () => {
      const filesWithRemoved = [
        { filename: 'src/utils.ts', status: 'modified', patch: '@@ -1,3 +1,4 @@\n function test() {\n+  console.log("hello");\n   return true;\n }' },
        { filename: 'src/old.js', status: 'removed', patch: '@@ -1,5 +0,0 @@\n-function old() {\n-  return false;\n-}' },
        { filename: 'src/new.py', status: 'added', patch: '@@ -0,0 +1,2 @@\n+def new():\n+    return True' }
      ]

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ private: false })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPRData
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => filesWithRemoved
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ content: btoa('function test() {}') })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ content: btoa('def new():\n    return True') })
        } as Response)

      const result = await analyzePR(validPRUrl)

      expect(result.files).toHaveLength(2)
      expect(result.files.map(f => f.filename)).toEqual(['src/utils.ts', 'src/new.py'])
    })

    test('should handle files without patches', async () => {
      const filesWithoutPatches = [
        { filename: 'src/utils.ts', status: 'modified', patch: '@@ -1,3 +1,4 @@\n function test() {\n+  console.log("hello");\n   return true;\n }' },
        { filename: 'src/binary.png', status: 'added' }
      ]

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ private: false })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPRData
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => filesWithoutPatches
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ content: btoa('function test() {}') })
        } as Response)

      const result = await analyzePR(validPRUrl)

      expect(result.files).toHaveLength(1)
      expect(result.files[0].filename).toBe('src/utils.ts')
    })
    })


  describe('isCodeFile function', () => {
    test('should correctly identify code files', async () => {
      const mixedFiles = [
        { filename: 'src/app.js', status: 'modified', patch: '@@ test' },
        { filename: 'components/Button.tsx', status: 'added', patch: '@@ test' },
        { filename: 'utils.py', status: 'modified', patch: '@@ test' },
        { filename: 'README.md', status: 'modified', patch: '@@ test' },
        { filename: 'package.json', status: 'modified', patch: '@@ test' },
        { filename: 'main.go', status: 'added', patch: '@@ test' },
        { filename: '.gitignore', status: 'modified', patch: '@@ test' },
        { filename: 'test.java', status: 'modified', patch: '@@ test' }
      ]

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ private: false })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPRData
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mixedFiles
        } as Response)

      const codeFileCount = 5
      for (let i = 0; i < codeFileCount; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ content: btoa('// code content') })
        } as Response)
      }

      const result = await analyzePR(validPRUrl)

      expect(result.files).toHaveLength(5)
      expect(result.files.map(f => f.filename)).toEqual([
        'src/app.js',
        'components/Button.tsx', 
        'utils.py',
        'main.go',
        'test.java'
      ])
    })
  })

  describe('parsePRUrl function', () => {
    test('should correctly parse various PR URL formats', async () => {
      const validUrls = [
        'https://github.com/owner/repo/pull/123',
        'https://github.com/my-org/my-repo-name/pull/456',
        'https://github.com/user123/project_name/pull/1'
      ]

      for (const url of validUrls) {
        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ private: false })
          } as Response)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockPRData
          } as Response)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => [{ filename: 'test.js', status: 'modified', patch: '@@ test' }]
          } as Response)
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({ content: btoa('// test') })
          } as Response)

        await expect(analyzePR(url)).resolves.toBeDefined()
      }
    })
  })
})