import '@testing-library/jest-dom'
import { Response, Request } from 'node-fetch'

// Set up proper Request and Response classes for the test environment
Object.defineProperty(global, 'Request', { value: Request })
Object.defineProperty(global, 'Response', { value: Response })

// Add Response.json static method for Next.js compatibility
if (!(Response as any).json) {
  (Response as any).json = function(data: any, options: any = {}) {
    return new Response(JSON.stringify(data), {
      status: options.status || 200,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })
  }
}

jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: '',
      asPath: '',
      push: jest.fn(),
      replace: jest.fn(),
    }
  },
}))

jest.mock('next/dynamic', () => {
  return function dynamic(func: any) {
    return func()
  }
})

jest.mock('@monaco-editor/react', () => {
  return {
    __esModule: true,
    default: function MockedMonacoEditor(props: any) {
      return {
        props,
        type: 'MockedMonacoEditor'
      }
    },
  }
})

const mockFetch = jest.fn()
global.fetch = mockFetch

afterEach(() => {
  jest.clearAllMocks()
})