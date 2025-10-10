import { analyzePR } from '../../../lib/github-client';
import { generateTestsFromPR } from '../../../lib/mistral-client';
import type { SupportedLanguage, SupportedFramework, GitHubFile } from '../../../types';

function getDefaultFramework(language: SupportedLanguage): SupportedFramework {
  const frameworkMap: Record<SupportedLanguage, SupportedFramework> = {
    'python': 'pytest',
    'javascript': 'Jest',
    'typescript': 'Jest', 
    'java': 'JUnit',
    'go': 'testing',
    'rust': 'cargo test',
    'csharp': 'NUnit'
  };
  
  return frameworkMap[language];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prUrl } = body;

    if (!prUrl || typeof prUrl !== 'string') {
      return Response.json(
        { error: 'PR URL is required and must be a string' },
        { status: 400 }
      );
    }

    console.log(`Analyzing PR: ${prUrl}`);
    const analysis = await analyzePR(prUrl);

    const detectedLanguage = (analysis.repository.language?.toLowerCase() as SupportedLanguage) || 'python';
    const selectedFramework = getDefaultFramework(detectedLanguage);

    console.log(`Using language: ${detectedLanguage}, framework: ${selectedFramework}`);

    const tests = await generateTestsFromPR(analysis, detectedLanguage, selectedFramework);

    return Response.json({
      tests,
      prInfo: {
        title: analysis.pr.title,
        repository: analysis.repository.name,
        changedFiles: analysis.files.length,
        language: detectedLanguage,
        framework: selectedFramework,
        prNumber: analysis.pr.number,
        author: analysis.pr.user.login,
        additions: analysis.files.reduce((sum: number, file: GitHubFile) => sum + file.additions, 0),
        deletions: analysis.files.reduce((sum: number, file: GitHubFile) => sum + file.deletions, 0)
      },
      analysis: {
        files: analysis.files.map((file: GitHubFile) => ({
          filename: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          patch: file.patch
        }))
      }
    });

  } catch (error) {
    console.error('Error in PR analysis:', error);
    
    // Handle specific error types with user-friendly messages
    let errorMessage = 'Failed to analyze PR';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('Invalid GitHub PR URL')) {
        errorMessage = 'Invalid GitHub PR URL. Please use format: https://github.com/owner/repo/pull/123';
        statusCode = 400;
      } else if (error.message.includes('private')) {
        errorMessage = 'This repository is private. Only public repositories are supported.';
        statusCode = 403;
      } else if (error.message.includes('not found') || error.message.includes('404')) {
        errorMessage = 'PR not found. Please check the URL and try again.';
        statusCode = 404;
      } else if (error.message.includes('No code changes')) {
        errorMessage = 'No code changes found in this PR. It may only contain documentation or configuration changes.';
        statusCode = 400;
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'GitHub API rate limit exceeded. Please try again in a few minutes.';
        statusCode = 429;
      } else {
        errorMessage = error.message;
      }
    }

    return Response.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}