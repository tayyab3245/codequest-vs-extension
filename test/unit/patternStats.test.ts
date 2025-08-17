import { expect } from 'chai';

// Import the actual function we want to test
const { computePatternStats } = require('../../src/lib/dashboardRenderer.js');

interface MockProblemInfo {
  pattern: string;
  number: string;
  name: string;
  date: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  key: string;
}

describe('Pattern Stats', () => {
  const mockProblems: MockProblemInfo[] = [
    {
      pattern: 'Arrays And Hashing',
      number: '001',
      name: 'Two Sum',
      date: '2025-01-15',
      difficulty: 'Easy',
      key: 'patterns/arrays-and-hashing/problem-001-two-sum/2025-01-15/homework.js'
    },
    {
      pattern: 'Arrays And Hashing',
      number: '002',
      name: 'Contains Duplicate',
      date: '2025-01-16',
      difficulty: 'Easy',
      key: 'patterns/arrays-and-hashing/problem-002-contains-duplicate/2025-01-16/homework.js'
    },
    {
      pattern: 'Arrays And Hashing',
      number: '003',
      name: 'Valid Anagram',
      date: '2025-01-17',
      difficulty: 'Easy',
      key: 'patterns/arrays-and-hashing/problem-003-valid-anagram/2025-01-17/homework.js'
    },
    {
      pattern: 'Two Pointers',
      number: '001',
      name: 'Valid Palindrome',
      date: '2025-01-18',
      difficulty: 'Easy',
      key: 'patterns/two-pointers/problem-001-valid-palindrome/2025-01-18/homework.js'
    },
    {
      pattern: 'Two Pointers',
      number: '002',
      name: 'Two Sum II',
      date: '2025-01-19',
      difficulty: 'Medium',
      key: 'patterns/two-pointers/problem-002-two-sum-ii/2025-01-19/homework.js'
    },
    {
      pattern: 'Stack',
      number: '001',
      name: 'Valid Parentheses',
      date: '2025-01-20',
      difficulty: 'Easy',
      key: 'patterns/stack/problem-001-valid-parentheses/2025-01-20/homework.js'
    }
  ];

  it('should compute correct stats with no solved problems', () => {
    const stats = computePatternStats(mockProblems, []);
    
    expect(stats).to.have.length(3);
    
    const arraysStats = stats.find((s: any) => s.pattern === 'Arrays And Hashing');
    expect(arraysStats).to.deep.equal({
      pattern: 'Arrays And Hashing',
      total: 3,
      solved: 0
    });
    
    const pointersStats = stats.find((s: any) => s.pattern === 'Two Pointers');
    expect(pointersStats).to.deep.equal({
      pattern: 'Two Pointers',
      total: 2,
      solved: 0
    });
    
    const stackStats = stats.find((s: any) => s.pattern === 'Stack');
    expect(stackStats).to.deep.equal({
      pattern: 'Stack',
      total: 1,
      solved: 0
    });
  });

  it('should compute correct stats with some solved problems', () => {
    const solvedKeys = [
      mockProblems[0].key, // Arrays And Hashing - Two Sum
      mockProblems[2].key, // Arrays And Hashing - Valid Anagram
      mockProblems[3].key  // Two Pointers - Valid Palindrome
    ];
    
    const stats = computePatternStats(mockProblems, solvedKeys);
    
    expect(stats).to.have.length(3);
    
    const arraysStats = stats.find((s: any) => s.pattern === 'Arrays And Hashing');
    expect(arraysStats).to.deep.equal({
      pattern: 'Arrays And Hashing',
      total: 3,
      solved: 2
    });
    
    const pointersStats = stats.find((s: any) => s.pattern === 'Two Pointers');
    expect(pointersStats).to.deep.equal({
      pattern: 'Two Pointers',
      total: 2,
      solved: 1
    });
    
    const stackStats = stats.find((s: any) => s.pattern === 'Stack');
    expect(stackStats).to.deep.equal({
      pattern: 'Stack',
      total: 1,
      solved: 0
    });
  });

  it('should compute correct stats with all problems solved', () => {
    const solvedKeys = mockProblems.map(p => p.key);
    const stats = computePatternStats(mockProblems, solvedKeys);
    
    expect(stats).to.have.length(3);
    
    const arraysStats = stats.find((s: any) => s.pattern === 'Arrays And Hashing');
    expect(arraysStats).to.deep.equal({
      pattern: 'Arrays And Hashing',
      total: 3,
      solved: 3
    });
    
    const pointersStats = stats.find((s: any) => s.pattern === 'Two Pointers');
    expect(pointersStats).to.deep.equal({
      pattern: 'Two Pointers',
      total: 2,
      solved: 2
    });
    
    const stackStats = stats.find((s: any) => s.pattern === 'Stack');
    expect(stackStats).to.deep.equal({
      pattern: 'Stack',
      total: 1,
      solved: 1
    });
  });

  it('should handle empty problems list', () => {
    const stats = computePatternStats([], []);
    expect(stats).to.have.length(0);
  });

  it('should handle null/undefined problems', () => {
    expect(computePatternStats(null, [])).to.have.length(0);
    expect(computePatternStats(undefined, [])).to.have.length(0);
  });

  it('should handle single pattern with multiple problems', () => {
    const singlePatternProblems = mockProblems.filter(p => p.pattern === 'Arrays And Hashing');
    const solvedKeys = [singlePatternProblems[0].key, singlePatternProblems[2].key];
    
    const stats = computePatternStats(singlePatternProblems, solvedKeys);
    
    expect(stats).to.have.length(1);
    expect(stats[0]).to.deep.equal({
      pattern: 'Arrays And Hashing',
      total: 3,
      solved: 2
    });
  });

  it('should ignore solved keys that do not match any problems', () => {
    const solvedKeys = [
      mockProblems[0].key,
      'patterns/nonexistent/problem-999/2025-01-01/homework.js',
      'invalid-key'
    ];
    
    const stats = computePatternStats(mockProblems, solvedKeys);
    
    const arraysStats = stats.find((s: any) => s.pattern === 'Arrays And Hashing');
    expect(arraysStats.solved).to.equal(1); // Only the valid key counts
  });

  it('should sort patterns alphabetically', () => {
    const stats = computePatternStats(mockProblems, []);
    
    expect(stats.map((s: any) => s.pattern)).to.deep.equal([
      'Arrays And Hashing',
      'Stack', 
      'Two Pointers'
    ]);
  });
});
