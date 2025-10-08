import { POST } from './route'
import { generateTestsFromCode } from '@/lib/mistral-client'
import type { GenerateTestsRequest } from '@/types'

jest.mock('@/lib/mistral-client', () => ({
  generateTestsFromCode: jest.fn()
}))

const mockGenerateTestsFromCode = generateTestsFromCode as jest.MockedFunction<typeof generateTestsFromCode>

describe('POST /api/generate-tests-from-code', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGenerateTestsFromCode.mockResolvedValue('test("should work", () => { expect(true).toBe(true); });')
  })

  describe('successful requests', () => {
    test('should generate tests with valid request', async () => {
      const requestBody: GenerateTestsRequest = {
        code: 'function add(a, b) { return a + b; }',
        language: 'typescript',
        framework: 'Jest'
      }

      const request = new Request('http://localhost:3000/api/generate-tests-from-code', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        tests: 'test("should work", () => { expect(true).toBe(true); });'
      })
      expect(mockGenerateTestsFromCode).toHaveBeenCalledWith(
        'function add(a, b) { return a + b; }',
        'typescript',
        'Jest'
      )
    })

    test('should use default language and framework when not provided', async () => {
      mockGenerateTestsFromCode.mockResolvedValue('def test_add():\n    assert add(2, 3) == 5')
      
      const requestBody = {
        code: 'def add(a, b):\n    return a + b'
      }

      const request = new Request('http://localhost:3000/api/generate-tests-from-code', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        tests: 'def test_add():\n    assert add(2, 3) == 5'
      })
      expect(mockGenerateTestsFromCode).toHaveBeenCalledWith(
        'def add(a, b):\n    return a + b',
        'python',
        'pytest'
      )
    })

    test('should handle different language/framework combinations', async () => {
      const testCases = [
        { 
          language: 'javascript', 
          framework: 'Mocha',
          expectedTest: 'describe("sample", () => { it("should work", () => { expect(true).to.be.true; }); });'
        },
        { 
          language: 'java', 
          framework: 'JUnit',
          expectedTest: '@Test\npublic void testSample() {\n    assertTrue(true);\n}'
        },
        { 
          language: 'go', 
          framework: 'testing',
          expectedTest: 'func TestSample(t *testing.T) {\n    if !true {\n        t.Error("Expected true")\n    }\n}'
        }
      ]

      for (const testCase of testCases) {
        // Set up specific mock response for each language/framework
        mockGenerateTestsFromCode.mockResolvedValueOnce(testCase.expectedTest)
        
        const requestBody: GenerateTestsRequest = {
          code: 'sample code',
          language: testCase.language as any,
          framework: testCase.framework as any
        }

        const request = new Request('http://localhost:3000/api/generate-tests-from-code', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' }
        })

        const response = await POST(request)
        const data = await response.json()
        
        expect(response.status).toBe(200)
        expect(data).toEqual({
          tests: testCase.expectedTest
        })
        expect(mockGenerateTestsFromCode).toHaveBeenCalledWith(
          'sample code',
          testCase.language,
          testCase.framework
        )
      }
    })
  })

  describe('error handling', () => {
    test('should return 500 when mistral-client throws an error', async () => {
      mockGenerateTestsFromCode.mockRejectedValue(new Error('API connection failed'))

      const requestBody: GenerateTestsRequest = {
        code: 'function test() {}',
        language: 'typescript',
        framework: 'Jest'
      }

      const request = new Request('http://localhost:3000/api/generate-tests-from-code', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: 'Failed to generate tests'
      })
    })

    test('should return 500 when request body is invalid JSON', async () => {
      const request = new Request('http://localhost:3000/api/generate-tests-from-code', {
        method: 'POST',
        body: 'invalid json{',
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: 'Failed to generate tests'
      })
      expect(mockGenerateTestsFromCode).not.toHaveBeenCalled()
    })

    test('should handle missing code field gracefully', async () => {
      const requestBody = {
        language: 'typescript',
        framework: 'Jest'
      }

      const request = new Request('http://localhost:3000/api/generate-tests-from-code', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(mockGenerateTestsFromCode).toHaveBeenCalledWith(
        undefined,
        'typescript',
        'Jest'
      )
    })

    test('should handle empty request body', async () => {
      const request = new Request('http://localhost:3000/api/generate-tests-from-code', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(mockGenerateTestsFromCode).toHaveBeenCalledWith(
        undefined,
        'python',
        'pytest'
      )
    })
  })
})