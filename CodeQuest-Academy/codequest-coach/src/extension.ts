import * as vscode from 'vscode';
import * as fs from 'fs';
import * as crypto from 'crypto';

interface ProblemInfo {
  pattern: string;
  number: string;
  name: string;
  date: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

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
    })
  );

  // Listen for active editor changes
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor: vscode.TextEditor | undefined) => {
      dashboardProvider.updateCurrentProblem(editor?.document.uri.fsPath);
    })
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
      localResourceRoots: [this.context.extensionUri]
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
      }
    });
  }

  public async performInitialScan(): Promise<void> {
    this.state.problemCount = await this.scanWorkspaceProblems();
    this.updateCurrentProblem(vscode.window.activeTextEditor?.document.uri.fsPath);
    this.sendStateUpdate();
  }

  public updateCurrentProblem(filePath?: string): void {
    this.state.currentProblem = this.parseProblemPath(filePath);
    this.sendStateUpdate();
  }

  public handleCommand(message: string): void {
    if (this.webview) {
      this.webview.postMessage({
        type: 'commandResult',
        message: message
      });
    }
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

  private parseProblemPath(filePath?: string): ProblemInfo | null {
    if (!filePath) {
      return null;
    }

    // Use the exact regex from the specification
    const regex = /patterns[\/\\]([^\/\\]+)[\/\\]problem-(\d+)-([^\/\\]+)[\/\\]([0-9]{4}-[0-9]{2}-[0-9]{2})[\/\\]homework\.js$/i;
    const match = filePath.match(regex);

    if (!match) {
      return null;
    }

    const patternSlug = match[1];
    const num = match[2];
    const nameSlug = match[3];
    const date = match[4];

    // Convert slug to readable names
    const pattern = this.slugToName(patternSlug);
    const name = this.slugToName(nameSlug);
    const difficulty = this.inferDifficulty(patternSlug, parseInt(num, 10));

    return {
      pattern,
      number: num,
      name,
      date,
      difficulty
    };
  }

  private slugToName(slug: string): string {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private inferDifficulty(patternSlug: string, num: number): 'Easy' | 'Medium' | 'Hard' {
    // Heuristic difficulty as specified
    if (patternSlug === 'arrays-and-hashing' || patternSlug === 'two-pointers') {
      if (num <= 3) return 'Easy';
      if (num <= 7) return 'Medium';
      return 'Hard';
    } else {
      if (num <= 2) return 'Easy';
      return 'Medium';
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
    
    // Get CSS file URI and CSP source
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'dashboard.css')
    );
    const cspSource = webview.cspSource;

    // Read HTML template and replace placeholders
    const htmlPath = vscode.Uri.joinPath(this.context.extensionUri, 'media', 'dashboard.html');
    
    try {
      let html = fs.readFileSync(htmlPath.fsPath, 'utf8');
      html = html.replace(/\$\{cssUri\}/g, cssUri.toString());
      html = html.replace(/\$\{cspSource\}/g, cspSource);
      html = html.replace(/\$\{nonce\}/g, nonce);
      return html;
    } catch (error) {
      console.error('Error reading HTML template:', error);
      return this.getFallbackHtml(cssUri, cspSource, nonce);
    }
  }

  private getFallbackHtml(cssUri: vscode.Uri, cspSource: string, nonce: string): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; img-src ${cspSource} data:; style-src ${cspSource}; script-src 'nonce-${nonce}';">
      <title>CodeQuest Dashboard</title>
      <link rel="stylesheet" href="${cssUri}">
    </head>
    <body>
      <div class="header">
        <h1>CodeQuest Coach</h1>
        <span class="badge">Fallback Mode</span>
      </div>
      <div class="grid">
        <div class="card">
          <h2>Error</h2>
          <p>Could not load dashboard template. Extension is running in fallback mode.</p>
        </div>
      </div>
      <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        console.log('Dashboard running in fallback mode');
      </script>
    </body>
    </html>`;
  }
}

export function deactivate() {
  console.log('CodeQuest Coach extension deactivated');
}
