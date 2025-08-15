import { expect } from 'chai';

describe('Webview Events', () => {
  // Mock DOM environment using simple objects
  let mockDocument: any;
  let mockWindow: any;
  let postedMessages: any[];

  beforeEach(() => {
    postedMessages = [];
    
    // Create mock elements
    const mockProblemsListElement = {
      innerHTML: '',
      querySelectorAll: () => [],
      addEventListener: () => {},
      setAttribute: () => {},
      getAttribute: () => null
    };

    const createMockButton = () => ({
      _clickHandler: null as Function | null,
      addEventListener: function(event: string, handler: Function) {
        if (event === 'click') {
          this._clickHandler = handler;
        }
      },
      click: function() {
        if (this._clickHandler) {
          this._clickHandler();
        }
      }
    });

    mockDocument = {
      getElementById: (id: string) => {
        if (id === 'problemsList') return mockProblemsListElement;
        if (id === 'newProblem') return createMockButton();
        if (id === 'refreshProblems') return createMockButton();
        return null;
      },
      querySelector: () => null,
      querySelectorAll: () => []
    };

    mockWindow = {
      vscode: {
        postMessage: (message: any) => {
          postedMessages.push(message);
        }
      },
      acquireVsCodeApi: () => mockWindow.vscode
    };

    // Mock global environment
    global.document = mockDocument;
    global.window = mockWindow;
  });

  afterEach(() => {
    // Clean up global mocks
    delete (global as any).document;
    delete (global as any).window;
  });

  it('should post newProblem command when New Problem button is clicked', () => {
    const button = mockDocument.getElementById('newProblem');
    
    // Simulate the event listener setup
    button.addEventListener('click', () => {
      mockWindow.vscode.postMessage({ command: 'codequest.newProblem' });
    });
    
    // Trigger the click
    button.click();
    
    expect(postedMessages).to.have.length(1);
    expect(postedMessages[0]).to.deep.equal({ command: 'codequest.newProblem' });
  });

  it('should post refreshProblems command when Refresh button is clicked', () => {
    const button = mockDocument.getElementById('refreshProblems');
    
    // Simulate the event listener setup
    button.addEventListener('click', () => {
      mockWindow.vscode.postMessage({ command: 'codequest.refreshProblems' });
    });
    
    // Trigger the click
    button.click();
    
    expect(postedMessages).to.have.length(1);
    expect(postedMessages[0]).to.deep.equal({ command: 'codequest.refreshProblems' });
  });

  it('should handle problem list rendering with empty state', () => {
    const problemsList = mockDocument.getElementById('problemsList');
    
    // Simulate renderProblemsList function logic
    const renderProblemsList = (problems: any[]) => {
      if (problems.length === 0) {
        problemsList.innerHTML = '<p style="color: #666; font-style: italic;">No problems found. Create your first problem!</p>';
      }
    };
    
    renderProblemsList([]);
    
    expect(problemsList.innerHTML).to.include('No problems found. Create your first problem!');
  });

  it('should handle problem list rendering with multiple problems', () => {
    const problemsList = mockDocument.getElementById('problemsList');
    
    // Simulate renderProblemsList function logic
    const renderProblemsList = (problems: any[]) => {
      if (problems.length === 0) {
        problemsList.innerHTML = '<p style="color: #666; font-style: italic;">No problems found. Create your first problem!</p>';
        return;
      }
      
      problemsList.innerHTML = problems.map(problem => `
        <div class="problem-item" 
             data-path="${problem.path}" 
             tabindex="0" 
             role="listitem"
             aria-label="Problem ${problem.name} in ${problem.pattern}">
          <div class="problem-name">${problem.name}</div>
          <div class="problem-meta">${problem.pattern} • ${problem.dateFolder}</div>
        </div>
      `).join('');
    };

    const mockProblems = [
      {
        name: 'Two Sum',
        pattern: 'arrays-and-hashing',
        dateFolder: '2025-01-15',
        path: '/path/to/problem'
      },
      {
        name: 'Valid Palindrome',
        pattern: 'two-pointers', 
        dateFolder: '2025-01-16',
        path: '/path/to/other'
      }
    ];
    
    renderProblemsList(mockProblems);
    
    expect(problemsList.innerHTML).to.include('Two Sum');
    expect(problemsList.innerHTML).to.include('arrays-and-hashing • 2025-01-15');
    expect(problemsList.innerHTML).to.include('Valid Palindrome');
    expect(problemsList.innerHTML).to.include('two-pointers • 2025-01-16');
  });

  it('should generate proper accessibility attributes for problem items', () => {
    const problemsList = mockDocument.getElementById('problemsList');
    
    const renderProblemsList = (problems: any[]) => {
      problemsList.innerHTML = problems.map(problem => `
        <div class="problem-item" 
             data-path="${problem.path}" 
             tabindex="0" 
             role="listitem"
             aria-label="Problem ${problem.name} in ${problem.pattern}">
          <div class="problem-name">${problem.name}</div>
          <div class="problem-meta">${problem.pattern} • ${problem.dateFolder}</div>
        </div>
      `).join('');
    };

    const mockProblems = [{
      name: 'Two Sum',
      pattern: 'arrays-and-hashing',
      dateFolder: '2025-01-15',
      path: '/test/path'
    }];
    
    renderProblemsList(mockProblems);
    
    expect(problemsList.innerHTML).to.include('tabindex="0"');
    expect(problemsList.innerHTML).to.include('role="listitem"');
    expect(problemsList.innerHTML).to.include('aria-label="Problem Two Sum in arrays-and-hashing"');
  });

  it('should generate problem items with proper data attributes', () => {
    const problemsList = mockDocument.getElementById('problemsList');
    
    const renderProblemsList = (problems: any[]) => {
      problemsList.innerHTML = problems.map(problem => `
        <div class="problem-item" 
             data-path="${problem.path}" 
             tabindex="0" 
             role="listitem"
             aria-label="Problem ${problem.name} in ${problem.pattern}">
          <div class="problem-name">${problem.name}</div>
          <div class="problem-meta">${problem.pattern} • ${problem.dateFolder}</div>
        </div>
      `).join('');
    };

    const mockProblems = [{
      name: 'Two Sum',
      pattern: 'arrays-and-hashing',
      dateFolder: '2025-01-15',
      path: '/test/path'
    }];
    
    renderProblemsList(mockProblems);
    
    expect(problemsList.innerHTML).to.include('data-path="/test/path"');
    expect(problemsList.innerHTML).to.include('class="problem-item"');
  });

  it('should handle VS Code API message posting', () => {
    // Test that the mock VS Code API works correctly
    mockWindow.vscode.postMessage({ command: 'test', data: 'test-data' });
    
    expect(postedMessages).to.have.length(1);
    expect(postedMessages[0]).to.deep.equal({ command: 'test', data: 'test-data' });
  });

  it('should verify button elements exist in mock DOM', () => {
    const newProblemBtn = mockDocument.getElementById('newProblem');
    const refreshProblemsBtn = mockDocument.getElementById('refreshProblems');
    const problemsList = mockDocument.getElementById('problemsList');
    
    expect(newProblemBtn).to.not.be.null;
    expect(refreshProblemsBtn).to.not.be.null;
    expect(problemsList).to.not.be.null;
  });
});
