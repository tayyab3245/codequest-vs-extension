import { expect } from 'chai';

// Import the renderer functions
const { escapeHtml, renderProblemDetails } = require('../../src/lib/dashboardRenderer.js');

describe('Dashboard Renderer Security', () => {
  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).to.equal('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
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
    });

    it('should handle safe text without modification', () => {
      expect(escapeHtml('Safe text 123')).to.equal('Safe text 123');
    });

    it('should prevent tag injection', () => {
      const malicious = '<img src=x onerror=alert(1)>';
      const escaped = escapeHtml(malicious);
      expect(escaped).to.not.include('<img');
      expect(escaped).to.not.include('>');
      expect(escaped).to.equal('&lt;img src=x onerror=alert(1)&gt;');
    });
  });

  describe('renderProblemDetails', () => {
    it('should render null problem safely', () => {
      const html = renderProblemDetails(null);
      expect(html).to.include('No homework.js file open');
      expect(html).to.not.include('<script');
    });

    it('should render undefined problem safely', () => {
      const html = renderProblemDetails(undefined);
      expect(html).to.include('No homework.js file open');
    });

    it('should escape malicious problem data', () => {
      const maliciousProblem = {
        pattern: '<script>alert("xss")</script>',
        number: '<img src=x onerror=alert(1)>',
        name: '"><script>evil()</script>',
        date: "'><svg onload=alert(2)>",
        difficulty: 'Easy'
      };

      const html = renderProblemDetails(maliciousProblem);

      // Verify no raw script tags or HTML injection (that could be executed)
      expect(html).to.not.include('<script>');
      expect(html).to.not.include('<img src=x onerror=');
      expect(html).to.not.include('<svg onload=');
      expect(html).to.not.include('javascript:');
      
      // Verify content is escaped
      expect(html).to.include('&lt;script&gt;');
      expect(html).to.include('&lt;img src=x');
      expect(html).to.include('&quot;&gt;&lt;script');
      expect(html).to.include('&#39;&gt;&lt;svg');
    });

    it('should render valid problem data correctly', () => {
      const validProblem = {
        pattern: 'Arrays And Hashing',
        number: '001',
        name: 'Two Sum',
        date: '2025-07-15',
        difficulty: 'Easy'
      };

      const html = renderProblemDetails(validProblem);

      expect(html).to.include('Arrays And Hashing');
      expect(html).to.include('001');
      expect(html).to.include('Two Sum');
      expect(html).to.include('2025-07-15');
      expect(html).to.include('Easy');
      expect(html).to.include('difficulty-easy');
      expect(html).to.include('problem-details');
    });

    it('should handle special characters in valid data', () => {
      const problemWithSpecialChars = {
        pattern: 'Arrays & Hashing',
        number: '001',
        name: 'Two Sum "Advanced"',
        date: '2025-07-15',
        difficulty: 'Medium'
      };

      const html = renderProblemDetails(problemWithSpecialChars);

      expect(html).to.include('Arrays &amp; Hashing');
      expect(html).to.include('Two Sum &quot;Advanced&quot;');
      expect(html).to.include('difficulty-medium');
    });

    it('should not create executable HTML elements', () => {
      const problemWithTags = {
        pattern: 'Arrays<script>',
        number: '001<img>',
        name: 'Two<iframe>Sum',
        date: '2025<style>',
        difficulty: 'Easy<object>'
      };

      const html = renderProblemDetails(problemWithTags);

      // Verify no actual HTML tags are created (only escaped)
      expect(html).to.not.match(/<script[^>]*>/);
      expect(html).to.not.match(/<img[^>]*>/);
      expect(html).to.not.match(/<iframe[^>]*>/);
      expect(html).to.not.match(/<style[^>]*>/);
      expect(html).to.not.match(/<object[^>]*>/);
      
      // But escaped versions should be present
      expect(html).to.include('&lt;script&gt;');
      expect(html).to.include('&lt;img&gt;');
    });

    it('should maintain proper HTML structure', () => {
      const validProblem = {
        pattern: 'Test Pattern',
        number: '123',
        name: 'Test Problem',
        date: '2025-08-14',
        difficulty: 'Hard'
      };

      const html = renderProblemDetails(validProblem);

      // Verify proper structure is maintained
      expect(html).to.include('<div class="problem-details">');
      expect(html).to.include('<div class="problem-row">');
      expect(html).to.include('<span class="problem-label">');
      expect(html).to.include('<span class="problem-value">');
      expect(html).to.include('</div>');
    });
  });
});
