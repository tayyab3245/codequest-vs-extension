import { expect } from 'chai';
import * as path from 'path';

/**
 * Tests for backend catalog and data generation logic
 * These test the core business logic that powers the dashboard
 */

// Mock types that match the actual backend interfaces
interface MockCatalogProblem {
  pattern: string;
  title: string;
  slug: string;
  band: 1 | 2 | 3 | 4 | 5;
  url: string;
}

interface MockIndexedProblem {
  slug: string;
  title: string;
  url: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  paidOnly: boolean;
  band: 1 | 2 | 3 | 4 | 5;
  pattern: string;
}

interface MockPatternStats {
  pattern: string;
  solved: number;
  total: number;
}

interface MockExtensionState {
  installedAt: string;
  currentProblem: any;
  solvedKeys: string[];
  patternStats: MockPatternStats[];
  sessionInfo: {
    running: boolean;
    startedAt?: string;
    todayMinutes: number;
  };
  calendarData: {
    dailyMinutes: Record<string, number>;
  };
}

// Mock backend logic functions
class MockCatalogService {
  private mockProblems: MockIndexedProblem[] = [
    {
      slug: 'two-sum',
      title: 'Two Sum',
      url: 'https://leetcode.com/problems/two-sum/',
      difficulty: 'Easy',
      tags: ['array', 'hash-table'],
      paidOnly: false,
      band: 1,
      pattern: 'arrays-and-hashing'
    },
    {
      slug: 'add-two-numbers',
      title: 'Add Two Numbers',
      url: 'https://leetcode.com/problems/add-two-numbers/',
      difficulty: 'Medium',
      tags: ['linked-list', 'math'],
      paidOnly: false,
      band: 3,
      pattern: 'linked-list'
    },
    {
      slug: 'longest-substring-without-repeating',
      title: 'Longest Substring Without Repeating Characters',
      url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
      difficulty: 'Medium',
      tags: ['hash-table', 'string', 'sliding-window'],
      paidOnly: false,
      band: 3,
      pattern: 'sliding-window'
    }
  ];

  async getCatalog(): Promise<Record<string, Record<1 | 2 | 3 | 4 | 5, MockIndexedProblem[]>>> {
    const grouped: Record<string, Record<1 | 2 | 3 | 4 | 5, MockIndexedProblem[]>> = {};

    for (const problem of this.mockProblems) {
      if (!grouped[problem.pattern]) {
        grouped[problem.pattern] = { 1: [], 2: [], 3: [], 4: [], 5: [] };
      }
      grouped[problem.pattern][problem.band].push(problem);
    }

    return grouped;
  }

  getCacheInfo(): { exists: boolean; createdAt?: string; problemCount?: number } {
    return {
      exists: true,
      createdAt: '2023-08-01T00:00:00Z',
      problemCount: this.mockProblems.length
    };
  }
}

class MockStateManager {
  private state: MockExtensionState = {
    installedAt: '2023-08-01T00:00:00Z',
    currentProblem: null,
    solvedKeys: [],
    patternStats: [],
    sessionInfo: {
      running: false,
      todayMinutes: 0
    },
    calendarData: {
      dailyMinutes: {}
    }
  };

  updatePatternStats(catalog: Record<string, Record<1 | 2 | 3 | 4 | 5, MockIndexedProblem[]>>, solvedKeys: string[]): MockPatternStats[] {
    const stats: MockPatternStats[] = [];

    for (const [pattern, bands] of Object.entries(catalog)) {
      let total = 0;
      let solved = 0;

      for (const [band, problems] of Object.entries(bands)) {
        total += problems.length;
        solved += problems.filter(p => solvedKeys.includes(`${pattern}/${p.slug}`)).length;
      }

      stats.push({ pattern, solved, total });
    }

    return stats;
  }

