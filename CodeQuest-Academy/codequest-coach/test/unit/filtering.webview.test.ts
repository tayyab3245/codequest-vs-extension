import { expect } from 'chai';

// Import the actual function we want to test
const { filterProblems } = require('../../src/lib/dashboardRenderer.js');

describe('Filtering Webview', () => {
  const mockProblems = [
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

  it('should show all problems when filter is "all"', () => {
    const solvedKeys = [mockProblems[0].key, mockProblems[2].key];
    const filtered = filterProblems(mockProblems, 'all', solvedKeys);
    
    expect(filtered).to.have.length(4);
    expect(filtered).to.deep.equal(mockProblems);
  });

  it('should show only unsolved problems when filter is "unsolved"', () => {
    const solvedKeys = [mockProblems[0].key, mockProblems[2].key]; // Mark first and third as solved
    const filtered = filterProblems(mockProblems, 'unsolved', solvedKeys);
    
    expect(filtered).to.have.length(2);
    expect(filtered[0].key).to.equal(mockProblems[1].key); // Contains Duplicate
    expect(filtered[1].key).to.equal(mockProblems[3].key); // Valid Parentheses
  });

  it('should show only solved problems when filter is "solved"', () => {
    const solvedKeys = [mockProblems[0].key, mockProblems[2].key]; // Mark first and third as solved
    const filtered = filterProblems(mockProblems, 'solved', solvedKeys);
    
    expect(filtered).to.have.length(2);
    expect(filtered[0].key).to.equal(mockProblems[0].key); // Two Sum
    expect(filtered[1].key).to.equal(mockProblems[2].key); // Valid Palindrome
  });

  it('should show empty list when filtering solved but none are solved', () => {
    const filtered = filterProblems(mockProblems, 'solved', []); // No problems solved
    expect(filtered).to.have.length(0);
  });

  it('should show empty list when filtering unsolved but all are solved', () => {
    const solvedKeys = mockProblems.map(p => p.key); // All problems solved
    const filtered = filterProblems(mockProblems, 'unsolved', solvedKeys);
    expect(filtered).to.have.length(0);
  });

  it('should handle no problems gracefully', () => {
    expect(filterProblems([], 'all', [])).to.have.length(0);
    expect(filterProblems([], 'solved', [])).to.have.length(0);
    expect(filterProblems([], 'unsolved', [])).to.have.length(0);
  });

  it('should handle null/undefined inputs gracefully', () => {
    expect(filterProblems(null, 'all', [])).to.have.length(0);
    expect(filterProblems(undefined, 'all', [])).to.have.length(0);
  });
});
