import { expect } from 'chai';
import * as crypto from 'crypto';
import { buildDashboardHtml } from '../../src/webview/html';

describe('Extension HTML Integration (Integrationless)', () => {
  describe('getHtmlForWebview equivalent behavior', () => {
    let mockCssUri: string;
    let mockJsUri: string;
    let mockCspSource: string;
    let mockNonce: string;

    beforeEach(() => {
      // Stub minimal inputs that mirror what the extension would provide
      mockCssUri = 'vscode-webview://some-id/media/dashboard.css';
      mockJsUri = 'vscode-webview://some-id/media/dashboard.js';
      mockCspSource = 'vscode-webview://some-id';
      mockNonce = crypto.randomBytes(16).toString('base64');
    });

    it('should generate HTML using the tested builder', () => {
      const html = buildDashboardHtml({
        cssUri: mockCssUri,
        jsUri: mockJsUri,
        cspSource: mockCspSource,
        nonce: mockNonce
      });

      // Verify we get a valid HTML string
      expect(html).to.be.a('string');
      expect(html.length).to.be.greaterThan(0);
    });

    it('should preserve CSP guarantees when wired through extension', () => {
      const html = buildDashboardHtml({
        cssUri: mockCssUri,
        jsUri: mockJsUri,
        cspSource: mockCspSource,
        nonce: mockNonce
      });

      // Shallow parity check with htmlCsp.test.ts guarantees
      expect(html).to.include('Content-Security-Policy');
      expect(html).to.include("default-src 'none'");
      expect(html).to.include(`script-src 'nonce-${mockNonce}'`);
      expect(html).to.not.include("'unsafe-inline'");
      expect(html).to.not.include("'unsafe-eval'");
    });

    it('should contain expected resource references passed to builder', () => {
      const html = buildDashboardHtml({
        cssUri: mockCssUri,
        jsUri: mockJsUri,
        cspSource: mockCspSource,
        nonce: mockNonce
      });

      // Verify the URIs passed to the builder are present in output
      expect(html).to.include(mockCssUri);
      expect(html).to.include(mockJsUri);
      expect(html).to.include(mockCspSource);
      expect(html).to.include(mockNonce);
    });

    it('should handle different URI formats correctly', () => {
      // Test with different URI patterns that VS Code might generate
      const alternativeCssUri = 'vscode-webview://authority-123/extension/media/dashboard.css';
      const alternativeJsUri = 'vscode-webview://authority-123/extension/media/dashboard.js';
      
      const html = buildDashboardHtml({
        cssUri: alternativeCssUri,
        jsUri: alternativeJsUri,
        cspSource: mockCspSource,
        nonce: mockNonce
      });

      expect(html).to.include(alternativeCssUri);
      expect(html).to.include(alternativeJsUri);
      expect(html).to.include(`href="${alternativeCssUri}"`);
      expect(html).to.include(`src="${alternativeJsUri}"`);
    });

    it('should maintain nonce consistency across script references', () => {
      const html = buildDashboardHtml({
        cssUri: mockCssUri,
        jsUri: mockJsUri,
        cspSource: mockCspSource,
        nonce: mockNonce
      });

      // Count nonce occurrences - should appear in CSP and script tag
      const nonceMatches = html.match(new RegExp(mockNonce.replace(/[+/=]/g, '\\$&'), 'g'));
      expect(nonceMatches).to.not.be.null;
      expect(nonceMatches!.length).to.be.at.least(2); // CSP header + script nonce
    });

    it('should produce valid HTML structure for webview', () => {
      const html = buildDashboardHtml({
        cssUri: mockCssUri,
        jsUri: mockJsUri,
        cspSource: mockCspSource,
        nonce: mockNonce
      });

      // Basic HTML structure validation
      expect(html).to.match(/^<!DOCTYPE html>/);
      expect(html).to.include('<html lang="en">');
      expect(html).to.include('<head>');
      expect(html).to.include('<body>');
      expect(html).to.include('</html>');
      
      // Required meta tags
      expect(html).to.include('<meta charset="UTF-8">');
      expect(html).to.include('<meta name="viewport"');
      
      // CodeQuest-specific content
      expect(html).to.include('CodeQuest');
      expect(html).to.include('Dashboard');
    });

    it('should work with empty string URIs without breaking', () => {
      const html = buildDashboardHtml({
        cssUri: '',
        jsUri: '',
        cspSource: mockCspSource,
        nonce: mockNonce
      });

      // Should still produce valid HTML even with empty URIs
      expect(html).to.be.a('string');
      expect(html).to.include('<!DOCTYPE html>');
      expect(html).to.include(mockNonce);
      expect(html).to.include(mockCspSource);
    });

    it('should handle special characters in nonce correctly', () => {
      // Test with a nonce containing URL-safe base64 characters
      const specialNonce = 'ABC123+/=def';
      
      const html = buildDashboardHtml({
        cssUri: mockCssUri,
        jsUri: mockJsUri,
        cspSource: mockCspSource,
        nonce: specialNonce
      });

      expect(html).to.include(specialNonce);
      expect(html).to.include(`'nonce-${specialNonce}'`);
      expect(html).to.include(`nonce="${specialNonce}"`);
    });
  });
});
