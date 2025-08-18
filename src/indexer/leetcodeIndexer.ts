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
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export type DifficultyBand = 1 | 2 | 3 | 4 | 5;

export interface IndexedProblem {
  slug: string;
  title: string;
  url: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  paidOnly: boolean;
  band: DifficultyBand;
  pattern: string;
}

export interface CatalogCache {
  version: '1';
  createdAt: string;
  lastIndexedAt?: string;
  problems: IndexedProblem[];
}

export interface TagPatternMap {
  version: string;
  mapping: Record<string, string[]>;
  difficultyBands: Record<string, DifficultyBand>;
}

export interface LeetCodeProblemStat {
  stat: {
    question_id: number;
    question_title: string;
    question_title_slug: string;
    total_acs: number;
    total_submitted: number;
    frontend_question_id: string;
    is_new_question: boolean;
  };
  status: string | null;
  difficulty: {
    level: number;
  };
  paid_only: boolean;
  is_favor: boolean;
  frequency: number;
  progress: number;
}

export interface LeetCodeApiResponse {
  user_name: string;
  num_solved: number;
  num_total: number;
  ac_easy: number;
  ac_medium: number;
  ac_hard: number;
  stat_status_pairs: LeetCodeProblemStat[];
}

export class LeetCodeIndexer {
  private context: vscode.ExtensionContext;
  private tagPatternMap: TagPatternMap = {
    version: '1',
    mapping: {},
    difficultyBands: { 'Easy': 1, 'Medium': 3, 'Hard': 5 }
  };
  private throttleMs: number;
  private isIndexing: boolean = false;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.throttleMs = vscode.workspace.getConfiguration('codequest.indexer').get('throttleMs', 750);
    this.loadTagPatternMap();
  }

  private loadTagPatternMap(): void {
    try {
      const mapPath = path.join(this.context.extensionPath, 'assets', 'tag-pattern-map.json');
      const mapContent = fs.readFileSync(mapPath, 'utf8');
      this.tagPatternMap = JSON.parse(mapContent);
    } catch (error) {
      console.error('Failed to load tag-pattern map:', error);
      // Fallback to basic mapping
      this.tagPatternMap = {
        version: '1',
        mapping: {
          'arrays-and-hashing': ['Array', 'Hash Table'],
          'two-pointers': ['Two Pointers'],
          'sliding-window': ['Sliding Window'],
          'stack': ['Stack'],
          'binary-search': ['Binary Search'],
          'dynamic-programming': ['Dynamic Programming'],
          'graph': ['Graph']
        },
        difficultyBands: { 'Easy': 1, 'Medium': 3, 'Hard': 5 }
      };
    }
  }

  public async buildCatalog(progress?: vscode.Progress<{ increment?: number; message?: string }>): Promise<void> {
    if (this.isIndexing) {
      throw new Error('Indexing already in progress');
    }

    const enabled = vscode.workspace.getConfiguration('codequest.indexer').get('enabled', false);
    if (!enabled) {
      const consent = await this.getIndexingConsent();
      if (!consent) {
        throw new Error('Indexing consent not granted');
      }
    }

    this.isIndexing = true;
    
    try {
      progress?.report({ message: 'Fetching problem metadata from LeetCode...' });
      
      const problems = await this.fetchProblemsMetadata();
      progress?.report({ increment: 50, message: `Processing ${problems.length} problems...` });
      
      const indexedProblems = this.processProblems(problems);
      progress?.report({ increment: 30, message: 'Saving to cache...' });
      
      await this.saveCatalogCache(indexedProblems);
      progress?.report({ increment: 20, message: 'Cache updated successfully!' });
      
      vscode.window.showInformationMessage(`Indexed ${indexedProblems.length} problems successfully!`);
    } catch (error) {
      console.error('Failed to build catalog:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Failed to build catalog: ${errorMessage}`);
      throw error;
    } finally {
      this.isIndexing = false;
    }
  }

  private async getIndexingConsent(): Promise<boolean> {
    const message = `CodeQuest will fetch problem metadata (titles, slugs, difficulty, tags) from LeetCode's public API. 
    
No problem statements or copyrighted content will be downloaded or stored. 
Only metadata necessary for pattern browsing will be cached locally.

Continue?`;

    const consent = await vscode.window.showWarningMessage(
      message,
      { modal: true },
      'Yes, Continue',
      'No, Cancel'
    );

    if (consent === 'Yes, Continue') {
      // Save consent for future use
      await vscode.workspace.getConfiguration('codequest.indexer').update('enabled', true, vscode.ConfigurationTarget.Global);
      return true;
    }

    return false;
  }

  private async fetchProblemsMetadata(): Promise<LeetCodeProblemStat[]> {
    try {
      // LeetCode's public API endpoint for problem statistics
      const response = await fetch('https://leetcode.com/api/problems/all/');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: LeetCodeApiResponse = await response.json();
      return data.stat_status_pairs || [];
    } catch (error) {
      console.error('Failed to fetch from LeetCode API:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Network error: ${errorMessage}`);
    }
  }

  private processProblems(problems: LeetCodeProblemStat[]): IndexedProblem[] {
    const processed: IndexedProblem[] = [];

    for (const problemStat of problems) {
      try {
        const problem = this.processSingleProblem(problemStat);
        if (problem) {
          processed.push(problem);
        }
      } catch (error) {
        console.warn(`Failed to process problem ${problemStat.stat.question_title_slug}:`, error);
      }
    }

    return processed;
  }

  private processSingleProblem(problemStat: LeetCodeProblemStat): IndexedProblem | null {
    const { stat, difficulty, paid_only } = problemStat;
    
    // Map difficulty level to string
    const difficultyMap: Record<number, string> = { 1: 'Easy', 2: 'Medium', 3: 'Hard' };
    const difficultyStr = difficultyMap[difficulty.level] as 'Easy' | 'Medium' | 'Hard';
    
    if (!difficultyStr) {
      console.warn(`Unknown difficulty level: ${difficulty.level} for ${stat.question_title_slug}`);
      return null;
    }

    // Get difficulty band
    const band = this.tagPatternMap.difficultyBands[difficultyStr] || 3;

    // For now, we'll assign patterns based on a simple heuristic since we don't have tags from this endpoint
    // In a real implementation, you might need to fetch individual problem details for tags
    const pattern = this.inferPatternFromTitle(stat.question_title);

    const url = `https://leetcode.com/problems/${stat.question_title_slug}/`;

    return {
      slug: stat.question_title_slug,
      title: stat.question_title,
      url: url,
      difficulty: difficultyStr,
      tags: [], // Would need additional API call to get tags
      paidOnly: paid_only,
      band: band,
      pattern: pattern
    };
  }

  private inferPatternFromTitle(title: string): string {
    const titleLower = title.toLowerCase();
    
    // Simple heuristics based on common problem titles
    if (titleLower.includes('array') || titleLower.includes('sum') || titleLower.includes('duplicate')) {
      return 'arrays-and-hashing';
    }
    if (titleLower.includes('palindrome') || titleLower.includes('pointer')) {
      return 'two-pointers';
    }
    if (titleLower.includes('window') || titleLower.includes('substring')) {
      return 'sliding-window';
    }
    if (titleLower.includes('parentheses') || titleLower.includes('stack') || titleLower.includes('bracket')) {
      return 'stack';
    }
    if (titleLower.includes('search') || titleLower.includes('binary') || titleLower.includes('sorted')) {
      return 'binary-search';
    }
    if (titleLower.includes('climb') || titleLower.includes('house') || titleLower.includes('coin') || titleLower.includes('path')) {
      return 'dynamic-programming';
    }
    if (titleLower.includes('island') || titleLower.includes('graph') || titleLower.includes('course') || titleLower.includes('clone')) {
      return 'graph';
    }
    
    // Default to arrays-and-hashing
    return 'arrays-and-hashing';
  }

  private async saveCatalogCache(problems: IndexedProblem[]): Promise<void> {
    const cache: CatalogCache = {
      version: '1',
      createdAt: new Date().toISOString(),
      lastIndexedAt: new Date().toISOString(),
      problems: problems
    };

    const cachePath = this.getCachePath();
    const cacheDir = path.dirname(cachePath);
    
    // Ensure directory exists
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
  }

  public loadCatalogCache(): CatalogCache | null {
    try {
      const cachePath = this.getCachePath();
      if (!fs.existsSync(cachePath)) {
        return null;
      }

      const cacheContent = fs.readFileSync(cachePath, 'utf8');
      const cache: CatalogCache = JSON.parse(cacheContent);
      
      // Validate cache version
      if (cache.version !== '1') {
        console.warn('Cache version mismatch, will rebuild');
        return null;
      }

      return cache;
    } catch (error) {
      console.error('Failed to load catalog cache:', error);
      return null;
    }
  }

  private getCachePath(): string {
    return path.join(this.context.globalStorageUri.fsPath, 'catalog.cache.json');
  }

  public isIndexingInProgress(): boolean {
    return this.isIndexing;
  }
}