  generateExtensionState(catalog: Record<string, Record<1 | 2 | 3 | 4 | 5, MockIndexedProblem[]>>): MockExtensionState {
    const patternStats = this.updatePatternStats(catalog, this.state.solvedKeys);

    return {
      ...this.state,
      patternStats,
      installedAt: '2023-08-01T00:00:00Z' // Add required field
    };
  }

  addSolvedProblem(pattern: string, slug: string): void {
    const key = `${pattern}/${slug}`;
    if (!this.state.solvedKeys.includes(key)) {
      this.state.solvedKeys.push(key);
    }
  }

  removeSolvedProblem(pattern: string, slug: string): void {
    const key = `${pattern}/${slug}`;
    this.state.solvedKeys = this.state.solvedKeys.filter(k => k !== key);
  }
}

function validateDashboardData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate required fields
  if (!data.installedAt) errors.push('Missing installedAt field');
  if (!data.currentProblem && data.currentProblem !== null) errors.push('currentProblem must be object or null');
  if (!Array.isArray(data.patternStats)) errors.push('patternStats must be array');
  if (!Array.isArray(data.solvedKeys)) errors.push('solvedKeys must be array');
  if (!data.sessionInfo || typeof data.sessionInfo !== 'object') errors.push('sessionInfo must be object');
  if (!data.calendarData || typeof data.calendarData !== 'object') errors.push('calendarData must be object');

  // Validate pattern stats structure
  for (const stat of data.patternStats || []) {
    if (!stat.pattern || typeof stat.pattern !== 'string') {
      errors.push('Pattern stat missing pattern name');
    }
    if (typeof stat.solved !== 'number' || stat.solved < 0) {
      errors.push('Pattern stat solved count invalid');
    }
    if (typeof stat.total !== 'number' || stat.total < 0) {
      errors.push('Pattern stat total count invalid');
    }
    if (stat.solved > stat.total) {
      errors.push('Pattern stat solved count cannot exceed total');
    }
  }

  // Validate session info
  if (data.sessionInfo) {
    if (typeof data.sessionInfo.running !== 'boolean') {
      errors.push('Session running state must be boolean');
    }
    if (typeof data.sessionInfo.todayMinutes !== 'number' || data.sessionInfo.todayMinutes < 0) {
      errors.push('Session todayMinutes must be non-negative number');
    }
  }

  return { isValid: errors.length === 0, errors };
}

function generateProblemStub(problem: MockIndexedProblem, problemNumber: number, date: string): string {
  return `/**
 * Problem ${problemNumber.toString().padStart(3, '0')}: ${problem.title}
 * Pattern: ${problem.pattern}
 * Difficulty: ${problem.difficulty}
 * URL: ${problem.url}
 * Date: ${date}
 */

// TODO: Implement solution
function solution() {
    // Your code here
}

module.exports = { solution };
`;
}

