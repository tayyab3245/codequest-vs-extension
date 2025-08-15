import { expect } from 'chai';
import { buildDashboardHtml } from '../../src/webview/html';
import * as fs from 'fs';
import * as path from 'path';

describe('Preview Mode Features', () => {
  const mockOptions = {
    cssUri: 'vscode-webview://123/media/dashboard.css',
    jsUri: 'vscode-webview://123/media/dashboard.js',
    cspSource: 'vscode-webview://123',
    nonce: 'test-nonce-123'
  };

  let html: string;
  let packageJson: any;

  beforeEach(() => {
    html = buildDashboardHtml(mockOptions);
    
    const packagePath = path.join(__dirname, '..', '..', 'package.json');
    const content = fs.readFileSync(packagePath, 'utf8');
    packageJson = JSON.parse(content);
  });

  describe('HTML elements', () => {
    it('should include previewBanner element', () => {
      expect(html).to.include('id="previewBanner"');
      expect(html).to.include('<div id="previewBanner" class="status-message hidden" role="status" aria-live="polite" aria-atomic="true">');
    });

    it('should include accessibility attributes on previewBanner', () => {
      expect(html).to.include('role="status"');
      expect(html).to.include('aria-live="polite"');
      expect(html).to.include('aria-atomic="true"');
    });

    it('should include accessibility attributes on statusMessage', () => {
      expect(html).to.include('id="statusMessage"');
      expect(html).to.include('<div id="statusMessage" class="status-message hidden" role="status" aria-live="polite">');
    });

    it('should include exitPreview button', () => {
      expect(html).to.include('id="exitPreview"');
      expect(html).to.include('<button id="exitPreview" class="command-btn hidden">Exit Preview</button>');
    });

    it('should have previewBanner positioned before command-grid', () => {
      const bannerIndex = html.indexOf('id="previewBanner"');
      // Find the Commands section and then its command-grid
      const commandsCardStart = html.indexOf('<h2>Commands</h2>');
      const gridIndex = html.indexOf('class="command-grid"', commandsCardStart);
      expect(bannerIndex).to.be.greaterThan(-1);
      expect(gridIndex).to.be.greaterThan(-1);
      expect(bannerIndex).to.be.lessThan(gridIndex);
    });

    it('should have exitPreview as last button in the commands card', () => {
      // Look for exitPreview after importLegacy within the Commands section
      const commandsCardStart = html.indexOf('<h2>Commands</h2>');
      const importIndex = html.indexOf('id="importLegacy"', commandsCardStart);
      const exitIndex = html.indexOf('id="exitPreview"', commandsCardStart);
      expect(importIndex).to.be.greaterThan(-1);
      expect(exitIndex).to.be.greaterThan(-1);
      expect(exitIndex).to.be.greaterThan(importIndex);
    });
  });

  describe('command contributions', () => {
    it('should include expected commands including newProblem', () => {
      const commands = packageJson.contributes?.commands || [];
      const commandIds = commands.map((cmd: any) => cmd.command);
      
      const expectedCommands = [
        'codequest.startSession',
        'codequest.endSession',
        'codequest.markSolved',
        'codequest.importLegacy',
        'codequest.previewUiState',
        'codequest.newProblem',
        'codequest.openNextUnsolved'
      ];
      
      expect(commandIds).to.have.members(expectedCommands);
      expect(commandIds).to.have.length(expectedCommands.length);
    });
  });
});
