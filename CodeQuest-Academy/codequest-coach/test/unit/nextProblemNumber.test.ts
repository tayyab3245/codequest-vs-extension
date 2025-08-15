import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Next Problem Number', () => {
  let tempDir: string;

  // Helper function matching the extension logic
  async function getNextProblemNumber(pattern: string, workspaceRoot: string): Promise<number> {
    try {
      const patternDir = path.join(workspaceRoot, 'patterns', pattern);
      
      try {
        const entries = await fs.promises.readdir(patternDir, { withFileTypes: true });
        const problemDirs = entries.filter(entry => 
          entry.isDirectory() && entry.name.startsWith('problem-')
        );

        let maxNumber = 0;
        for (const dir of problemDirs) {
          const match = dir.name.match(/^problem-(\d+)-/);
          if (match) {
            const number = parseInt(match[1], 10);
            if (number > maxNumber) {
              maxNumber = number;
            }
          }
        }

        return maxNumber + 1;
      } catch {
        // Directory doesn't exist, start with 1
        return 1;
      }
    } catch (error) {
      console.error('Error getting next problem number:', error);
      return 1;
    }
  }

  beforeEach(async () => {
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'codequest-test-'));
  });

  afterEach(async () => {
    // Clean up temp directory
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should return 1 for non-existent pattern directory', async () => {
    const result = await getNextProblemNumber('arrays-and-hashing', tempDir);
    expect(result).to.equal(1);
  });

  it('should return 1 for empty pattern directory', async () => {
    const patternDir = path.join(tempDir, 'patterns', 'arrays-and-hashing');
    await fs.promises.mkdir(patternDir, { recursive: true });
    
    const result = await getNextProblemNumber('arrays-and-hashing', tempDir);
    expect(result).to.equal(1);
  });

  it('should handle mixed problem number formats and return next sequential', async () => {
    const patternDir = path.join(tempDir, 'patterns', 'arrays-and-hashing');
    await fs.promises.mkdir(patternDir, { recursive: true });

    // Create directories with mixed formats
    await fs.promises.mkdir(path.join(patternDir, 'problem-001-two-sum'), { recursive: true });
    await fs.promises.mkdir(path.join(patternDir, 'problem-7-contains-duplicate'), { recursive: true });
    await fs.promises.mkdir(path.join(patternDir, 'problem-003-valid-anagram'), { recursive: true });
    await fs.promises.mkdir(path.join(patternDir, 'some-other-folder'), { recursive: true });

    const result = await getNextProblemNumber('arrays-and-hashing', tempDir);
    expect(result).to.equal(8); // Max is 7, so next is 8
  });

  it('should handle zero-padded problem numbers correctly', async () => {
    const patternDir = path.join(tempDir, 'patterns', 'two-pointers');
    await fs.promises.mkdir(patternDir, { recursive: true });

    // Create directories with zero-padded numbers
    await fs.promises.mkdir(path.join(patternDir, 'problem-001-valid-palindrome'), { recursive: true });
    await fs.promises.mkdir(path.join(patternDir, 'problem-002-two-sum-ii'), { recursive: true });
    await fs.promises.mkdir(path.join(patternDir, 'problem-010-container-with-most-water'), { recursive: true });

    const result = await getNextProblemNumber('two-pointers', tempDir);
    expect(result).to.equal(11); // Max is 10, so next is 11
  });

  it('should ignore non-problem directories', async () => {
    const patternDir = path.join(tempDir, 'patterns', 'stack');
    await fs.promises.mkdir(patternDir, { recursive: true });

    // Create mix of problem and non-problem directories
    await fs.promises.mkdir(path.join(patternDir, 'problem-001-valid-parentheses'), { recursive: true });
    await fs.promises.mkdir(path.join(patternDir, 'notes'), { recursive: true });
    await fs.promises.mkdir(path.join(patternDir, 'temp-problem-999'), { recursive: true });
    await fs.promises.mkdir(path.join(patternDir, 'problem-invalid-name'), { recursive: true });
    await fs.promises.mkdir(path.join(patternDir, 'problem-002-min-stack'), { recursive: true });

    const result = await getNextProblemNumber('stack', tempDir);
    expect(result).to.equal(3); // Only problem-001 and problem-002 count
  });

  it('should handle large problem numbers correctly', async () => {
    const patternDir = path.join(tempDir, 'patterns', 'graph');
    await fs.promises.mkdir(patternDir, { recursive: true });

    await fs.promises.mkdir(path.join(patternDir, 'problem-100-number-of-islands'), { recursive: true });
    await fs.promises.mkdir(path.join(patternDir, 'problem-200-course-schedule'), { recursive: true });

    const result = await getNextProblemNumber('graph', tempDir);
    expect(result).to.equal(201);
  });

  it('should return proper number after cleanup gaps', async () => {
    const patternDir = path.join(tempDir, 'patterns', 'binary-search');
    await fs.promises.mkdir(patternDir, { recursive: true });

    // Create non-sequential numbers (simulating deleted problems)
    await fs.promises.mkdir(path.join(patternDir, 'problem-001-binary-search'), { recursive: true });
    await fs.promises.mkdir(path.join(patternDir, 'problem-005-search-in-rotated'), { recursive: true });
    await fs.promises.mkdir(path.join(patternDir, 'problem-003-find-minimum'), { recursive: true });

    const result = await getNextProblemNumber('binary-search', tempDir);
    expect(result).to.equal(6); // Max is 5, next is 6 (doesn't fill gaps)
  });
});
