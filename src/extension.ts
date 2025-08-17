import * as vscode from 'vscode';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';
import { parseProblemPath, ProblemInfo } from './lib/problemPath';
import { buildDashboardHtml } from './webview/html';

interface SolvedInfo {
  solvedAt: string; // ISO string
}

interface PatternStats {
  pattern: string;
  solved: number;
  total: number;
}

interface SessionInfo {
  running: boolean;
  startedAt?: string; // ISO string
  todayMinutes: number;
}

interface CalendarData {
  dailyMinutes: Record<string, number>; // 'YYYY-MM-DD' -> minutes
}

interface ExtensionState {
  workspacePath: string;
  problemCount: number;
  currentProblem: ProblemInfo | null;
  problems: ProblemInfo[];
  solvedKeys: string[]; // array of problem keys that are solved
  filter: 'all' | 'unsolved' | 'solved';
  patternStats: PatternStats[];
  installedAt: string;
  session: SessionInfo;
  calendar: CalendarData;
}

export function activate(context: vscode.ExtensionContext) {
  console.log('CodeQuest Coach extension is activating...');

  // Initialize or get installation date
  let installedAt = context.globalState.get<string>('installedAt');
  if (!installedAt) {
    installedAt = new Date().toISOString();
    context.globalState.update('installedAt', installedAt);
  }

  // Create dashboard provider
  const dashboardProvider = new DashboardProvider(context, installedAt);
  
  // Register webview provider
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'codequest.dashboard',
      dashboardProvider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('codequest.startSession', async () => {
      await dashboardProvider.startSession();
      vscode.window.showInformationMessage('CodeQuest: Session started');
    }),
    
    vscode.commands.registerCommand('codequest.endSession', async () => {
      await dashboardProvider.endSession();
      vscode.window.showInformationMessage('CodeQuest: Session ended');
    }),
    
    vscode.commands.registerCommand('codequest.markSolved', async () => {
      await dashboardProvider.handleMarkSolved();
    }),
    
    vscode.commands.registerCommand('codequest.openNextUnsolved', async () => {
      await dashboardProvider.handleOpenNextUnsolved();
    }),
    
    vscode.commands.registerCommand('codequest.importLegacy', () => {
      dashboardProvider.handleCommand('Import Legacy invoked');
      vscode.window.showInformationMessage('CodeQuest: Legacy import invoked');
    }),

    vscode.commands.registerCommand('codequest.previewUiState', async () => {
      const options = [
        'Empty Workspace',
        'No File Open',
        'Detected Problem',
        'Skeleton Loading'
      ];
      
      const selected = await vscode.window.showQuickPick(options, {
        placeHolder: 'Select UI state to preview'
      });
      
      if (selected) {
        dashboardProvider.previewUiState(selected);
      }
    }),

    vscode.commands.registerCommand('codequest.newProblem', async () => {
      await dashboardProvider.handleNewProblem();
    })
  );

  // Listen for workspace folder changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      dashboardProvider.handleWorkspaceChange();
    })
  );

  // Listen for active editor changes
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor: vscode.TextEditor | undefined) => {
      dashboardProvider.updateCurrentProblem(editor?.document.uri.fsPath);
    })
  );

  // Listen for document saves to update current problem
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
      if (document.uri.fsPath.endsWith('homework.js')) {
        dashboardProvider.updateCurrentProblem(document.uri.fsPath);
      }
    })
  );

  // Create file system watcher for homework.js files
  const watcher = vscode.workspace.createFileSystemWatcher('**/patterns/**/homework.js');
  
  context.subscriptions.push(
    watcher,
    watcher.onDidCreate(() => dashboardProvider.refreshProblemCount()),
    watcher.onDidDelete(() => dashboardProvider.refreshProblemCount()),
    watcher.onDidChange(() => dashboardProvider.refreshProblemCount()),
    { dispose: () => dashboardProvider.dispose() }
  );

  // Initial scan and setup
  dashboardProvider.performInitialScan();
  
  console.log('CodeQuest Coach extension activated successfully');
}

