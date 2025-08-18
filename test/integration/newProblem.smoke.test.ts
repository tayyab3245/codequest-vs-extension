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
import * as vscode from 'vscode';
import { expect } from 'chai';
import * as path from 'path';
import * as fs from 'fs';

// Integration smoke test for the newProblem command flow
describe('Integration: newProblem Command Flow', () => {
  let workspaceDir: string;
  let extension: vscode.Extension<any>;

  before(async function() {
    this.timeout(10000);
    
    // Get the extension
    extension = vscode.extensions.getExtension('your-publisher.codequest-coach')!;
    if (!extension.isActive) {
      await extension.activate();
    }

    // Create a temporary workspace for testing
    const tmpDir = path.join(__dirname, '../../../test-tmp');
    workspaceDir = path.join(tmpDir, 'smoke-test-workspace');
    
    // Clean up any existing test workspace
    if (fs.existsSync(workspaceDir)) {
      fs.rmSync(workspaceDir, { recursive: true, force: true });
    }
    
    // Create workspace structure
    fs.mkdirSync(workspaceDir, { recursive: true });
    fs.mkdirSync(path.join(workspaceDir, 'patterns'), { recursive: true });
    
    // Open the workspace
    const workspaceUri = vscode.Uri.file(workspaceDir);
    await vscode.commands.executeCommand('vscode.openFolder', workspaceUri);
    
    // Wait for workspace to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  after(async function() {
    // Clean up test workspace
    if (fs.existsSync(workspaceDir)) {
      try {
        fs.rmSync(workspaceDir, { recursive: true, force: true });
      } catch (error) {
        console.warn('Failed to clean up test workspace:', error);
      }
    }
  });

  it('should create a new problem with valid structure', async function() {
    this.timeout(5000);
    
    // Execute the newProblem command
    const result = await vscode.commands.executeCommand('codequest.newProblem');
    
    // Verify command executed without throwing
    expect(result).to.not.be.undefined;
    
    // Wait for file system operations to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check that patterns directory exists
    const patternsDir = path.join(workspaceDir, 'patterns');
    expect(fs.existsSync(patternsDir)).to.be.true;
    
    // Look for created problem directories
    const patterns = fs.readdirSync(patternsDir).filter(name => 
      fs.statSync(path.join(patternsDir, name)).isDirectory()
    );
    
    // Should have at least one pattern directory
    expect(patterns.length).to.be.greaterThan(0);
    
    if (patterns.length > 0) {
      const patternDir = path.join(patternsDir, patterns[0]);
      const problems = fs.readdirSync(patternDir).filter(name => 
        name.startsWith('problem-') && 
        fs.statSync(path.join(patternDir, name)).isDirectory()
      );
      
      // Should have at least one problem directory
      expect(problems.length).to.be.greaterThan(0);
      
      if (problems.length > 0) {
        const problemDir = path.join(patternDir, problems[0]);
        const dates = fs.readdirSync(problemDir).filter(name => 
          fs.statSync(path.join(problemDir, name)).isDirectory()
        );
        
        // Should have at least one date directory
        expect(dates.length).to.be.greaterThan(0);
        
        if (dates.length > 0) {
          const homeworkFile = path.join(problemDir, dates[0], 'homework.js');
          
          // Should have created homework.js file
          expect(fs.existsSync(homeworkFile)).to.be.true;
          
          // Verify homework.js has some content
          const content = fs.readFileSync(homeworkFile, 'utf8');
          expect(content.length).to.be.greaterThan(0);
          expect(content).to.include('homework.js');
        }
      }
    }
  });

  it('should handle newProblem when no workspace is open', async function() {
    this.timeout(3000);
    
    // Close the current workspace
    await vscode.commands.executeCommand('workbench.action.closeFolder');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Try to execute newProblem without a workspace
    try {
      await vscode.commands.executeCommand('codequest.newProblem');
      // Should not throw, but may show an error message
    } catch (error) {
      // Command may fail gracefully, which is acceptable
      expect(error).to.be.an('error');
    }
    
    // Reopen workspace for cleanup
    const workspaceUri = vscode.Uri.file(workspaceDir);
    await vscode.commands.executeCommand('vscode.openFolder', workspaceUri);
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  it('should open the created homework.js file in editor', async function() {
    this.timeout(5000);
    
    // Get initial editor count
    const initialEditors = vscode.window.visibleTextEditors.length;
    
    // Execute newProblem command
    await vscode.commands.executeCommand('codequest.newProblem');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if a new editor was opened
    const currentEditors = vscode.window.visibleTextEditors.length;
    
    // Should have opened at least one new editor, or kept same count if reusing tab
    expect(currentEditors).to.be.at.least(initialEditors);
    
    // Check if any editor has a homework.js file open
    const homeworkEditors = vscode.window.visibleTextEditors.filter(editor => 
      editor.document.fileName.endsWith('homework.js')
    );
    
    expect(homeworkEditors.length).to.be.greaterThan(0);
    
    if (homeworkEditors.length > 0) {
      const editor = homeworkEditors[0];
      
      // Verify the document has content
      expect(editor.document.getText().length).to.be.greaterThan(0);
      
      // Verify it's a JavaScript file
      expect(editor.document.languageId).to.equal('javascript');
    }
  });

  it('should increment problem numbers correctly', async function() {
    this.timeout(8000);
    
    // Create multiple problems to test numbering
    await vscode.commands.executeCommand('codequest.newProblem');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    await vscode.commands.executeCommand('codequest.newProblem');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    await vscode.commands.executeCommand('codequest.newProblem');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Check problem numbering in filesystem
    const patternsDir = path.join(workspaceDir, 'patterns');
    const patterns = fs.readdirSync(patternsDir).filter(name => 
      fs.statSync(path.join(patternsDir, name)).isDirectory()
    );
    
    if (patterns.length > 0) {
      const patternDir = path.join(patternsDir, patterns[0]);
      const problems = fs.readdirSync(patternDir)
        .filter(name => name.startsWith('problem-'))
        .sort();
      
      // Should have multiple problems
      expect(problems.length).to.be.greaterThan(1);
      
      // Check that problem numbers increment
      const problemNumbers = problems.map(name => {
        const match = name.match(/problem-(\d+)-/);
        return match ? parseInt(match[1], 10) : 0;
      }).sort((a, b) => a - b);
      
      // Should start from 1 and increment
      expect(problemNumbers[0]).to.equal(1);
      
      // Each subsequent number should be greater than previous
      for (let i = 1; i < problemNumbers.length; i++) {
        expect(problemNumbers[i]).to.be.greaterThan(problemNumbers[i - 1]);
      }
    }
  });

  it('should handle concurrent newProblem commands gracefully', async function() {
    this.timeout(5000);
    
    // Execute multiple newProblem commands concurrently
    const promises = [
      vscode.commands.executeCommand('codequest.newProblem'),
      vscode.commands.executeCommand('codequest.newProblem'),
      vscode.commands.executeCommand('codequest.newProblem')
    ];
    
    // All should complete without throwing
    const results = await Promise.allSettled(promises);
    
    // At least some should succeed
    const successful = results.filter(r => r.status === 'fulfilled');
    expect(successful.length).to.be.greaterThan(0);
    
    // Wait for file operations to settle
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify filesystem is in consistent state
    const patternsDir = path.join(workspaceDir, 'patterns');
    if (fs.existsSync(patternsDir)) {
      const patterns = fs.readdirSync(patternsDir);
      
      // Should have created at least one pattern
      expect(patterns.length).to.be.greaterThan(0);
      
      // All created directories should be valid
      patterns.forEach(pattern => {
        const patternPath = path.join(patternsDir, pattern);
        expect(fs.statSync(patternPath).isDirectory()).to.be.true;
      });
    }
  });
});
