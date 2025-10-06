import type { GitHubPR, GitHubFile, PRAnalysis } from '../types';

function parsePRUrl(url: string): { owner: string; repo: string; number: number } {
  const regex = /github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/;
  const match = url.match(regex);
  
  if (!match) {
    throw new Error('Invalid GitHub PR URL. Expected format: https://github.com/owner/repo/pull/123');
  }
  
  return {
    owner: match[1],
    repo: match[2],
    number: parseInt(match[3], 10)
  };
}

async function checkRepositoryAccess(owner: string, repo: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    
    if (response.ok) {
      const repoData = await response.json();
      return !repoData.private;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking repository access:', error);
    return false;
  }
}

async function fetchPRData(owner: string, repo: string, number: number): Promise<GitHubPR> {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${number}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('PR not found. It may be in a private repository or the URL is incorrect.');
    }
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }
  
  const prData = await response.json();
  
  if (prData.base.repo.private) {
    throw new Error('This repository is private. Only public repositories are supported.');
  }
  
  return prData;
}

async function fetchFileContent(owner: string, repo: string, path: string, ref: string): Promise<string> {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch file content for ${path}: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.content) {
    throw new Error(`File ${path} is too large or binary content not available`);
  }
  
  try {
    return atob(data.content.replace(/\s/g, ''));
  } catch (error) {
    throw new Error(`Failed to decode content for ${path}: ${error}`);
  }
}

async function fetchPRFiles(owner: string, repo: string, number: number): Promise<GitHubFile[]> {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${number}/files`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch PR files: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

function isCodeFile(filename: string): boolean {
  const codeExtensions = [
    '.js', '.ts', '.jsx', '.tsx',
    '.py', '.java', '.go', '.rs',
    '.c', '.cpp', '.cs', '.php',
    '.rb', '.swift', '.kt', '.scala'
  ];
  
  const excludePatterns = [
    'README', 'LICENSE', 'CHANGELOG',
    '.md', '.txt', '.json', '.yml', '.yaml',
    '.lock', '.gitignore', '.env'
  ];
  
  const hasCodeExtension = codeExtensions.some(ext => filename.endsWith(ext));
  
  const shouldExclude = excludePatterns.some(pattern => 
    filename.includes(pattern) || filename.endsWith(pattern)
  );
  
  return hasCodeExtension && !shouldExclude;
}

export async function analyzePR(prUrl: string): Promise<PRAnalysis> {

  const { owner, repo, number } = parsePRUrl(prUrl);
  
  const isAccessible = await checkRepositoryAccess(owner, repo);
  if (!isAccessible) {
    throw new Error('Repository is private or does not exist. Only public repositories are supported.');
  }
  
  const [prData, files] = await Promise.all([
    fetchPRData(owner, repo, number),
    fetchPRFiles(owner, repo, number)
  ]);
  
  const codeFiles = files.filter(file => 
    file.status !== 'removed' &&
    file.patch &&
    isCodeFile(file.filename)
  );

  for (const file of codeFiles) {
    try {
      const fullContent = await fetchFileContent(owner, repo, file.filename, prData.head.sha);
      file.fileContent = fullContent;
    } catch (error) {
      console.warn(`Could not fetch content for ${file.filename}: ${error}`);
      file.fileContent = '';
    }
  }

  if (codeFiles.length === 0) {
    throw new Error('No code changes found in this PR. It may only contain documentation or configuration changes.');
  }
  
  return {
    pr: prData,
    files: codeFiles,
    repository: {
      name: prData.base.repo.full_name,
      language: prData.base.repo.language || 'Unknown',
      isPrivate: prData.base.repo.private
    }
  };
}