class DashboardProvider implements vscode.WebviewViewProvider {
  private webview: vscode.Webview | undefined;
  private state: ExtensionState;
  private refreshDebounce?: NodeJS.Timeout;

  constructor(
    private context: vscode.ExtensionContext,
    private installedAt: string
  ) {
    this.state = {
      workspacePath: this.getWorkspacePath(),
      problemCount: 0,
      currentProblem: null,
      problems: [],
      solvedKeys: [],
      filter: 'all',
      patternStats: [],
      installedAt: this.installedAt,
      session: {
        running: false,
        todayMinutes: 0
      },
      calendar: {
        dailyMinutes: {}
      }
    };
    
    // Load solved state on startup
    this.loadSolvedState();
    // Load session and calendar state
    this.loadSessionState();
  }

  private loadSolvedState(): void {
    const solvedData = this.context.globalState.get<Record<string, SolvedInfo>>('cq.solved.v1', {});
    this.state.solvedKeys = Object.keys(solvedData);
  }

  private loadSessionState(): void {
    // Load calendar data
    const calendarData = this.context.globalState.get<Record<string, number>>('cq.calendar.v1', {});
    this.state.calendar.dailyMinutes = calendarData;

    // Load today's minutes
    const today = new Date().toISOString().split('T')[0];
    this.state.session.todayMinutes = calendarData[today] || 0;

    // Check if session was running (recover from reload)
    const sessionStartAt = this.context.globalState.get<string>('cq.session.startedAt');
    if (sessionStartAt) {
      this.state.session.running = true;
      this.state.session.startedAt = sessionStartAt;
    }
  }

  private async saveCalendarData(): Promise<void> {
    await this.context.globalState.update('cq.calendar.v1', this.state.calendar.dailyMinutes);
  }

  private getTodayKey(): string {
    return new Date().toISOString().split('T')[0];
  }

  public async startSession(): Promise<void> {
    if (this.state.session.running) {
      return; // Already running
    }

    const now = new Date().toISOString();
    this.state.session.running = true;
    this.state.session.startedAt = now;
    
    // Persist session start time for recovery
    await this.context.globalState.update('cq.session.startedAt', now);
    
    this.sendStateUpdate();
  }

  public async endSession(): Promise<void> {
    if (!this.state.session.running || !this.state.session.startedAt) {
      return; // Not running
    }

    const now = new Date();
    const startTime = new Date(this.state.session.startedAt);
    const sessionMinutes = Math.round((now.getTime() - startTime.getTime()) / (1000 * 60));

    // Add to today's total
    const today = this.getTodayKey();
    this.state.calendar.dailyMinutes[today] = (this.state.calendar.dailyMinutes[today] || 0) + sessionMinutes;
    this.state.session.todayMinutes = this.state.calendar.dailyMinutes[today];

    // Clear session state
    this.state.session.running = false;
    this.state.session.startedAt = undefined;

    // Persist changes
    await this.saveCalendarData();
    await this.context.globalState.update('cq.session.startedAt', undefined);

    this.sendStateUpdate();
  }

  private async saveSolvedState(problemKey: string, solved: boolean): Promise<void> {
    const currentData = this.context.globalState.get<Record<string, SolvedInfo>>('cq.solved.v1', {});
    
    if (solved) {
      currentData[problemKey] = { solvedAt: new Date().toISOString() };
    } else {
      delete currentData[problemKey];
    }
    
    await this.context.globalState.update('cq.solved.v1', currentData);
    this.state.solvedKeys = Object.keys(currentData);
  }

  private computePatternStats(): PatternStats[] {
    const patternMap = new Map<string, { solved: number; total: number }>();
    
    for (const problem of this.state.problems) {
      const current = patternMap.get(problem.pattern) || { solved: 0, total: 0 };
      current.total++;
      if (this.state.solvedKeys.includes(problem.key)) {
        current.solved++;
      }
      patternMap.set(problem.pattern, current);
    }
    
    return Array.from(patternMap.entries())
      .map(([pattern, stats]) => ({
        pattern,
        solved: stats.solved,
        total: stats.total
      }))
      .sort((a, b) => a.pattern.localeCompare(b.pattern));
  }

