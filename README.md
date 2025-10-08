# Unit Test Generator

An intelligent unit test generation tool that automatically creates comprehensive test cases for your code using AI. Whether you're working with manual code input or analyzing GitHub pull requests, this tool streamlines the testing process across multiple programming languages and frameworks.

## Features

### Manual Code Testing
- **Multi-language Support**: Generate tests for Python, JavaScript, TypeScript, Java, C#, Go, and Rust
- **Framework Flexibility**: Choose from popular testing frameworks for each language like pytest, Jest, JUnit, and more
- **Interactive Code Editor**: Built-in Monaco editor with syntax highlighting to help with manual code input

### GitHub PR Analysis
- **Automated PR Scanning**: Analyze entire GitHub pull requests to understand code changes
- **Context-Aware Testing**: Generate tests based on both full file content and specific changes
- **File-by-File Processing**: Sequential analysis of each modified file for comprehensive coverage

The application currently relies on the Mistral developper API key for test generation. It can be obtained and used for free with limited rates. I plan to deploy this application using Vercel soon which would allow users to generate tests without using their own API key.

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/CharlesS940/unit_test_generator.git
cd unit_test_generator
```

2. **Install dependencies:**
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Set up environment variables:**
Create a `.env.local` file in the root directory:
```env
MISTRAL_API_KEY=your_mistral_api_key_here
```
> Get your free Mistral API key at [console.mistral.ai](https://console.mistral.ai)

4. **Run the development server:**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. **Open your browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Manual Code Testing
1. Navigate to the "Manual Code" tab
2. Select your programming language and testing framework
3. Paste or write your code in the editor
4. Click "Generate Tests" to create comprehensive unit tests
5. Copy the generated tests to your project

### GitHub PR Analysis
1. Switch to the "PR Analysis" tab
3. Enter the URL of the GitHub pull request you want to analyze
4. Click "Analyze PR & Generate Tests"
5. Review the generated tests for the changes in the PR

## Future Features

### Future features
- **Testing Framework Detection**: Detect which testing framework the repository currently uses and apply it to the generated tests. I currently rely on a default framework selection
- **Direct PR Comments**: Automatically post generated unit tests as comments directly on GitHub pull requests
- **Streaming Outputs**: Continuously display tokens as they are generated to improve user experience


