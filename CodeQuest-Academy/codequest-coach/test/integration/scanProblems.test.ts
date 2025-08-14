import { expect } from 'chai';
import * as path from 'path';
import * as fs from 'fs';

describe('Problem Scanning Integration', () => {
  const fixturesPath = path.join(__dirname, '../../test-fixtures/basic-workspace');

  describe('test fixtures validation', () => {
    it('should have test fixtures directory', () => {
      expect(fs.existsSync(fixturesPath)).to.be.true;
    });

    it('should contain expected homework.js files', () => {
      const expectedFiles = [
        'patterns/arrays-and-hashing/problem-001-two-sum/2025-07-15/homework.js',
        'patterns/arrays-and-hashing/problem-002-contains-duplicate/2025-07-16/homework.js',
        'patterns/two-pointers/problem-001-valid-palindrome/2025-07-17/homework.js'
      ];

      expectedFiles.forEach(file => {
        const fullPath = path.join(fixturesPath, file);
        expect(fs.existsSync(fullPath), `Expected file ${file} to exist`).to.be.true;
      });
    });
  });

  describe('file pattern matching', () => {
    function findHomeworkFiles(basePath: string): string[] {
      const results: string[] = [];
      
      function scanDirectory(dir: string) {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            scanDirectory(fullPath);
          } else if (item === 'homework.js') {
            // Convert to relative path and normalize separators
            const relativePath = path.relative(basePath, fullPath);
            results.push(relativePath.replace(/\\/g, '/'));
          }
        }
      }

      scanDirectory(basePath);
      return results;
    }

    it('should find exactly 3 homework.js files in fixtures', () => {
      const files = findHomeworkFiles(fixturesPath);
      expect(files).to.have.length(3);
    });

    it('should find files matching the expected pattern', () => {
      const files = findHomeworkFiles(fixturesPath);
      const patternRegex = /^patterns\/[^\/]+\/problem-\d+-[^\/]+\/\d{4}-\d{2}-\d{2}\/homework\.js$/;
      
      files.forEach(file => {
        expect(file, `File ${file} should match pattern`).to.match(patternRegex);
      });
    });

    it('should find files in both arrays-and-hashing and two-pointers patterns', () => {
      const files = findHomeworkFiles(fixturesPath);
      
      const arraysFiles = files.filter(f => f.includes('arrays-and-hashing'));
      const pointersFiles = files.filter(f => f.includes('two-pointers'));
      
      expect(arraysFiles).to.have.length(2);
      expect(pointersFiles).to.have.length(1);
    });

    it('should handle nested directory structure correctly', () => {
      const files = findHomeworkFiles(fixturesPath);
      
      // All files should have the correct depth (4 levels under patterns/)
      files.forEach(file => {
        const parts = file.split('/');
        expect(parts).to.have.length(5); // patterns/pattern/problem/date/homework.js
        expect(parts[0]).to.equal('patterns');
        expect(parts[4]).to.equal('homework.js');
      });
    });
  });

  describe('problem count simulation', () => {
    // This simulates what the VS Code workspace scanner would do
    function simulateWorkspaceScan(workspacePath: string): number {
      const files = findHomeworkFiles(workspacePath);
      return files.length;
    }

    function findHomeworkFiles(basePath: string): string[] {
      const results: string[] = [];
      
      function scanDirectory(dir: string) {
        try {
          const items = fs.readdirSync(dir);
          
          for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
              scanDirectory(fullPath);
            } else if (item === 'homework.js') {
              results.push(fullPath);
            }
          }
        } catch (error) {
          // Ignore permission errors or missing directories
        }
      }

      scanDirectory(basePath);
      return results;
    }

    it('should count exactly 3 problems in basic workspace', () => {
      const count = simulateWorkspaceScan(fixturesPath);
      expect(count).to.equal(3);
    });

    it('should return 0 for non-existent workspace', () => {
      const count = simulateWorkspaceScan('/non/existent/path');
      expect(count).to.equal(0);
    });

    it('should return 0 for empty workspace', () => {
      const emptyPath = path.join(__dirname, '../../test-fixtures/empty-workspace');
      
      // Create empty workspace for test
      if (!fs.existsSync(emptyPath)) {
        fs.mkdirSync(emptyPath, { recursive: true });
      }
      
      const count = simulateWorkspaceScan(emptyPath);
      expect(count).to.equal(0);
    });
  });

  describe('cross-platform path handling', () => {
    it('should normalize Windows and POSIX paths consistently', () => {
      const windowsPath = 'patterns\\\\arrays-and-hashing\\\\problem-001-test\\\\2025-07-15\\\\homework.js';
      const posixPath = 'patterns/arrays-and-hashing/problem-001-test/2025-07-15/homework.js';
      
      // Both should normalize to the same form
      const normalizedWindows = windowsPath.replace(/\\\\/g, '/');
      const normalizedPosix = posixPath;
      
      expect(normalizedWindows).to.equal(normalizedPosix);
    });

    it('should handle absolute paths correctly', () => {
      const files = findHomeworkFiles(fixturesPath);
      
      // All returned paths should be relative to workspace
      files.forEach(file => {
        expect(file, `File ${file} should not be absolute`).to.not.match(/^[A-Z]:|^\/|^\\/);
      });
    });

    function findHomeworkFiles(basePath: string): string[] {
      const results: string[] = [];
      
      function scanDirectory(dir: string) {
        try {
          const items = fs.readdirSync(dir);
          
          for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
              scanDirectory(fullPath);
            } else if (item === 'homework.js') {
              const relativePath = path.relative(basePath, fullPath);
              results.push(relativePath.replace(/\\/g, '/'));
            }
          }
        } catch (error) {
          // Ignore errors
        }
      }

      scanDirectory(basePath);
      return results;
    }
  });
});
