import { expect } from 'chai';
import { parseProblemPath, slugToName, inferDifficulty } from '../problemPath';

describe('Problem Path Parser', () => {
  describe('parseProblemPath', () => {
    it('should parse valid POSIX path', () => {
      const result = parseProblemPath('patterns/arrays-and-hashing/problem-001-two-sum/2025-01-15/homework.js');
      expect(result).to.deep.equal({
        pattern: 'Arrays And Hashing',
        number: '001',
        name: 'Two Sum',
        date: '2025-01-15',
        difficulty: 'Easy',
        key: 'patterns/arrays-and-hashing/problem-001-two-sum/2025-01-15/homework.js'
      });
    });

    it('should parse valid Windows path', () => {
      const result = parseProblemPath('patterns\\two-pointers\\problem-042-valid-palindrome\\2025-01-16\\homework.js');
      expect(result).to.deep.equal({
        pattern: 'Two Pointers',
        number: '042',
        name: 'Valid Palindrome',
        date: '2025-01-16',
        difficulty: 'Hard', // 42 > 7, so Hard for two-pointers
        key: 'patterns/two-pointers/problem-042-valid-palindrome/2025-01-16/homework.js' // Note: normalized to forward slashes
      });
    });

    it('should handle complex problem names with multiple hyphens', () => {
      const result = parseProblemPath('patterns/dynamic-programming/problem-123-longest-increasing-subsequence/2025-02-01/homework.js');
      expect(result).to.deep.equal({
        pattern: 'Dynamic Programming',
        number: '123',
        name: 'Longest Increasing Subsequence',
        date: '2025-02-01',
        difficulty: 'Medium', // dynamic-programming (not arrays/two-pointers) with 123 > 2, so Medium
        key: 'patterns/dynamic-programming/problem-123-longest-increasing-subsequence/2025-02-01/homework.js'
      });
    });

    it('should return null for invalid paths', () => {
      expect(parseProblemPath('invalid/path/structure')).to.be.null;
      expect(parseProblemPath('patterns/invalid-pattern/not-a-problem/2025-01-01/homework.js')).to.be.null;
      expect(parseProblemPath('patterns/arrays-and-hashing/problem-001-two-sum/invalid-date/homework.js')).to.be.null;
      expect(parseProblemPath('patterns/arrays-and-hashing/problem-001-two-sum/2025-01-15/notmhomework.js')).to.be.null;
    });

    it('should return null for invalid date format', () => {
      // The regex pattern requires YYYY-MM-DD format but doesn't validate actual dates
      // These should return null because they don't match the regex pattern
      expect(parseProblemPath('patterns/arrays-and-hashing/problem-001-two-sum/25-01-01/homework.js')).to.be.null; // Wrong year format
      expect(parseProblemPath('patterns/arrays-and-hashing/problem-001-two-sum/invalid-date/homework.js')).to.be.null; // Not YYYY-MM-DD
      expect(parseProblemPath('patterns/arrays-and-hashing/problem-001-two-sum/2025-1-1/homework.js')).to.be.null; // Wrong month/day format
      
      // These match the regex pattern even though they're invalid dates
      const validPattern = parseProblemPath('patterns/arrays-and-hashing/problem-001-two-sum/2025-13-01/homework.js');
      expect(validPattern).to.not.be.null; // Matches pattern YYYY-MM-DD even if invalid date
      
      const validPattern2 = parseProblemPath('patterns/arrays-and-hashing/problem-001-two-sum/2025-01-32/homework.js');
      expect(validPattern2).to.not.be.null; // Matches pattern YYYY-MM-DD even if invalid date
    });

    it('should handle edge cases with paths', () => {
      expect(parseProblemPath('')).to.be.null;
      expect(parseProblemPath(undefined as any)).to.be.null;
      expect(parseProblemPath(null as any)).to.be.null;
    });

    it('should handle mixed separators', () => {
      const result = parseProblemPath('patterns\\arrays-and-hashing/problem-001-two-sum\\2025-01-15/homework.js');
      expect(result).to.not.be.null;
      expect(result?.pattern).to.equal('Arrays And Hashing');
    });
  });

  describe('slugToName', () => {
    it('should convert simple slug to title case', () => {
      expect(slugToName('two-sum')).to.equal('Two Sum');
      expect(slugToName('valid-palindrome')).to.equal('Valid Palindrome');
      expect(slugToName('contains-duplicate')).to.equal('Contains Duplicate');
    });

    it('should handle single words', () => {
      expect(slugToName('anagram')).to.equal('Anagram');
      expect(slugToName('word')).to.equal('Word');
    });

    it('should handle complex multi-word slugs', () => {
      expect(slugToName('longest-increasing-subsequence')).to.equal('Longest Increasing Subsequence');
      expect(slugToName('minimum-window-substring')).to.equal('Minimum Window Substring');
      expect(slugToName('merge-k-sorted-lists')).to.equal('Merge K Sorted Lists');
    });

    it('should handle edge cases', () => {
      expect(slugToName('')).to.equal('');
      expect(slugToName('a')).to.equal('A');
      expect(slugToName('a-b')).to.equal('A B');
    });

    it('should preserve existing case appropriately', () => {
      expect(slugToName('binary-search')).to.equal('Binary Search');
      expect(slugToName('dfs-traversal')).to.equal('Dfs Traversal');
    });
  });

  describe('inferDifficulty', () => {
    it('should classify arrays-and-hashing correctly', () => {
      expect(inferDifficulty('arrays-and-hashing', 1)).to.equal('Easy');   // <= 3
      expect(inferDifficulty('arrays-and-hashing', 3)).to.equal('Easy');   // <= 3  
      expect(inferDifficulty('arrays-and-hashing', 5)).to.equal('Medium'); // 4-7
      expect(inferDifficulty('arrays-and-hashing', 7)).to.equal('Medium'); // 4-7
      expect(inferDifficulty('arrays-and-hashing', 10)).to.equal('Hard');  // > 7
    });

    it('should classify two-pointers as Easy', () => {
      expect(inferDifficulty('two-pointers', 1)).to.equal('Easy');   // <= 3
      expect(inferDifficulty('two-pointers', 3)).to.equal('Easy');   // <= 3
      expect(inferDifficulty('two-pointers', 5)).to.equal('Medium'); // 4-7
      expect(inferDifficulty('two-pointers', 10)).to.equal('Hard');  // > 7
    });

    it('should classify sliding-window as Easy/Medium (num-based)', () => {
      expect(inferDifficulty('sliding-window', 1)).to.equal('Easy');   // <= 2
      expect(inferDifficulty('sliding-window', 2)).to.equal('Easy');   // <= 2
      expect(inferDifficulty('sliding-window', 3)).to.equal('Medium'); // > 2
      expect(inferDifficulty('sliding-window', 10)).to.equal('Medium'); // > 2
    });

    it('should classify stack as Easy/Medium (num-based)', () => {
      expect(inferDifficulty('stack', 1)).to.equal('Easy');    // <= 2
      expect(inferDifficulty('stack', 2)).to.equal('Easy');    // <= 2
      expect(inferDifficulty('stack', 5)).to.equal('Medium');  // > 2
    });

    it('should classify binary-search as Easy/Medium (num-based)', () => {
      expect(inferDifficulty('binary-search', 1)).to.equal('Easy');   // <= 2
      expect(inferDifficulty('binary-search', 2)).to.equal('Easy');   // <= 2
      expect(inferDifficulty('binary-search', 7)).to.equal('Medium'); // > 2
    });

    it('should classify linked-list as Easy/Medium (num-based)', () => {
      expect(inferDifficulty('linked-list', 1)).to.equal('Easy');    // <= 2
      expect(inferDifficulty('linked-list', 2)).to.equal('Easy');    // <= 2
      expect(inferDifficulty('linked-list', 8)).to.equal('Medium');  // > 2
    });

    it('should classify trees as Easy/Medium (num-based)', () => {
      expect(inferDifficulty('trees', 1)).to.equal('Easy');     // <= 2
      expect(inferDifficulty('trees', 2)).to.equal('Easy');     // <= 2
      expect(inferDifficulty('trees', 12)).to.equal('Medium');  // > 2
    });

    it('should classify tries as Easy/Medium (num-based)', () => {
      expect(inferDifficulty('tries', 1)).to.equal('Easy');   // <= 2
      expect(inferDifficulty('tries', 2)).to.equal('Easy');   // <= 2
      expect(inferDifficulty('tries', 3)).to.equal('Medium'); // > 2
    });

    it('should classify graphs as Easy/Medium (num-based)', () => {
      expect(inferDifficulty('graphs', 1)).to.equal('Easy');   // <= 2
      expect(inferDifficulty('graphs', 2)).to.equal('Easy');   // <= 2
      expect(inferDifficulty('graphs', 8)).to.equal('Medium'); // > 2
    });

    it('should classify advanced-graphs as Easy/Medium (num-based)', () => {
      expect(inferDifficulty('advanced-graphs', 1)).to.equal('Easy');   // <= 2
      expect(inferDifficulty('advanced-graphs', 2)).to.equal('Easy');   // <= 2
      expect(inferDifficulty('advanced-graphs', 5)).to.equal('Medium'); // > 2
    });

    it('should classify dynamic-programming as Easy/Medium (num-based)', () => {
      expect(inferDifficulty('dynamic-programming', 1)).to.equal('Easy');   // <= 2
      expect(inferDifficulty('dynamic-programming', 2)).to.equal('Easy');   // <= 2
      expect(inferDifficulty('dynamic-programming', 15)).to.equal('Medium'); // > 2
    });

    it('should classify greedy as Easy/Medium (num-based)', () => {
      expect(inferDifficulty('greedy', 1)).to.equal('Easy');   // <= 2
      expect(inferDifficulty('greedy', 2)).to.equal('Easy');   // <= 2
      expect(inferDifficulty('greedy', 6)).to.equal('Medium'); // > 2
    });

    it('should classify intervals as Easy/Medium (num-based)', () => {
      expect(inferDifficulty('intervals', 1)).to.equal('Easy');   // <= 2
      expect(inferDifficulty('intervals', 2)).to.equal('Easy');   // <= 2
      expect(inferDifficulty('intervals', 4)).to.equal('Medium'); // > 2
    });

    it('should classify backtracking as Easy/Medium (num-based)', () => {
      expect(inferDifficulty('backtracking', 1)).to.equal('Easy');   // <= 2
      expect(inferDifficulty('backtracking', 2)).to.equal('Easy');   // <= 2
      expect(inferDifficulty('backtracking', 9)).to.equal('Medium'); // > 2
    });

    it('should handle unknown patterns as Easy/Medium (num-based)', () => {
      expect(inferDifficulty('unknown-pattern', 1)).to.equal('Easy');   // <= 2
      expect(inferDifficulty('unknown-pattern', 2)).to.equal('Easy');   // <= 2
      expect(inferDifficulty('random-stuff', 5)).to.equal('Medium');    // > 2
      expect(inferDifficulty('', 1)).to.equal('Easy');                 // <= 2
    });

    it('should handle edge cases', () => {
      expect(inferDifficulty('arrays-and-hashing', 0)).to.equal('Easy');   // <= 3
      expect(inferDifficulty('stack', -1)).to.equal('Easy');               // <= 2
      expect(inferDifficulty('dynamic-programming', 1000)).to.equal('Medium'); // > 2
    });
  });
});
