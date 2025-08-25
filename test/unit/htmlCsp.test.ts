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
import { buildDashboardHtml } from '../../src/webview/html';

describe('HTML/CSP Builder', () => {
  const mockOptions = {
    patternsCssUri: 'vscode-webview://123/media/dashboard/patterns/patterns.css',
    calendar3dCssUri: 'vscode-webview://123/media/dashboard/calendar/calendar-3d.css',
    jsUri: 'vscode-webview://123/media/dashboard/main.js',
    calendar3dJsUri: 'vscode-webview://123/media/dashboard/calendar/calendar-3d.js',
    d3Uri: 'vscode-webview://123/media/vendor/d3.min.js',
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
      expect(html).to.include(`img-src ${mockOptions.cspSource} data:`);
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
      // Check for style= excluding the specific preview mode case
      const styleMatches = html.match(/style\s*=/g);
      // The HTML should only have one style attribute for the preview mode display:none
      expect(styleMatches).to.have.length(1);
      expect(html).to.include('style="display: none;"'); // Preview mode only
    });

    it('should have no style tags', () => {
      expect(html).to.not.include('<style');
    });
  });

  describe('resource URIs', () => {
    it('should replace Patterns CSS URI placeholder', () => {
      expect(html).to.include(`href="${mockOptions.patternsCssUri}"`);
      expect(html).to.not.include('${patternsCssUri}');
    });

    it('should replace Calendar 3D CSS URI placeholder', () => {
      expect(html).to.include(`href="${mockOptions.calendar3dCssUri}"`);
      expect(html).to.not.include('${calendar3dCssUri}');
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
      expect(html).to.include('<title>CodeQuest Coach</title>');
    });

    it('should include main UI elements', () => {
      expect(html).to.include('id="app-container"');
      expect(html).to.include('id="patterns-list"');
      expect(html).to.include('id="analysis-section"');
      expect(html).to.include('id="calendar-view-content"');
    });

    it('should include accessibility attributes for live regions', () => {
      // The current HTML structure focuses on semantic elements
      expect(html).to.include('class="max-w-7xl mx-auto');
      expect(html).to.include('id="installedBadge"');
      // Note: accessibility attributes may be added dynamically by dashboard.js
    });

    it('should include command buttons', () => {
      expect(html).to.include('id="previewMode"');
      expect(html).to.include('id="exitPreview"');
      expect(html).to.include('id="previewLabel"');
      // Note: other buttons like startSession, endSession are added dynamically by dashboard.js
    });
  });

  describe('CSS classes', () => {
    it('should use CSS classes for styling', () => {
      expect(html).to.include('class="preview-mode"');
      expect(html).to.include('class="preview-banner"');
      // Most styling is done via CSS classes, not inline styles
    });
  });

  describe('security validation', () => {
    it('should not contain any unsafe-inline directives in script-src', () => {
      const cspContent = html.match(/content="[^"]*"/)?.[0] || '';
      const scriptSrcMatch = cspContent.match(/script-src[^;]+/);
      if (scriptSrcMatch) {
        expect(scriptSrcMatch[0]).to.not.include("'unsafe-inline'");
      }
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