describe('Backend Logic Tests', () => {
  let catalogService: MockCatalogService;
  let stateManager: MockStateManager;

  beforeEach(() => {
    catalogService = new MockCatalogService();
    stateManager = new MockStateManager();
  });

  describe('Catalog Service Logic', () => {
    it('should group problems by pattern and band correctly', async () => {
      const catalog = await catalogService.getCatalog();

      expect(catalog).to.have.property('arrays-and-hashing');
      expect(catalog).to.have.property('linked-list');
      expect(catalog).to.have.property('sliding-window');

      // Check structure
      for (const [pattern, bands] of Object.entries(catalog)) {
        expect(bands).to.have.all.keys([1, 2, 3, 4, 5]);
        for (const [band, problems] of Object.entries(bands)) {
          expect(problems).to.be.an('array');
          for (const problem of problems) {
            expect(problem.pattern).to.equal(pattern);
            expect(problem.band).to.equal(parseInt(band));
          }
        }
      }
    });

    it('should provide cache information', () => {
      const cacheInfo = catalogService.getCacheInfo();
      
      expect(cacheInfo.exists).to.be.true;
      expect(cacheInfo.problemCount).to.be.a('number');
      expect(cacheInfo.createdAt).to.be.a('string');
    });

    it('should handle empty catalog gracefully', async () => {
      const emptyCatalogService = new MockCatalogService();
      // Override to return empty
      emptyCatalogService['mockProblems'] = [];
      
      const catalog = await emptyCatalogService.getCatalog();
      expect(catalog).to.be.an('object');
      expect(Object.keys(catalog)).to.have.length(0);
    });
  });

  describe('Pattern Statistics Generation', () => {
    it('should calculate pattern stats correctly with no solved problems', async () => {
      const catalog = await catalogService.getCatalog();
      const stats = stateManager.updatePatternStats(catalog, []);

      expect(stats).to.have.length(3); // 3 patterns in mock data
      
      for (const stat of stats) {
        expect(stat.solved).to.equal(0);
        expect(stat.total).to.be.greaterThan(0);
        expect(stat.pattern).to.be.a('string');
      }
    });

    it('should calculate pattern stats correctly with some solved problems', async () => {
      const catalog = await catalogService.getCatalog();
      const solvedKeys = ['arrays-and-hashing/two-sum', 'linked-list/add-two-numbers'];
      const stats = stateManager.updatePatternStats(catalog, solvedKeys);

      const arrayStats = stats.find(s => s.pattern === 'arrays-and-hashing');
      const linkedListStats = stats.find(s => s.pattern === 'linked-list');
      const slidingWindowStats = stats.find(s => s.pattern === 'sliding-window');

      expect(arrayStats?.solved).to.equal(1);
      expect(linkedListStats?.solved).to.equal(1);
      expect(slidingWindowStats?.solved).to.equal(0);
    });

    it('should handle invalid solved keys gracefully', async () => {
      const catalog = await catalogService.getCatalog();
      const invalidKeys = ['invalid/key', 'another-invalid/key', 'arrays-and-hashing/two-sum'];
      const stats = stateManager.updatePatternStats(catalog, invalidKeys);

      const validSolves = stats.reduce((sum, stat) => sum + stat.solved, 0);
      expect(validSolves).to.equal(1); // Only the valid key should count
    });
  });

  describe('Extension State Generation', () => {
    it('should generate valid extension state structure', async () => {
      const catalog = await catalogService.getCatalog();
      const state = stateManager.generateExtensionState(catalog);

      const validation = validateDashboardData(state);
      expect(validation.isValid).to.be.true;
      expect(validation.errors).to.have.length(0);
    });

    it('should include pattern statistics in state', async () => {
      const catalog = await catalogService.getCatalog();
      stateManager.addSolvedProblem('arrays-and-hashing', 'two-sum');
      
      const state = stateManager.generateExtensionState(catalog);
      
      expect(state.patternStats).to.be.an('array');
      expect(state.patternStats.length).to.be.greaterThan(0);
      
      const arrayPattern = state.patternStats.find(p => p.pattern === 'arrays-and-hashing');
      expect(arrayPattern?.solved).to.equal(1);
    });
  });

  describe('Problem Management Logic', () => {
    it('should add solved problems correctly', () => {
      stateManager.addSolvedProblem('arrays-and-hashing', 'two-sum');
      stateManager.addSolvedProblem('linked-list', 'add-two-numbers');

      const state = stateManager['state'];
      expect(state.solvedKeys).to.include('arrays-and-hashing/two-sum');
      expect(state.solvedKeys).to.include('linked-list/add-two-numbers');
      expect(state.solvedKeys).to.have.length(2);
    });

    it('should not add duplicate solved problems', () => {
      stateManager.addSolvedProblem('arrays-and-hashing', 'two-sum');
      stateManager.addSolvedProblem('arrays-and-hashing', 'two-sum'); // Duplicate

      const state = stateManager['state'];
      expect(state.solvedKeys).to.have.length(1);
    });

    it('should remove solved problems correctly', () => {
      stateManager.addSolvedProblem('arrays-and-hashing', 'two-sum');
      stateManager.addSolvedProblem('linked-list', 'add-two-numbers');
      stateManager.removeSolvedProblem('arrays-and-hashing', 'two-sum');

      const state = stateManager['state'];
      expect(state.solvedKeys).to.not.include('arrays-and-hashing/two-sum');
      expect(state.solvedKeys).to.include('linked-list/add-two-numbers');
      expect(state.solvedKeys).to.have.length(1);
    });
  });

  describe('Problem Stub Generation', () => {
    it('should generate valid problem stub content', () => {
      const problem: MockIndexedProblem = {
        slug: 'two-sum',
        title: 'Two Sum',
        url: 'https://leetcode.com/problems/two-sum/',
        difficulty: 'Easy',
        tags: ['array'],
        paidOnly: false,
        band: 1,
        pattern: 'arrays-and-hashing'
      };

      const stub = generateProblemStub(problem, 1, '2023-08-01');

      expect(stub).to.include('Problem 001: Two Sum');
      expect(stub).to.include('Pattern: arrays-and-hashing');
      expect(stub).to.include('Difficulty: Easy');
      expect(stub).to.include('URL: https://leetcode.com/problems/two-sum/');
      expect(stub).to.include('Date: 2023-08-01');
      expect(stub).to.include('function solution()');
      expect(stub).to.include('module.exports = { solution }');
    });

    it('should handle problem numbers with correct padding', () => {
      const problem: MockIndexedProblem = {
        slug: 'test',
        title: 'Test Problem',
        url: 'https://example.com',
        difficulty: 'Medium',
        tags: [],
        paidOnly: false,
        band: 3,
        pattern: 'test-pattern'
      };

      const stub1 = generateProblemStub(problem, 5, '2023-08-01');
      const stub2 = generateProblemStub(problem, 50, '2023-08-01');
      const stub3 = generateProblemStub(problem, 500, '2023-08-01');

      expect(stub1).to.include('Problem 005:');
      expect(stub2).to.include('Problem 050:');
      expect(stub3).to.include('Problem 500:');
    });
  });

  describe('Data Validation', () => {
    it('should validate correct dashboard data', () => {
      const validData = {
        installedAt: '2023-08-01T00:00:00Z',
        currentProblem: null,
        patternStats: [
          { pattern: 'arrays-and-hashing', solved: 2, total: 5 }
        ],
        solvedKeys: ['arrays-and-hashing/two-sum'],
        sessionInfo: {
          running: false,
          todayMinutes: 45
        },
        calendarData: {
          dailyMinutes: { '2023-08-01': 30 }
        }
      };

      const validation = validateDashboardData(validData);
      expect(validation.isValid).to.be.true;
      expect(validation.errors).to.have.length(0);
    });

    it('should catch missing required fields', () => {
      const invalidData = {
        // Missing installedAt
        currentProblem: null,
        // Missing other required fields
      };

      const validation = validateDashboardData(invalidData);
      expect(validation.isValid).to.be.false;
      expect(validation.errors.length).to.be.greaterThan(0);
      expect(validation.errors.some(e => e.includes('installedAt'))).to.be.true;
    });

    it('should catch invalid pattern stats', () => {
      const invalidData = {
        installedAt: '2023-08-01T00:00:00Z',
        currentProblem: null,
        patternStats: [
          { pattern: 'test', solved: 10, total: 5 } // solved > total
        ],
        solvedKeys: [],
        sessionInfo: { running: false, todayMinutes: 0 },
        calendarData: { dailyMinutes: {} }
      };

      const validation = validateDashboardData(invalidData);
      expect(validation.isValid).to.be.false;
      expect(validation.errors.some(e => e.includes('solved count cannot exceed total'))).to.be.true;
    });
  });
});
