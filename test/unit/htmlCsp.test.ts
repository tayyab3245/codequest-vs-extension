import { expect } from 'chai';
import { buildDashboardHtml } from '../../src/webview/html';

describe('HTML/CSP Builder', () => {
  const mockOptions = {
    cssUri: 'vscode-webview://123/media/dashboard.css',
    jsUri: 'vscode-webview://123/media/dashboard.js',
    cspSource: 'vscode-webview://123',
    nonce: 'test-nonce-123'
  };

  let html: string;

  beforeEach(() => {
    html = buildDashboardHtml(mockOptions);
  });

  describe('CSP header', () => {
    it('should include Content-Security-Policy meta tag', () => {
      expect(html).to.include('<meta http-equiv="Content-Security-Policy"');
    });

    it('should include default-src none', () => {
      expect(html).to.include("default-src 'none'");
    });

    it('should include correct CSP source for images', () => {
      expect(html).to.include(`img-src ${mockOptions.cspSource} https: data:`);
    });

    it('should include correct CSP source for styles', () => {
      expect(html).to.include(`style-src ${mockOptions.cspSource}`);
    });

    it('should include nonce-based script-src only', () => {
      expect(html).to.include(`script-src 'nonce-${mockOptions.nonce}'`);
    });

    it('should not include cspSource in script-src', () => {
      expect(html).to.not.include(`script-src ${mockOptions.cspSource} 'nonce-${mockOptions.nonce}'`);
    });
  });

  describe('nonce usage', () => {
    it('should have exactly one nonce in script tag', () => {
      const nonceMatches = html.match(/nonce="[^"]+"/g);
      expect(nonceMatches).to.have.length(1);
      expect(html).to.include(`nonce="${mockOptions.nonce}"`);
    });

    it('should apply nonce to script tag', () => {
      expect(html).to.include(`<script nonce="${mockOptions.nonce}" src="${mockOptions.jsUri}"></script>`);
    });
  });

  describe('inline content restrictions', () => {
    it('should have no inline script tags', () => {
      // Should not have <script> without src attribute or with inline content
      const inlineScriptRegex = /<script(?![^>]*src=)[^>]*>[\s\S]*?<\/script>/gi;
      const inlineScripts = html.match(inlineScriptRegex);
      expect(inlineScripts).to.be.null;
    });

    it('should have no style attributes', () => {
      expect(html).to.not.include('style=');
    });

    it('should have no style tags', () => {
      expect(html).to.not.include('<style');
    });
  });

  describe('resource URIs', () => {
    it('should replace CSS URI placeholder', () => {
      expect(html).to.include(`href="${mockOptions.cssUri}"`);
      expect(html).to.not.include('${cssUri}');
    });

    it('should replace JS URI placeholder', () => {
      expect(html).to.include(`src="${mockOptions.jsUri}"`);
      expect(html).to.not.include('${jsUri}');
    });

    it('should replace CSP source placeholder', () => {
      expect(html).to.include(mockOptions.cspSource);
      expect(html).to.not.include('${cspSource}');
    });

    it('should replace nonce placeholder', () => {
      expect(html).to.include(mockOptions.nonce);
      expect(html).to.not.include('${nonce}');
    });
  });

  describe('document structure', () => {
    it('should be valid HTML5', () => {
      expect(html).to.include('<!DOCTYPE html>');
      expect(html).to.include('<html lang="en">');
      expect(html).to.include('</html>');
    });

    it('should include required meta tags', () => {
      expect(html).to.include('<meta charset="UTF-8">');
      expect(html).to.include('<meta name="viewport"');
    });

    it('should include CodeQuest title', () => {
      expect(html).to.include('<title>CodeQuest Dashboard</title>');
    });

    it('should include main UI elements', () => {
      expect(html).to.include('id="workspacePath"');
      expect(html).to.include('id="problemCount"');
      expect(html).to.include('id="currentProblem"');
      expect(html).to.include('id="statusMessage"');
    });

    it('should include accessibility attributes for live regions', () => {
      expect(html).to.include('aria-live="polite"');
      expect(html).to.include('role="status"');
      // previewBanner, statusMessage, and patternStats should have aria-live
      expect(html.match(/aria-live="polite"/g)).to.have.length(3);
      // previewBanner and statusMessage should have role="status"
      expect(html.match(/role="status"/g)).to.have.length(2);
    });

    it('should include command buttons', () => {
      expect(html).to.include('id="startSession"');
      expect(html).to.include('id="endSession"');
      expect(html).to.include('id="markSolved"');
      expect(html).to.include('id="importLegacy"');
    });
  });

  describe('CSS classes', () => {
    it('should use hidden class instead of inline styles', () => {
      expect(html).to.include('class="status-message hidden"');
      expect(html).to.not.include('style="display: none"');
    });
  });

  describe('security validation', () => {
    it('should not contain any unsafe-inline directives', () => {
      expect(html).to.not.include("'unsafe-inline'");
    });

    it('should not contain any unsafe-eval directives', () => {
      expect(html).to.not.include("'unsafe-eval'");
    });

    it('should not contain javascript: URLs', () => {
      expect(html).to.not.include('javascript:');
    });

    it('should not contain data: URLs for scripts', () => {
      const scriptSrcMatch = html.match(/script-src[^;]+/);
      if (scriptSrcMatch) {
        expect(scriptSrcMatch[0]).to.not.include('data:');
      }
    });
  });
});
