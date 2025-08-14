import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { parseProblemPath, ProblemInfo } from './lib/problemPath';
import { buildDashboardHtml } from './webview/html';

interface ExtensionState {
  workspacePath: string;
  problemCount: number;
  currentProblem: ProblemInfo | null;
  installedAt: string | null;
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
    vscode.commands.registerCommand('codequest.startSession', () => {
      dashboardProvider.handleCommand('Start Session invoked');
      vscode.window.showInformationMessage('CodeQuest: Session started');
    }),
    
    vscode.commands.registerCommand('codequest.endSession', () => {
      dashboardProvider.handleCommand('End Session invoked');
      vscode.window.showInformationMessage('CodeQuest: Session ended');
    }),
    
    vscode.commands.registerCommand('codequest.markSolved', () => {
      dashboardProvider.handleCommand('Mark Solved invoked');
      vscode.window.showInformationMessage('CodeQuest: Problem marked as solved');
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
    watcher.onDidChange(() => dashboardProvider.refreshProblemCount())
  );

  // Initial scan and setup
  dashboardProvider.performInitialScan();
  
  console.log('CodeQuest Coach extension activated successfully');
}

class DashboardProvider implements vscode.WebviewViewProvider {
  private webview: vscode.Webview | undefined;
  private state: ExtensionState;

  constructor(
    private context: vscode.ExtensionContext,
    private installedAt: string
  ) {
    this.state = {
      workspacePath: this.getWorkspacePath(),
      problemCount: 0,
      currentProblem: null,
      installedAt: this.installedAt
    };
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
        case 'codequest.markSolved':
        case 'codequest.importLegacy':
          vscode.commands.executeCommand(message.command);
          break;
        case 'codequest.requestLiveState':
          this.exitPreviewMode();
          break;
      }
    });
  }

  public async performInitialScan(): Promise<void> {
    this.state.problemCount = await this.scanWorkspaceProblems();
    this.updateCurrentProblem(vscode.window.activeTextEditor?.document.uri.fsPath);
    this.sendStateUpdate();
  }

  public async refreshProblemCount(): Promise<void> {
    this.state.problemCount = await this.scanWorkspaceProblems();
    this.sendStateUpdate();
  }

  public updateCurrentProblem(filePath?: string): void {
    this.state.currentProblem = parseProblemPath(filePath);
    this.sendStateUpdate();
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

  public previewUiState(stateName: string): void {
    if (!this.webview) return;

    let previewState: ExtensionState;
    const currentWorkspacePath = this.getWorkspacePath();

    switch (stateName) {
      case 'Empty Workspace':
        previewState = {
          workspacePath: 'No folder open',
          problemCount: 0,
          currentProblem: null,
          installedAt: this.state.installedAt
        };
        break;
      
      case 'No File Open':
        previewState = {
          workspacePath: currentWorkspacePath,
          problemCount: 3,
          currentProblem: null,
          installedAt: this.state.installedAt
        };
        break;
      
      case 'Detected Problem':
        previewState = {
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
          installedAt: this.state.installedAt
        };
        break;
      
      case 'Skeleton Loading':
        previewState = {
          workspacePath: 'Loading…',
          problemCount: 0,
          currentProblem: null,
          installedAt: this.state.installedAt
        };
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
    this.state.problemCount = await this.scanWorkspaceProblems();
    this.updateCurrentProblem(vscode.window.activeTextEditor?.document.uri.fsPath);

    // Then clear preview mode
    this.webview.postMessage({
      type: 'setPreviewMode',
      data: { enabled: false, label: '' }
    });
  }

  private getWorkspacePath(): string {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    return workspaceFolder ? workspaceFolder.uri.fsPath : 'No folder open';
  }

  private async scanWorkspaceProblems(): Promise<number> {
    try {
      const files = await vscode.workspace.findFiles('patterns/**/homework.js');
      return files.length;
    } catch (error) {
      console.error('Error scanning workspace problems:', error);
      return 0;
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
