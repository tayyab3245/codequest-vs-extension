import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

describe('Renderer Parity', () => {
  it('should have identical escapeHtml functions in both src and media', () => {
    const srcPath = path.join(__dirname, '..', '..', 'src', 'lib', 'dashboardRenderer.js');
    const mediaPath = path.join(__dirname, '..', '..', 'media', 'dashboard.js');

    expect(fs.existsSync(srcPath)).to.be.true;
    expect(fs.existsSync(mediaPath)).to.be.true;

    const srcContent = fs.readFileSync(srcPath, 'utf8');
    const mediaContent = fs.readFileSync(mediaPath, 'utf8');

    // Extract escapeHtml function from both files
    const extractFunction = (content: string, functionName: string): string => {
      const regex = new RegExp(`function ${functionName}\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}`, 'g');
      const match = regex.exec(content);
      if (!match) {
        throw new Error(`Function ${functionName} not found`);
      }
      // Normalize whitespace for comparison
      return match[0].replace(/\s+/g, ' ').trim();
    };

    const srcEscapeHtml = extractFunction(srcContent, 'escapeHtml');
    const mediaEscapeHtml = extractFunction(mediaContent, 'escapeHtml');

    expect(srcEscapeHtml).to.equal(mediaEscapeHtml);
  });

  it('should have identical renderProblemDetails functions in both src and media', () => {
    const srcPath = path.join(__dirname, '..', '..', 'src', 'lib', 'dashboardRenderer.js');
    const mediaPath = path.join(__dirname, '..', '..', 'media', 'dashboard.js');

    const srcContent = fs.readFileSync(srcPath, 'utf8');
    const mediaContent = fs.readFileSync(mediaPath, 'utf8');

    // Extract renderProblemDetails function from both files
    const extractFunction = (content: string, functionName: string): string => {
      const regex = new RegExp(`function ${functionName}\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}`, 'g');
      const match = regex.exec(content);
      if (!match) {
        throw new Error(`Function ${functionName} not found`);
      }
      // Normalize whitespace for comparison
      return match[0].replace(/\s+/g, ' ').trim();
    };

    const srcRenderProblemDetails = extractFunction(srcContent, 'renderProblemDetails');
    const mediaRenderProblemDetails = extractFunction(mediaContent, 'renderProblemDetails');

    expect(srcRenderProblemDetails).to.equal(mediaRenderProblemDetails);
  });

  it('should have mirrored helper comments in both files', () => {
    const srcPath = path.join(__dirname, '..', '..', 'src', 'lib', 'dashboardRenderer.js');
    const mediaPath = path.join(__dirname, '..', '..', 'media', 'dashboard.js');

    const srcContent = fs.readFileSync(srcPath, 'utf8');
    const mediaContent = fs.readFileSync(mediaPath, 'utf8');

    const expectedComment = '// NOTE: mirrored helper; kept in sync by unit test.';
    
    expect(srcContent).to.include(expectedComment);
    expect(mediaContent).to.include(expectedComment);
  });

  it('should have identical filterProblems functions in both src and media', () => {
    const srcPath = path.join(__dirname, '..', '..', 'src', 'lib', 'dashboardRenderer.js');
    const mediaPath = path.join(__dirname, '..', '..', 'media', 'dashboard.js');

    const srcContent = fs.readFileSync(srcPath, 'utf8');
    const mediaContent = fs.readFileSync(mediaPath, 'utf8');

    // Extract filterProblems function from both files
    const extractFunction = (content: string, functionName: string): string => {
      const regex = new RegExp(`function ${functionName}\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\n\\}`, 'g');
      const match = regex.exec(content);
      if (!match) {
        throw new Error(`Function ${functionName} not found`);
      }
      // Normalize whitespace for comparison
      return match[0].replace(/\s+/g, ' ').trim();
    };

    const srcFilterProblems = extractFunction(srcContent, 'filterProblems');
    const mediaFilterProblems = extractFunction(mediaContent, 'filterProblems');

    expect(srcFilterProblems).to.equal(mediaFilterProblems);
  });
});
