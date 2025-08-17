import { expect } from 'chai';
import { parseProblemPath, slugToName, inferDifficulty } from '../../src/lib/problemPath';

describe('Problem Path Parser', () => {
  describe('parseProblemPath', () => {
    it('should parse valid POSIX path', () => {
      const result = parseProblemPath('patterns/arrays-and-hashing/problem-001-two-sum/2025-07-15/homework.js');
      expect(result).to.deep.equal({
        pattern: 'Arrays And Hashing',
        number: '001',
        name: 'Two Sum',
        date: '2025-07-15',
        difficulty: 'Easy',
        key: 'patterns/arrays-and-hashing/problem-001-two-sum/2025-07-15/homework.js'
      });
    });

    it('should parse valid Windows path', () => {
      const result = parseProblemPath('patterns\\arrays-and-hashing\\problem-001-two-sum\\2025-07-15\\homework.js');
      expect(result).to.deep.equal({
        pattern: 'Arrays And Hashing',
        number: '001',
        name: 'Two Sum',
        date: '2025-07-15',
        difficulty: 'Easy',
        key: 'patterns/arrays-and-hashing/problem-001-two-sum/2025-07-15/homework.js'
      });
    });

    it('should parse single digit problem number', () => {
      const result = parseProblemPath('patterns/arrays-and-hashing/problem-5-single-number/2025-07-20/homework.js');
      expect(result).to.deep.equal({
        pattern: 'Arrays And Hashing',
        number: '5',
        name: 'Single Number',
        date: '2025-07-20',
        difficulty: 'Medium', // 5 is > 3, so Medium for arrays-and-hashing
        key: 'patterns/arrays-and-hashing/problem-5-single-number/2025-07-20/homework.js'
      });
    });

    it('should handle triple digit problem numbers', () => {
      const result = parseProblemPath('patterns/dynamic-programming/problem-123-best-time-to-buy/2025-08-01/homework.js');
      expect(result).to.deep.equal({
        pattern: 'Dynamic Programming',
        number: '123',
        name: 'Best Time To Buy',
        date: '2025-08-01',
        difficulty: 'Medium', // 123 is > 2, so Medium for non-arrays/two-pointers
        key: 'patterns/dynamic-programming/problem-123-best-time-to-buy/2025-08-01/homework.js'
      });
    });

    it('should handle uppercase slugs', () => {
      const result = parseProblemPath('patterns/ARRAYS-AND-HASHING/problem-001-TWO-SUM/2025-07-15/homework.js');
      expect(result).to.deep.equal({
        pattern: 'ARRAYS AND HASHING',
        number: '001',
        name: 'TWO SUM',
        date: '2025-07-15',
        difficulty: 'Easy',
        key: 'patterns/ARRAYS-AND-HASHING/problem-001-TWO-SUM/2025-07-15/homework.js'
      });
    });

    it('should handle double hyphens in slug', () => {
      const result = parseProblemPath('patterns/arrays-and-hashing/problem-001-two--sum/2025-07-15/homework.js');
      expect(result).to.deep.equal({
        pattern: 'Arrays And Hashing',
        number: '001',
        name: 'Two  Sum',
        date: '2025-07-15',
        difficulty: 'Easy',
        key: 'patterns/arrays-and-hashing/problem-001-two--sum/2025-07-15/homework.js'
      });
    });

    it('should return null for non-matching files', () => {
      const result = parseProblemPath('patterns/arrays-and-hashing/solution.js');
      expect(result).to.be.null;
    });

    it('should return null for invalid date format', () => {
      const result = parseProblemPath('patterns/arrays-and-hashing/problem-001-two-sum/2025-7-15/homework.js');
      expect(result).to.be.null;
    });

    it('should return null for missing problem prefix', () => {
      const result = parseProblemPath('patterns/arrays-and-hashing/001-two-sum/2025-07-15/homework.js');
      expect(result).to.be.null;
    });

    it('should handle case insensitive matching', () => {
      const result = parseProblemPath('patterns/arrays-and-hashing/problem-001-two-sum/2025-07-15/HOMEWORK.JS');
      expect(result).to.not.be.null;
      expect(result?.name).to.equal('Two Sum');
    });

    it('should handle nested absolute paths', () => {
      const result = parseProblemPath('/home/user/workspace/patterns/arrays-and-hashing/problem-001-two-sum/2025-07-15/homework.js');
      expect(result).to.not.be.null;
      expect(result?.pattern).to.equal('Arrays And Hashing');
    });

    it('should handle Windows absolute paths', () => {
      const result = parseProblemPath('C:\\workspace\\patterns\\arrays-and-hashing\\problem-001-test\\2025-07-15\\homework.js');
      expect(result).to.not.be.null;
      expect(result?.pattern).to.equal('Arrays And Hashing');
    });
  });

  describe('slugToName', () => {
    it('should convert simple slug to title case', () => {
      const result = slugToName('arrays-and-hashing');
      expect(result).to.equal('Arrays And Hashing');
    });

    it('should handle single words', () => {
      const result = slugToName('sliding-window');
      expect(result).to.equal('Sliding Window');
    });

    it('should preserve existing case', () => {
      const result = slugToName('API-design');
      expect(result).to.equal('API Design');
    });

    it('should handle double hyphens', () => {
      const result = slugToName('two--pointers');
      expect(result).to.equal('Two  Pointers');
    });

    it('should handle empty string', () => {
      const result = slugToName('');
      expect(result).to.equal('');
    });
  });

  describe('inferDifficulty', () => {
    it('should classify arrays-and-hashing correctly', () => {
      expect(inferDifficulty('arrays-and-hashing', 1)).to.equal('Easy');   // <= 3
      expect(inferDifficulty('arrays-and-hashing', 5)).to.equal('Medium'); // 4-7
      expect(inferDifficulty('arrays-and-hashing', 15)).to.equal('Hard');  // > 7
    });

    it('should classify two-pointers correctly', () => {
      expect(inferDifficulty('two-pointers', 1)).to.equal('Easy');   // <= 3
      expect(inferDifficulty('two-pointers', 5)).to.equal('Medium'); // 4-7
      expect(inferDifficulty('two-pointers', 10)).to.equal('Hard');  // > 7
    });

    it('should classify other patterns correctly', () => {
      expect(inferDifficulty('dynamic-programming', 1)).to.equal('Easy');   // <= 2
      expect(inferDifficulty('graph', 5)).to.equal('Medium');               // > 2
      expect(inferDifficulty('unknown-pattern', 1)).to.equal('Easy');       // <= 2
    });

    it('should handle edge cases', () => {
      expect(inferDifficulty('', 1)).to.equal('Easy');                      // <= 2
      expect(inferDifficulty('arrays-and-hashing', 0)).to.equal('Easy');    // <= 3
      expect(inferDifficulty('arrays-and-hashing', -1)).to.equal('Easy');   // <= 3
    });
  });

  describe('edge cases and validation', () => {
    it('should handle undefined input', () => {
      const result = parseProblemPath(undefined);
      expect(result).to.be.null;
    });

    it('should handle empty string', () => {
      const result = parseProblemPath('');
      expect(result).to.be.null;
    });

    it('should handle paths with extra slashes', () => {
      const result = parseProblemPath('patterns//arrays-and-hashing//problem-001-two-sum//2025-07-15//homework.js');
      expect(result).to.be.null; // Should not match due to double slashes
    });

    it('should handle mixed separators', () => {
      const result = parseProblemPath('patterns/arrays-and-hashing\\problem-001-two-sum\\2025-07-15/homework.js');
      expect(result).to.not.be.null; // Should handle mixed separators
    });

    it('should require exact homework.js filename', () => {
      const result = parseProblemPath('patterns/arrays-and-hashing/problem-001-two-sum/2025-07-15/homework.ts');
      expect(result).to.be.null;
    });

    it('should validate date format strictly', () => {
      expect(parseProblemPath('patterns/test/problem-1-test/25-07-15/homework.js')).to.be.null;
      expect(parseProblemPath('patterns/test/problem-1-test/2025-7-15/homework.js')).to.be.null;
      expect(parseProblemPath('patterns/test/problem-1-test/2025-07-5/homework.js')).to.be.null;
    });
  });
});
