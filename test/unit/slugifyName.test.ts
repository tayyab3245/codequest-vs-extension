import { expect } from 'chai';

describe('Slugify Name', () => {
  // Simple helper function for testing
  function slugifyName(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove punctuation
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Collapse multiple hyphens
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  it('should trim whitespace', () => {
    expect(slugifyName('  Two Sum  ')).to.equal('two-sum');
  });

  it('should collapse spaces to single hyphens', () => {
    expect(slugifyName('Valid    Palindrome')).to.equal('valid-palindrome');
  });

  it('should remove punctuation', () => {
    expect(slugifyName('Contains Duplicate?')).to.equal('contains-duplicate');
    expect(slugifyName('3Sum (Medium)')).to.equal('3sum-medium');
    expect(slugifyName('Best Time to Buy & Sell Stock')).to.equal('best-time-to-buy-sell-stock');
  });

  it('should convert to lowercase', () => {
    expect(slugifyName('Two Sum')).to.equal('two-sum');
    expect(slugifyName('VALID PALINDROME')).to.equal('valid-palindrome');
    expect(slugifyName('MergeSort')).to.equal('mergesort');
  });

  it('should coalesce multiple hyphens', () => {
    expect(slugifyName('Test---Multiple---Hyphens')).to.equal('test-multiple-hyphens');
    expect(slugifyName('A--B--C')).to.equal('a-b-c');
  });

  it('should handle edge cases', () => {
    expect(slugifyName('')).to.equal('');
    expect(slugifyName('   ')).to.equal('');
    expect(slugifyName('---')).to.equal('');
    expect(slugifyName('A')).to.equal('a');
    expect(slugifyName('123')).to.equal('123');
  });

  it('should handle mixed alphanumeric and special characters', () => {
    expect(slugifyName('3Sum Problem!')).to.equal('3sum-problem');
    expect(slugifyName('2-Pointers Technique')).to.equal('2-pointers-technique');
    expect(slugifyName('Binary Search (Log N)')).to.equal('binary-search-log-n');
  });

  it('should preserve existing hyphens appropriately', () => {
    expect(slugifyName('two-pointers')).to.equal('two-pointers');
    expect(slugifyName('sliding-window-maximum')).to.equal('sliding-window-maximum');
  });
});
