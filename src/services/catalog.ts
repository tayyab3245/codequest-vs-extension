import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { LeetCodeIndexer, IndexedProblem, CatalogCache, DifficultyBand } from '../indexer/leetcodeIndexer';

// Legacy catalog types for backward compatibility
interface LegacyCatalogProblem {
  pattern: string;
  title: string;
  slug: string;
  band: DifficultyBand;
  url: string;
}

interface LegacyCatalog {
  version: string;
  problems: LegacyCatalogProblem[];
}

export class CatalogService {
  private context: vscode.ExtensionContext;
  private indexer: LeetCodeIndexer;
  private cachedCatalog: Record<string, Record<DifficultyBand, IndexedProblem[]>> | null = null;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.indexer = new LeetCodeIndexer(context);
  }

  public async getCatalog(): Promise<Record<string, Record<DifficultyBand, IndexedProblem[]>>> {
    if (this.cachedCatalog) {
      return this.cachedCatalog;
    }

    const catalogSource = vscode.workspace.getConfiguration('codequest.catalog').get('source', 'cache');
    
    let problems: IndexedProblem[] = [];

    if (catalogSource === 'cache') {
      // Try to load from cache first
      const cache = this.indexer.loadCatalogCache();
      if (cache && cache.problems.length > 0) {
        problems = cache.problems;
      } else {
        // Fall back to bundled catalog
        problems = await this.loadBundledCatalog();
      }
    } else {
      // Use bundled catalog
      problems = await this.loadBundledCatalog();
    }

    // Group problems by pattern and band
    this.cachedCatalog = this.groupProblems(problems);
    return this.cachedCatalog;
  }

  private async loadBundledCatalog(): Promise<IndexedProblem[]> {
    try {
      const catalogPath = path.join(this.context.extensionPath, 'assets', 'catalog.v1.json');
      const catalogContent = fs.readFileSync(catalogPath, 'utf8');
      const legacyCatalog: LegacyCatalog = JSON.parse(catalogContent);

      // Convert legacy format to new format
      return legacyCatalog.problems.map(problem => ({
        slug: problem.slug,
        title: problem.title,
        url: problem.url,
        difficulty: this.bandToDifficulty(problem.band),
        tags: [],
        paidOnly: false,
        band: problem.band,
        pattern: problem.pattern
      }));
    } catch (error) {
      console.error('Failed to load bundled catalog:', error);
      return [];
    }
  }

  private bandToDifficulty(band: DifficultyBand): 'Easy' | 'Medium' | 'Hard' {
    if (band <= 2) return 'Easy';
    if (band <= 4) return 'Medium';
    return 'Hard';
  }

  private groupProblems(problems: IndexedProblem[]): Record<string, Record<DifficultyBand, IndexedProblem[]>> {
    const grouped: Record<string, Record<DifficultyBand, IndexedProblem[]>> = {};

    for (const problem of problems) {
      if (!grouped[problem.pattern]) {
        grouped[problem.pattern] = { 1: [], 2: [], 3: [], 4: [], 5: [] };
      }
      grouped[problem.pattern][problem.band].push(problem);
    }

    return grouped;
  }

  public async buildCatalog(): Promise<void> {
    return vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Building Problem Catalog',
      cancellable: false
    }, async (progress) => {
      await this.indexer.buildCatalog(progress);
      // Clear cached catalog to force reload
      this.cachedCatalog = null;
    });
  }

  public async refreshCatalog(): Promise<void> {
    // For now, refresh is the same as build
    return this.buildCatalog();
  }

  public getCacheInfo(): { exists: boolean; createdAt?: string; problemCount?: number } {
    const cache = this.indexer.loadCatalogCache();
    if (cache) {
      return {
        exists: true,
        createdAt: cache.createdAt,
        problemCount: cache.problems.length
      };
    }
    return { exists: false };
  }

  public isIndexingEnabled(): boolean {
    return vscode.workspace.getConfiguration('codequest.indexer').get('enabled', false);
  }

  public isIndexingInProgress(): boolean {
    return this.indexer.isIndexingInProgress();
  }
}
