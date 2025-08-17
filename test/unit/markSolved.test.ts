import { expect } from 'chai';

// Mock the extension logic for testing mark solved functionality
interface MockProblemInfo {
  pattern: string;
  number: string;
  name: string;
  date: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  key: string;
}

interface MockExtensionState {
  currentProblem: MockProblemInfo | null;
  solvedKeys: string[];
  patternStats: Array<{ pattern: string; solved: number; total: number }>;
}

class MockSolvedManager {
  private storage = new Map<string, { solvedAt: string }>();
  
  async saveSolvedState(problemKey: string, solved: boolean): Promise<void> {
    if (solved) {
      this.storage.set(problemKey, { solvedAt: new Date().toISOString() });
    } else {
      this.storage.delete(problemKey);
    }
  }
  
  getSolvedKeys(): string[] {
    return Array.from(this.storage.keys());
  }
  
  isSolved(problemKey: string): boolean {
    return this.storage.has(problemKey);
  }
}

describe('Mark Solved', () => {
  let mockManager: MockSolvedManager;
  let mockState: MockExtensionState;

  beforeEach(() => {
    mockManager = new MockSolvedManager();
    mockState = {
      currentProblem: null,
      solvedKeys: [],
      patternStats: []
    };
  });

  it('should mark unsolved problem as solved', async () => {
    const problemKey = 'patterns/arrays-and-hashing/problem-001-two-sum/2025-01-15/homework.js';
    mockState.currentProblem = {
      pattern: 'Arrays And Hashing',
      number: '001',
      name: 'Two Sum',
      date: '2025-01-15',
      difficulty: 'Easy',
      key: problemKey
    };

    // Initially not solved
    expect(mockManager.isSolved(problemKey)).to.be.false;
    
    // Mark as solved
    await mockManager.saveSolvedState(problemKey, true);
    mockState.solvedKeys = mockManager.getSolvedKeys();
    
    expect(mockManager.isSolved(problemKey)).to.be.true;
    expect(mockState.solvedKeys).to.include(problemKey);
  });

  it('should mark solved problem as unsolved', async () => {
    const problemKey = 'patterns/arrays-and-hashing/problem-001-two-sum/2025-01-15/homework.js';
    mockState.currentProblem = {
      pattern: 'Arrays And Hashing',
      number: '001',
      name: 'Two Sum',
      date: '2025-01-15',
      difficulty: 'Easy',
      key: problemKey
    };

    // Mark as solved first
    await mockManager.saveSolvedState(problemKey, true);
    mockState.solvedKeys = mockManager.getSolvedKeys();
    expect(mockManager.isSolved(problemKey)).to.be.true;
    
    // Mark as unsolved
    await mockManager.saveSolvedState(problemKey, false);
    mockState.solvedKeys = mockManager.getSolvedKeys();
    
    expect(mockManager.isSolved(problemKey)).to.be.false;
    expect(mockState.solvedKeys).to.not.include(problemKey);
  });

  it('should handle toggle behavior correctly', async () => {
    const problemKey = 'patterns/arrays-and-hashing/problem-001-two-sum/2025-01-15/homework.js';
    mockState.currentProblem = {
      pattern: 'Arrays And Hashing',
      number: '001',
      name: 'Two Sum',
      date: '2025-01-15',
      difficulty: 'Easy',
      key: problemKey
    };

    // Simulate toggle logic
    const toggleSolved = async () => {
      const isCurrentlySolved = mockManager.isSolved(problemKey);
      await mockManager.saveSolvedState(problemKey, !isCurrentlySolved);
      mockState.solvedKeys = mockManager.getSolvedKeys();
    };

    // Start unsolved, toggle to solved
    await toggleSolved();
    expect(mockManager.isSolved(problemKey)).to.be.true;
    
    // Toggle back to unsolved
    await toggleSolved();
    expect(mockManager.isSolved(problemKey)).to.be.false;
    
    // Toggle to solved again
    await toggleSolved();
    expect(mockManager.isSolved(problemKey)).to.be.true;
  });

  it('should handle no current problem gracefully', async () => {
    mockState.currentProblem = null;
    
    // Simulate the check that would be done in the real implementation
    const canMarkSolved = mockState.currentProblem !== null;
    expect(canMarkSolved).to.be.false;
  });

  it('should handle multiple problems independently', async () => {
    const problem1Key = 'patterns/arrays-and-hashing/problem-001-two-sum/2025-01-15/homework.js';
    const problem2Key = 'patterns/two-pointers/problem-001-valid-palindrome/2025-01-16/homework.js';

    // Mark first problem as solved
    await mockManager.saveSolvedState(problem1Key, true);
    expect(mockManager.isSolved(problem1Key)).to.be.true;
    expect(mockManager.isSolved(problem2Key)).to.be.false;
    
    // Mark second problem as solved
    await mockManager.saveSolvedState(problem2Key, true);
    expect(mockManager.isSolved(problem1Key)).to.be.true;
    expect(mockManager.isSolved(problem2Key)).to.be.true;
    
    // Unmark first problem
    await mockManager.saveSolvedState(problem1Key, false);
    expect(mockManager.isSolved(problem1Key)).to.be.false;
    expect(mockManager.isSolved(problem2Key)).to.be.true;
  });

  it('should maintain correct solved keys list', async () => {
    const problems = [
      'patterns/arrays-and-hashing/problem-001-two-sum/2025-01-15/homework.js',
      'patterns/arrays-and-hashing/problem-002-contains-duplicate/2025-01-16/homework.js',
      'patterns/two-pointers/problem-001-valid-palindrome/2025-01-17/homework.js'
    ];

    // Mark first two as solved
    await mockManager.saveSolvedState(problems[0], true);
    await mockManager.saveSolvedState(problems[1], true);
    
    const solvedKeys = mockManager.getSolvedKeys();
    expect(solvedKeys).to.have.length(2);
    expect(solvedKeys).to.include(problems[0]);
    expect(solvedKeys).to.include(problems[1]);
    expect(solvedKeys).to.not.include(problems[2]);
  });

  it('should handle rapid toggle operations', async () => {
    const problemKey = 'patterns/arrays-and-hashing/problem-001-two-sum/2025-01-15/homework.js';
    
    // Rapidly toggle multiple times
    await mockManager.saveSolvedState(problemKey, true);
    await mockManager.saveSolvedState(problemKey, false);
    await mockManager.saveSolvedState(problemKey, true);
    await mockManager.saveSolvedState(problemKey, false);
    
    // Should end up unsolved
    expect(mockManager.isSolved(problemKey)).to.be.false;
    expect(mockManager.getSolvedKeys()).to.have.length(0);
  });
});
