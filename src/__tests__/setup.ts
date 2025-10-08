import '@testing-library/jest-dom'

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