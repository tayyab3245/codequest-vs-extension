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
import { expect } from 'chai';

// Import the actual functions we want to test
const { escapeHtml, computePatternStats } = require('../dashboardRenderer.js');

describe('Renderer Helpers', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).to.equal('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(escapeHtml('Tom & Jerry')).to.equal('Tom &amp; Jerry');
      expect(escapeHtml("It's a 'quote' test")).to.equal('It&#39;s a &#39;quote&#39; test');
    });

    it('should handle XSS injection payloads safely', () => {
      const maliciousPayload = '<img src=x onerror=alert(1)>';
      const escaped = escapeHtml(maliciousPayload);
      expect(escaped).to.equal('&lt;img src=x onerror=alert(1)&gt;');
      // Check that dangerous HTML tags are escaped
      expect(escaped).to.not.include('<img');
      expect(escaped).to.not.include('<script');
      expect(escaped).to.not.include('<iframe');
      // Note: the text "onerror" and "alert" will still be present as escaped text
      expect(escaped).to.include('onerror'); // This is fine - it's just escaped text now
      expect(escaped).to.include('alert');   // This is fine - it's just escaped text now
    });

    it('should handle complex XSS attempts', () => {
      const payloads = [
        '<script>document.cookie="stolen"</script>',
        'javascript:alert("xss")',
        '<iframe src="javascript:alert(1)">',
        '<svg onload=alert(1)>',
        '"><script>alert(String.fromCharCode(88,83,83))</script>'
      ];

      payloads.forEach(payload => {
        const escaped = escapeHtml(payload);
        // Verify dangerous HTML tags are escaped
        expect(escaped).to.not.include('<script');
        expect(escaped).to.not.include('<iframe');
        expect(escaped).to.not.include('<svg');
        // Note: "javascript:", "onload", "onerror" will remain as escaped text content
        // which is safe because they're not executable anymore
      });
    });

    it('should escape individual characters correctly', () => {
      expect(escapeHtml('&')).to.equal('&amp;');
      expect(escapeHtml('<')).to.equal('&lt;');
      expect(escapeHtml('>')).to.equal('&gt;');
      expect(escapeHtml('"')).to.equal('&quot;');
      expect(escapeHtml("'")).to.equal('&#39;');
    });

    it('should handle null and undefined', () => {
      expect(escapeHtml(null)).to.equal('');
      expect(escapeHtml(undefined)).to.equal('');
    });

    it('should handle numbers and convert to string', () => {
      expect(escapeHtml(123)).to.equal('123');
      expect(escapeHtml(0)).to.equal('0');
      expect(escapeHtml(-456)).to.equal('-456');
    });

    it('should handle safe text without modification', () => {
      expect(escapeHtml('Hello World')).to.equal('Hello World');
      expect(escapeHtml('Test 123')).to.equal('Test 123');
      expect(escapeHtml('Safe text with numbers and spaces')).to.equal('Safe text with numbers and spaces');
    });

    it('should round-trip many special characters', () => {
      const testCases = [
        { input: 'a&b<c>d"e\'f', expected: 'a&amp;b&lt;c&gt;d&quot;e&#39;f' },
        { input: '<<>>', expected: '&lt;&lt;&gt;&gt;' },
        { input: '""""', expected: '&quot;&quot;&quot;&quot;' },
        { input: "''''", expected: '&#39;&#39;&#39;&#39;' },
        { input: '&&&', expected: '&amp;&amp;&amp;' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(escapeHtml(input)).to.equal(expected);
      });
    });
  });

  describe('computePatternStats', () => {
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
      
      // Should be sorted alphabetically
      expect(stats[0].pattern).to.equal('Arrays And Hashing');
      expect(stats[1].pattern).to.equal('Stack');
      expect(stats[2].pattern).to.equal('Two Pointers');
      
      // Check counts
      expect(stats[0]).to.deep.equal({
        pattern: 'Arrays And Hashing',
        total: 3,
        solved: 0
      });
      
      expect(stats[1]).to.deep.equal({
        pattern: 'Stack',
        total: 1,
        solved: 0
      });
      
      expect(stats[2]).to.deep.equal({
        pattern: 'Two Pointers',
        total: 2,
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
      
      // Verify alphabetical sorting
      expect(stats.map((s: any) => s.pattern)).to.deep.equal([
        'Arrays And Hashing',
        'Stack', 
        'Two Pointers'
      ]);
      
      expect(stats[0]).to.deep.equal({
        pattern: 'Arrays And Hashing',
        total: 3,
        solved: 2
      });
      
      expect(stats[1]).to.deep.equal({
        pattern: 'Stack',
        total: 1,
        solved: 0
      });
      
      expect(stats[2]).to.deep.equal({
        pattern: 'Two Pointers',
        total: 2,
        solved: 1
      });
    });

    it('should compute correct stats with all problems solved', () => {
      const solvedKeys = mockProblems.map(p => p.key);
      const stats = computePatternStats(mockProblems, solvedKeys);
      
      expect(stats).to.have.length(3);
      
      stats.forEach((stat: any) => {
        expect(stat.solved).to.equal(stat.total);
        expect(stat.solved).to.be.greaterThan(0);
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

    it('should sort patterns alphabetically for deterministic UI', () => {
      // Test with patterns that would be out of order without sorting
      const unorderedProblems = [
        { pattern: 'Zzz Last Pattern', key: 'key1' },
        { pattern: 'Aaa First Pattern', key: 'key2' },
        { pattern: 'Mmm Middle Pattern', key: 'key3' }
      ];
      
      const stats = computePatternStats(unorderedProblems, []);
      
      expect(stats.map((s: any) => s.pattern)).to.deep.equal([
        'Aaa First Pattern',
        'Mmm Middle Pattern',
        'Zzz Last Pattern'
      ]);
    });

    it('should handle problems without keys gracefully', () => {
      const problemsWithMissingKeys = [
        { pattern: 'Test Pattern', key: 'valid-key' },
        { pattern: 'Test Pattern' }, // Missing key
        { pattern: 'Test Pattern', key: null }, // Null key
        { pattern: 'Test Pattern', key: '' } // Empty key
      ];
      
      const stats = computePatternStats(problemsWithMissingKeys, ['valid-key']);
      
      expect(stats).to.have.length(1);
      expect(stats[0]).to.deep.equal({
        pattern: 'Test Pattern',
        total: 4, // All problems counted
        solved: 1 // Only the one with valid key can be marked solved
      });
    });

    it('should ignore solved keys that do not match any problems', () => {
      const stats = computePatternStats(mockProblems, [
        mockProblems[0].key,
        'patterns/nonexistent/problem-999/2025-01-01/homework.js',
        'invalid-key'
      ]);
      
      const arraysStats = stats.find((s: any) => s.pattern === 'Arrays And Hashing');
      expect(arraysStats?.solved).to.equal(1); // Only the valid key counts
    });
  });
});
