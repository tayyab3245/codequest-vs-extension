import { expect } from 'chai';

interface MockProblemInfo {
  pattern: string;
  number: string;
  name: string;
  date: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  key: string;
}

// Mock implementation of next unsolved selection logic
class MockNextUnsolvedSelector {
  private problems: MockProblemInfo[] = [];
  private solvedKeys: Set<string> = new Set();

  setProblems(problems: MockProblemInfo[]): void {
    this.problems = problems;
  }

  setSolvedKeys(keys: string[]): void {
    this.solvedKeys = new Set(keys);
  }

  getUnsolvedProblems(): MockProblemInfo[] {
    return this.problems.filter(p => !this.solvedKeys.has(p.key));
  }

  getNextUnsolved(): MockProblemInfo | null {
    const unsolved = this.getUnsolvedProblems();
    return unsolved.length > 0 ? unsolved[0] : null;
  }

  getAllProblemsAreSolved(): boolean {
    return this.problems.length > 0 && this.getUnsolvedProblems().length === 0;
  }
}

describe('Next Unsolved', () => {
  let selector: MockNextUnsolvedSelector;

  beforeEach(() => {
    selector = new MockNextUnsolvedSelector();
  });

  it('should return first unsolved problem when none are solved', () => {
    const problems: MockProblemInfo[] = [
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
      }
    ];

    selector.setProblems(problems);
    selector.setSolvedKeys([]);

    const nextUnsolved = selector.getNextUnsolved();
    expect(nextUnsolved).to.not.be.null;
    expect(nextUnsolved?.key).to.equal(problems[0].key);
    expect(nextUnsolved?.name).to.equal('Two Sum');
  });

  it('should skip solved problems and return first unsolved', () => {
    const problems: MockProblemInfo[] = [
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
        pattern: 'Two Pointers',
        number: '001',
        name: 'Valid Palindrome',
        date: '2025-01-17',
        difficulty: 'Easy',
        key: 'patterns/two-pointers/problem-001-valid-palindrome/2025-01-17/homework.js'
      }
    ];

    selector.setProblems(problems);
    // Mark first problem as solved
    selector.setSolvedKeys([problems[0].key]);

    const nextUnsolved = selector.getNextUnsolved();
    expect(nextUnsolved).to.not.be.null;
    expect(nextUnsolved?.key).to.equal(problems[1].key);
    expect(nextUnsolved?.name).to.equal('Contains Duplicate');
  });

  it('should return null when all problems are solved', () => {
    const problems: MockProblemInfo[] = [
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
      }
    ];

    selector.setProblems(problems);
    // Mark all problems as solved
    selector.setSolvedKeys(problems.map(p => p.key));

    const nextUnsolved = selector.getNextUnsolved();
    expect(nextUnsolved).to.be.null;
    expect(selector.getAllProblemsAreSolved()).to.be.true;
  });

  it('should return null when no problems exist', () => {
    selector.setProblems([]);
    selector.setSolvedKeys([]);

    const nextUnsolved = selector.getNextUnsolved();
    expect(nextUnsolved).to.be.null;
    expect(selector.getAllProblemsAreSolved()).to.be.false;
  });

  it('should respect sort order and return first unsolved', () => {
    // Problems sorted by pattern, then number desc, then date desc (as per extension logic)
    const problems: MockProblemInfo[] = [
      {
        pattern: 'Arrays And Hashing',
        number: '003',
        name: 'Valid Anagram',
        date: '2025-01-18',
        difficulty: 'Easy',
        key: 'patterns/arrays-and-hashing/problem-003-valid-anagram/2025-01-18/homework.js'
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
        number: '001',
        name: 'Two Sum',
        date: '2025-01-15',
        difficulty: 'Easy',
        key: 'patterns/arrays-and-hashing/problem-001-two-sum/2025-01-15/homework.js'
      },
      {
        pattern: 'Two Pointers',
        number: '001',
        name: 'Valid Palindrome',
        date: '2025-01-17',
        difficulty: 'Easy',
        key: 'patterns/two-pointers/problem-001-valid-palindrome/2025-01-17/homework.js'
      }
    ];

    selector.setProblems(problems);
    // Mark first problem (Valid Anagram) as solved
    selector.setSolvedKeys([problems[0].key]);

    const nextUnsolved = selector.getNextUnsolved();
    expect(nextUnsolved).to.not.be.null;
    expect(nextUnsolved?.key).to.equal(problems[1].key);
    expect(nextUnsolved?.name).to.equal('Contains Duplicate');
  });

  it('should handle mixed solved states correctly', () => {
    const problems: MockProblemInfo[] = [
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
        pattern: 'Two Pointers',
        number: '001',
        name: 'Valid Palindrome',
        date: '2025-01-17',
        difficulty: 'Easy',
        key: 'patterns/two-pointers/problem-001-valid-palindrome/2025-01-17/homework.js'
      },
      {
        pattern: 'Stack',
        number: '001',
        name: 'Valid Parentheses',
        date: '2025-01-18',
        difficulty: 'Easy',
        key: 'patterns/stack/problem-001-valid-parentheses/2025-01-18/homework.js'
      }
    ];

    selector.setProblems(problems);
    // Mark first and third problems as solved
    selector.setSolvedKeys([problems[0].key, problems[2].key]);

    const nextUnsolved = selector.getNextUnsolved();
    expect(nextUnsolved).to.not.be.null;
    expect(nextUnsolved?.key).to.equal(problems[1].key);
    expect(nextUnsolved?.name).to.equal('Contains Duplicate');
  });

  it('should handle single problem correctly', () => {
    const problems: MockProblemInfo[] = [
      {
        pattern: 'Arrays And Hashing',
        number: '001',
        name: 'Two Sum',
        date: '2025-01-15',
        difficulty: 'Easy',
        key: 'patterns/arrays-and-hashing/problem-001-two-sum/2025-01-15/homework.js'
      }
    ];

    selector.setProblems(problems);
    selector.setSolvedKeys([]);

    const nextUnsolved = selector.getNextUnsolved();
    expect(nextUnsolved).to.not.be.null;
    expect(nextUnsolved?.key).to.equal(problems[0].key);

    // Mark it as solved
    selector.setSolvedKeys([problems[0].key]);
    const nextUnsolvedAfter = selector.getNextUnsolved();
    expect(nextUnsolvedAfter).to.be.null;
    expect(selector.getAllProblemsAreSolved()).to.be.true;
  });
});
