import { expect } from 'chai';
import { buildDashboardHtml, DashboardHtmlOptions } from '../../src/webview/html';

describe('Problems HTML Template', () => {
  const mockOptions: DashboardHtmlOptions = {
    cssUri: 'test-css-uri',
    jsUri: 'test-js-uri', 
    cspSource: 'test-csp-source',
    nonce: 'test-nonce'
  };

  it('should include Problems card section', () => {
    const html = buildDashboardHtml(mockOptions);
    
    // Check for Problems card container
    expect(html).to.include('<div class="card">');
    expect(html).to.include('<h2>Problems</h2>');
  });

  it('should include problems list container with accessibility attributes', () => {
    const html = buildDashboardHtml(mockOptions);
    
    // Check for problems list with proper ARIA attributes
    expect(html).to.include('<div id="problemsList"');
    expect(html).to.include('role="list"');
    expect(html).to.include('aria-busy="false"');
  });

  it('should include New Problem button with proper attributes', () => {
    const html = buildDashboardHtml(mockOptions);
    
    // Check for New Problem button with actual structure
    expect(html).to.include('<button id="newProblem"');
    expect(html).to.include('class="command-btn"');
    expect(html).to.include('>New Problem</button>');
  });

  it('should include Refresh Problems button with proper attributes', () => {
    const html = buildDashboardHtml(mockOptions);
    
    // Check for Refresh Problems button with actual structure
    expect(html).to.include('<button id="refreshProblems"');
    expect(html).to.include('class="command-btn"');
    expect(html).to.include('>Refresh</button>');
  });

  it('should maintain proper card structure order', () => {
    const html = buildDashboardHtml(mockOptions);
    
    // Extract cards in order by finding h2 headers
    const currentProblemIndex = html.indexOf('<h2>Current Problem</h2>');
    const problemsIndex = html.indexOf('<h2>Problems</h2>');
    const activityIndex = html.indexOf('<h2>Activity</h2>');
    const commandsIndex = html.indexOf('<h2>Commands</h2>');
    
    // Verify order: Current Problem -> Problems -> Activity -> Commands
    expect(currentProblemIndex).to.be.greaterThan(-1);
    expect(problemsIndex).to.be.greaterThan(currentProblemIndex);
    expect(activityIndex).to.be.greaterThan(problemsIndex);
    expect(commandsIndex).to.be.greaterThan(activityIndex);
    
    // Assert presence of Activity card elements
    expect(html).to.include('<div id="sessionTimer"');
    expect(html).to.include('<div id="calendarHeatmap"');
  });

  it('should include button container with proper spacing', () => {
    const html = buildDashboardHtml(mockOptions);
    
    // Check for button container div (command-grid)
    expect(html).to.include('<div class="command-grid">');
  });

  it('should include empty state message container', () => {
    const html = buildDashboardHtml(mockOptions);
    
    // The empty state is handled by JavaScript, but container should be present
    expect(html).to.include('id="problemsList"');
  });

  it('should have complete HTML document structure', () => {
    const html = buildDashboardHtml(mockOptions);
    
    // Check for proper HTML document structure
    expect(html).to.include('<!DOCTYPE html>');
    expect(html).to.include('<html lang="en">');
    expect(html).to.include('<head>');
    expect(html).to.include('<body>');
    expect(html).to.include('</html>');
  });

  it('should include dashboard.js script', () => {
    const html = buildDashboardHtml(mockOptions);
    
    // Check for dashboard.js inclusion with actual URI
    expect(html).to.include('<script nonce="test-nonce" src="test-js-uri"></script>');
  });

  it('should include dashboard.css styles', () => {
    const html = buildDashboardHtml(mockOptions);
    
    // Check for dashboard.css inclusion
    expect(html).to.include('<link rel="stylesheet" href="test-css-uri">');
  });

  it('should include Content Security Policy meta tag', () => {
    const html = buildDashboardHtml(mockOptions);
    
    // Check for CSP meta tag
    expect(html).to.include('<meta http-equiv="Content-Security-Policy"');
  });
});
