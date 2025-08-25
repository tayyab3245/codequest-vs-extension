/**
 * CodeQuest - VS Code LeetCode Progress Tracker
 * 
 * Copyright (c) 2025 tayyab3245. All rights reserved.
 * 
 * This software is proprietary and confidential. Unauthorized reproduction,
 * distribution, or modification is strictly prohibited. See LICENSE file
 * for full terms and conditions.
 * 
 * @author tayyab3245
 * @license Proprietary
 */
export interface ProblemInfo {
  pattern: string;
  number: string;
  name: string;
  date: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  key: string;
}

export function parseProblemPath(filePath?: string): ProblemInfo | null {
  if (!filePath) {
    return null;
  }

  // Normalize path separators for consistent matching
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  // Regex that handles absolute paths and finds the patterns folder
  const regex = /.*patterns\/([^\/]+)\/problem-(\d+)-([^\/]+)\/(\d{4}-\d{2}-\d{2})\/homework\.js$/i;
  const match = normalizedPath.match(regex);

  if (!match) {
    return null;
  }

  const patternSlug = match[1];
  const num = match[2];
  const nameSlug = match[3];
  const date = match[4];

  // Convert slug to readable names
  const pattern = slugToName(patternSlug);
  const name = slugToName(nameSlug);
  const difficulty = inferDifficulty(patternSlug, parseInt(num, 10));

  // Create the key for tracking
  const key = `patterns/${patternSlug}/problem-${num}-${nameSlug}/${date}/homework.js`;

  return {
    pattern,
    number: num,
    name,
    date,
    difficulty,
    key
  };
}

export function slugToName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function inferDifficulty(patternSlug: string, num: number): 'Easy' | 'Medium' | 'Hard' {
  // Heuristic difficulty as specified
  if (patternSlug === 'arrays-and-hashing' || patternSlug === 'two-pointers') {
    if (num <= 3) return 'Easy';
    if (num <= 7) return 'Medium';
    return 'Hard';
  } else {
    if (num <= 2) return 'Easy';
    return 'Medium';
  }
}