  public resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.webview = webviewView.webview;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media')]
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage((message: any) => {
      switch (message.command) {
        case 'getInitialState':
          this.sendStateUpdate();
          break;
        case 'codequest.startSession':
        case 'codequest.endSession':
        case 'codequest.importLegacy':
          vscode.commands.executeCommand(message.command);
          break;
        case 'codequest.markSolved':
          this.handleMarkSolved();
          break;
        case 'codequest.requestLiveState':
          this.exitPreviewMode();
          break;
        case 'codequest.newProblem':
          this.handleNewProblem();
          break;
        case 'codequest.openProblem':
          this.handleOpenProblem(message.key);
          break;
        case 'codequest.refreshProblems':
          this.handleRefreshProblems();
          break;
        case 'codequest.setFilter':
          this.state.filter = message.filter;
          this.sendStateUpdate();
          break;
      }
    });
  }

  public async performInitialScan(): Promise<void> {
    this.state.problems = await this.scanWorkspaceList();
    this.state.problemCount = this.state.problems.length;
    this.state.patternStats = this.computePatternStats();
    this.updateCurrentProblem(vscode.window.activeTextEditor?.document.uri.fsPath);
  }

  public async refreshProblemCount(): Promise<void> {
    if (this.refreshDebounce) {
      clearTimeout(this.refreshDebounce);
    }
    
    this.refreshDebounce = setTimeout(async () => {
      this.state.problems = await this.scanWorkspaceList();
      this.state.problemCount = this.state.problems.length;
      this.state.patternStats = this.computePatternStats();
      this.sendStateUpdate();
    }, 200);
  }

  public updateCurrentProblem(filePath?: string): void {
    this.state.currentProblem = parseProblemPath(filePath);
    this.sendStateUpdate();
  }

  public dispose(): void {
    if (this.refreshDebounce) {
      clearTimeout(this.refreshDebounce);
      this.refreshDebounce = undefined;
    }
  }

  public handleWorkspaceChange(): void {
    this.state.workspacePath = this.getWorkspacePath();
    this.refreshProblemCount();
  }

  public handleCommand(message: string): void {
    if (this.webview) {
      this.webview.postMessage({
        type: 'commandResult',
        message: message
      });
    }
  }

  public async handleNewProblem(): Promise<void> {
    try {
      // Quick pick for pattern
      const patterns = [
        'arrays-and-hashing',
        'two-pointers',
        'sliding-window',
        'stack',
        'binary-search',
        'dynamic-programming',
        'graph'
      ];

      const selectedPattern = await vscode.window.showQuickPick(patterns, {
        placeHolder: 'Select a pattern for the new problem'
      });

      if (!selectedPattern) return;

      // Input box for problem name
      const problemName = await vscode.window.showInputBox({
        prompt: 'Enter the problem name',
        placeHolder: 'e.g., "Two Sum", "Valid Palindrome"'
      });

      if (!problemName) return;

      // Slugify the name
      const slugifiedName = this.slugifyName(problemName);

      // Get next problem number
      const nextNumber = await this.getNextProblemNumber(selectedPattern);

      // Build path
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
      }

      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const problemDir = path.join(
        workspaceFolder.uri.fsPath,
        'patterns',
        selectedPattern,
        `problem-${nextNumber.toString().padStart(3, '0')}-${slugifiedName}`,
        today
      );

      const filePath = path.join(problemDir, 'homework.js');

      // Ensure directories exist
      await fs.promises.mkdir(problemDir, { recursive: true });

      // Create template content
      const patternTitle = selectedPattern.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');

      const template = `// Pattern: ${patternTitle} | Problem ${nextNumber.toString().padStart(3, '0')} — ${problemName} | ${today}
// TODO: write solution; annotate time/space complexity.

function solve(/* input */) {
  // your code here
}

module.exports = solve;
`;

      // Write file
      await fs.promises.writeFile(filePath, template, 'utf8');

      // Open file
      const uri = vscode.Uri.file(filePath);
      await vscode.window.showTextDocument(uri);

      // Refresh state
      await this.handleRefreshProblems();

      this.handleCommand(`New problem created: ${problemName}`);
    } catch (error) {
      console.error('Error creating new problem:', error);
      vscode.window.showErrorMessage('Failed to create new problem');
    }
  }

  public async handleOpenProblem(key: string): Promise<void> {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
      }

      const filePath = path.join(workspaceFolder.uri.fsPath, key);
      const uri = vscode.Uri.file(filePath);
      await vscode.window.showTextDocument(uri);
    } catch (error) {
      console.error('Error opening problem:', error);
      vscode.window.showErrorMessage('Failed to open problem file');
    }
  }

  public async handleRefreshProblems(): Promise<void> {
    this.state.problems = await this.scanWorkspaceList();
    this.state.problemCount = this.state.problems.length;
    this.state.patternStats = this.computePatternStats();
    this.sendStateUpdate();
  }

  public async handleMarkSolved(): Promise<void> {
    if (!this.state.currentProblem) {
      vscode.window.showWarningMessage('No problem file is currently open');
      return;
    }

    const currentKey = this.state.currentProblem.key;
    const isCurrentlySolved = this.state.solvedKeys.includes(currentKey);
    
    try {
      await this.saveSolvedState(currentKey, !isCurrentlySolved);
      this.state.patternStats = this.computePatternStats();
      this.sendStateUpdate();
      
      const action = isCurrentlySolved ? 'unmarked as solved' : 'marked as solved';
      vscode.window.showInformationMessage(`Problem ${action}`);
    } catch (error) {
      vscode.window.showErrorMessage('Failed to update solved state');
    }
  }

  public async handleOpenNextUnsolved(): Promise<void> {
    const unsolvedProblems = this.state.problems.filter(p => !this.state.solvedKeys.includes(p.key));
    
    if (unsolvedProblems.length === 0) {
      vscode.window.showInformationMessage('🎉 All problems are solved! Great work!');
      return;
    }
    
    // Take the first unsolved problem (respects current sort order)
    const nextProblem = unsolvedProblems[0];
    await this.handleOpenProblem(nextProblem.key);
  }

  private slugifyName(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove punctuation
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Collapse multiple hyphens
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  private async getNextProblemNumber(pattern: string): Promise<number> {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) return 1;

      const patternDir = path.join(workspaceFolder.uri.fsPath, 'patterns', pattern);
      
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

  private createPreviewState(overrides: Partial<ExtensionState>): ExtensionState {
    return {
      workspacePath: 'No folder open',
      problemCount: 0,
      currentProblem: null,
      problems: [],
      solvedKeys: [],
      filter: 'all',
      patternStats: [],
      installedAt: this.state.installedAt,
      session: {
        running: false,
        todayMinutes: 0
      },
      calendar: {
        dailyMinutes: {}
      },
      ...overrides
    };
  }

  public previewUiState(stateName: string): void {
    if (!this.webview) return;

    let previewState: ExtensionState;
    const currentWorkspacePath = this.getWorkspacePath();

    switch (stateName) {
      case 'Empty Workspace':
        previewState = this.createPreviewState({});
        break;
      
      case 'No File Open':
        previewState = this.createPreviewState({
          workspacePath: currentWorkspacePath,
          problemCount: 3
        });
        break;
      
      case 'Detected Problem':
        previewState = this.createPreviewState({
          workspacePath: currentWorkspacePath,
          problemCount: 3,
          currentProblem: {
            pattern: 'Arrays And Hashing',
            number: '001',
            name: 'Two Sum',
            date: '2025-07-15',
            difficulty: 'Easy',
            key: 'patterns/arrays-and-hashing/problem-001-two-sum/2025-07-15/homework.js'
          },
          problems: [
            {
              pattern: 'Arrays And Hashing',
              number: '001',
              name: 'Two Sum',
              date: '2025-07-15',
              difficulty: 'Easy',
              key: 'patterns/arrays-and-hashing/problem-001-two-sum/2025-07-15/homework.js'
            },
            {
              pattern: 'Arrays And Hashing',
              number: '002',
              name: 'Contains Duplicate',
              date: '2025-07-16',
              difficulty: 'Easy',
              key: 'patterns/arrays-and-hashing/problem-002-contains-duplicate/2025-07-16/homework.js'
            },
            {
              pattern: 'Two Pointers',
              number: '001',
              name: 'Valid Palindrome',
              date: '2025-07-17',
              difficulty: 'Easy',
              key: 'patterns/two-pointers/problem-001-valid-palindrome/2025-07-17/homework.js'
            }
          ],
          solvedKeys: ['patterns/arrays-and-hashing/problem-002-contains-duplicate/2025-07-16/homework.js'],
          patternStats: [
            { pattern: 'Arrays And Hashing', solved: 1, total: 2 },
            { pattern: 'Two Pointers', solved: 0, total: 1 }
          ],
          session: {
            running: true,
            startedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 minutes ago
            todayMinutes: 45
          },
          calendar: {
            dailyMinutes: {
              '2025-08-15': 30,
              '2025-08-16': 45,
              '2025-08-17': 45
            }
          }
        });
        break;
      
      case 'Skeleton Loading':
        previewState = this.createPreviewState({
          workspacePath: 'Loading…'
        });
        break;
      
      default:
        return;
    }

    this.webview.postMessage({
      type: 'updateState',
      data: previewState
    });

    this.webview.postMessage({
      type: 'setPreviewMode',
      data: { enabled: true, label: stateName }
    });
  }

  public async exitPreviewMode(): Promise<void> {
    if (!this.webview) return;

    // Re-compute live state
    this.state.workspacePath = this.getWorkspacePath();
    this.state.problems = await this.scanWorkspaceList();
    this.state.problemCount = this.state.problems.length;
    this.state.patternStats = this.computePatternStats();
    this.updateCurrentProblem(vscode.window.activeTextEditor?.document.uri.fsPath);

    // Clear preview mode (updateCurrentProblem already sent updateState)
    this.webview.postMessage({
      type: 'setPreviewMode',
      data: { enabled: false, label: '' }
    });
    
    // Note: Remove duplicate toast - banner provides sufficient feedback
  }

  private getWorkspacePath(): string {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    return workspaceFolder ? workspaceFolder.uri.fsPath : 'No folder open';
  }

  private async scanWorkspaceList(): Promise<ProblemInfo[]> {
    try {
      const files = await vscode.workspace.findFiles('patterns/**/homework.js');
      const problems: ProblemInfo[] = [];

      for (const file of files) {
        const problemInfo = parseProblemPath(file.fsPath);
        if (problemInfo) {
          problems.push(problemInfo);
        }
      }

      // Sort: pattern (A→Z) → Number (desc numeric) → date (desc)
      problems.sort((a, b) => {
        // First by pattern name
        const patternCompare = a.pattern.localeCompare(b.pattern);
        if (patternCompare !== 0) return patternCompare;

        // Then by number (descending numeric)
        const numA = parseInt(a.number, 10);
        const numB = parseInt(b.number, 10);
        if (numA !== numB) return numB - numA;

        // Finally by date (descending)
        return b.date.localeCompare(a.date);
      });

      return problems;
    } catch (error) {
      console.error('Error scanning workspace problem list:', error);
      return [];
    }
  }

  private sendStateUpdate(): void {
    if (this.webview) {
      this.webview.postMessage({
        type: 'updateState',
        data: this.state
      });
    }
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    // Generate a cryptographically strong nonce
    const nonce = crypto.randomBytes(16).toString('base64');
    
    // Get resource URIs and CSP source
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'dashboard.css')
    );
    const jsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'dashboard.js')
    );
    const cspSource = webview.cspSource;

    // Use the tested HTML builder
    return buildDashboardHtml({
      cssUri: cssUri.toString(),
      jsUri: jsUri.toString(),
      cspSource,
      nonce
    });
  }
}

export function deactivate() {
  console.log('CodeQuest Coach extension deactivated');
}
