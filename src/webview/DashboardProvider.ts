/**
 * Webview provider & all handlers previously in the monolith.
 * Behavior preserved 1:1 (plus accepts both 'markSolved' and 'codequest.markSolved').
 */

import * as vscode from 'vscode';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';
import type { ProblemInfo } from '../lib/problemPath';
import { buildDashboardHtml } from '../webview/html';
import { CatalogService } from '../services/catalog';
import {
  ExtensionState, SolvedInfo, PatternStats, CatalogProblem
} from '../types';

export class DashboardProvider implements vscode.WebviewViewProvider {
  private webview: vscode.Webview | undefined;
  private webviewView: vscode.WebviewView | undefined;

  private state: ExtensionState;
  private solvedCatalog: Record<string, string> = {}; // key -> ISO (pattern/slug)

  constructor(
    private context: vscode.ExtensionContext,
    private installedAt: string,
    private catalogService: CatalogService
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
      session: { running: false, todayMinutes: 0 },
      calendar: { dailyMinutes: {} }
    };

    this.loadSolvedState();
    this.loadSessionState();
    
    // Dev mode: watch for changes in media files and trigger webview reload
    if (process.env.NODE_ENV !== 'production') {
      const watcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(this.context.extensionUri, 'media/**')
      );
      const reload = () => this.webview?.postMessage({ type: 'devReload' });
      watcher.onDidChange(reload);
      watcher.onDidCreate(reload);
      watcher.onDidDelete(reload);
      this.context.subscriptions.push(watcher);
    }
  }

  // ---------- State bootstrap & persistence ----------

  private loadSolvedState(): void {
    // Legacy (file-based)
    const solvedData = this.context.globalState.get<Record<string, SolvedInfo>>('cq.solved.v1', {});
    // Catalog-based
    this.solvedCatalog = this.context.globalState.get<Record<string, string>>('cq.solvedCatalog.v1', {});
    this.state.solvedKeys = [
      ...Object.keys(solvedData),                // legacy keys (file paths)
      ...Object.keys(this.solvedCatalog)        // catalog keys ("pattern/slug")
    ];
  }

  private loadSessionState(): void {
    const calendarData = this.context.globalState.get<Record<string, number>>('cq.calendar.v1', {});
    this.state.calendar.dailyMinutes = calendarData;

    const today = new Date().toISOString().split('T')[0];
    this.state.session.todayMinutes = calendarData[today] || 0;

    const startedAt = this.context.globalState.get<string>('cq.session.startedAt');
    if (startedAt) {
      this.state.session.running = true;
      this.state.session.startedAt = startedAt;
    }
  }

  private async saveCalendarData(): Promise<void> {
    await this.context.globalState.update('cq.calendar.v1', this.state.calendar.dailyMinutes);
  }

  private getTodayKey(): string {
    return new Date().toISOString().split('T')[0];
  }

  // ---------- Session controls ----------

  public async startSession(): Promise<void> {
    if (this.state.session.running) return;
    const now = new Date().toISOString();
    this.state.session.running = true;
    this.state.session.startedAt = now;
    await this.context.globalState.update('cq.session.startedAt', now);
    this.sendStateUpdate();
  }

  public async endSession(): Promise<void> {
    if (!this.state.session.running || !this.state.session.startedAt) return;

    const now = new Date();
    const startTime = new Date(this.state.session.startedAt);
    const minutes = Math.round((now.getTime() - startTime.getTime()) / (1000 * 60));

    const today = this.getTodayKey();
    this.state.calendar.dailyMinutes[today] = (this.state.calendar.dailyMinutes[today] || 0) + minutes;
    this.state.session.todayMinutes = this.state.calendar.dailyMinutes[today];

    this.state.session.running = false;
    this.state.session.startedAt = undefined;

    await this.saveCalendarData();
    await this.context.globalState.update('cq.session.startedAt', undefined);

    this.sendStateUpdate();
  }

  // ---------- Solved state ----------

  private async saveSolvedState(problemKey: string, solved: boolean): Promise<void> {
    const current = this.context.globalState.get<Record<string, SolvedInfo>>('cq.solved.v1', {});
    if (solved) {
      current[problemKey] = { solvedAt: new Date().toISOString() };
    } else {
      delete current[problemKey];
    }
    await this.context.globalState.update('cq.solved.v1', current);
    this.state.solvedKeys = Object.keys(current);
  }

  private computePatternStats(): PatternStats[] {
    const map = new Map<string, { solved: number; total: number }>();
    for (const p of this.state.problems) {
      const cur = map.get(p.pattern) || { solved: 0, total: 0 };
      cur.total++;
      if (this.state.solvedKeys.includes(p.key)) cur.solved++;
      map.set(p.pattern, cur);
    }
    return Array.from(map.entries())
      .map(([pattern, s]) => ({ pattern, solved: s.solved, total: s.total }))
      .sort((a, b) => a.pattern.localeCompare(b.pattern));
  }

  private async computePatternStatsFromCatalog(): Promise<PatternStats[]> {
    try {
      const catalog = await this.catalogService.getCatalog();
      const map = new Map<string, { solved: number; total: number }>();
      Object.entries(catalog).forEach(([pattern, byBand]: any) => {
        const problems =
          [...(byBand?.[1] ?? []), ...(byBand?.[2] ?? []), ...(byBand?.[3] ?? []), ...(byBand?.[4] ?? []), ...(byBand?.[5] ?? [])];
        const cur = map.get(pattern) || { solved: 0, total: 0 };
        cur.total += problems.length;
        for (const p of problems) {
          if (this.solvedCatalog[`${pattern}/${p.slug}`]) cur.solved++;
        }
        map.set(pattern, cur);
      });
      return Array.from(map.entries())
        .map(([pattern, s]) => ({ pattern, solved: s.solved, total: s.total }))
        .sort((a, b) => a.pattern.localeCompare(b.pattern));
    } catch {
      return [];
    }
  }

  // ---------- Webview plumbing ----------

  public resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.webviewView = webviewView;
    this.webview = webviewView.webview;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media')]
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((message: any) => {
      switch (message.command) {
        case 'getInitialState':
          this.sendStateUpdate();
          break;

        case 'codequest.getCatalog':
          this.handleGetCatalog();
          break;

        case 'codequest.createFromCatalog':
          this.handleCreateFromCatalog(message.pattern, message.slug);
          break;

        case 'codequest.openOrCreateProblem':
          this.handleOpenOrCreateProblem(message.pattern, message.slug);
          break;

        case 'codequest.startSession':
        case 'codequest.endSession':
        case 'codequest.pauseSession':
        case 'codequest.importLegacy':
          vscode.commands.executeCommand(message.command);
          break;

        // Accept both forms to avoid UI mismatch regressions
        case 'codequest.markSolved':
        case 'markSolved':
          this.handleMarkSolvedBySlug(message.pattern, message.slug);
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
          // no-op with catalog system
          break;

        case 'codequest.setFilter':
          this.state.filter = message.filter;
          this.sendStateUpdate();
          break;

        case 'codequest.logDiagnostics':
          this.handleLogDiagnostics(message.data);
          break;
      }
    });
  }

  public dispose(): void {
    // no timers to clean up in catalog-based flow
  }

  public handleWorkspaceChange(): void {
    this.state.workspacePath = this.getWorkspacePath();
  }

  public handleCommand(message: string): void {
    this.webview?.postMessage({ type: 'commandResult', message });
  }

  // ---------- Problem actions ----------

  public async handleNewProblem(): Promise<void> {
    try {
      const patterns = [
        'arrays-and-hashing',
        'two-pointers',
        'sliding-window',
        'stack',
        'binary-search',
        'dynamic-programming',
        'graphs'
      ];
      const selected = await vscode.window.showQuickPick(patterns, { placeHolder: 'Select a pattern for the new problem' });
      if (!selected) return;

      const name = await vscode.window.showInputBox({ prompt: 'Enter the problem name', placeHolder: 'e.g., "Two Sum", "Valid Palindrome"' });
      if (!name) return;

      const slug = this.slugifyName(name);
      const next = await this.getNextProblemNumber(selected);

      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
      }

      const today = new Date().toISOString().slice(0, 10);
      const dir = path.join(
        workspaceFolder.uri.fsPath,
        'patterns',
        selected,
        `problem-${next.toString().padStart(3, '0')}-${slug}`,
        today
      );
      const filePath = path.join(dir, 'homework.js');
      await fs.promises.mkdir(dir, { recursive: true });

      const patternTitle = selected.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const template = `// Pattern: ${patternTitle} | Problem ${next.toString().padStart(3, '0')} — ${name} | ${today}
// TODO: write solution; annotate time/space complexity.

function solve(/* input */) {
  // your code here
}

module.exports = solve;
`;
      await fs.promises.writeFile(filePath, template, 'utf8');
      const uri = vscode.Uri.file(filePath);
      await vscode.window.showTextDocument(uri);
      this.handleCommand(`New problem created: ${name}`);
    } catch (e) {
      console.error('Error creating new problem:', e);
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
    } catch (e) {
      console.error('Error opening problem:', e);
      vscode.window.showErrorMessage('Failed to open problem file');
    }
  }

  public async handleRefreshProblems(): Promise<void> {
    // catalog-based: nothing to scan
    this.state.problems = [];
    this.state.problemCount = 0;
    this.state.patternStats = this.computePatternStats();
    this.sendStateUpdate();
  }

  public async handleGetCatalog(): Promise<void> {
    try {
      const catalog = await this.catalogService.getCatalog();
      this.webviewView?.webview.postMessage({ command: 'catalogData', data: catalog });
    } catch (e) {
      console.error('Failed to load catalog:', e);
      vscode.window.showErrorMessage('Failed to load problem catalog');
    }
  }

  public async handleOpenOrCreateProblem(pattern: string, slug: string): Promise<void> {
    try {
      const workspaceFolder = this.getWorkspaceFolder();
      if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
      }

      const patternsDir = path.join(workspaceFolder, 'patterns', pattern);
      if (fs.existsSync(patternsDir)) {
        const problemDirs = fs.readdirSync(patternsDir)
          .filter(dir => dir.includes(slug))
          .filter(dir => fs.statSync(path.join(patternsDir, dir)).isDirectory());

        if (problemDirs.length > 0) {
          const latestDir = problemDirs.sort().pop()!;
          const problemPath = path.join(patternsDir, latestDir);
          const dateDirs = fs.readdirSync(problemPath)
            .filter(dir => fs.statSync(path.join(problemPath, dir)).isDirectory())
            .sort()
            .reverse();

          for (const dateDir of dateDirs) {
            const filePath = path.join(problemPath, dateDir, 'homework.js');
            if (fs.existsSync(filePath)) {
              const document = await vscode.workspace.openTextDocument(filePath);
              await vscode.window.showTextDocument(document);
              return;
            }
          }
        }
      }

      // create fresh if not found
      await this.handleCreateFromCatalog(pattern, slug);
    } catch (e) {
      console.error('Failed to open or create problem:', e);
      vscode.window.showErrorMessage('Failed to open or create problem');
    }
  }

  public async handleCreateFromCatalog(pattern: string, slug: string): Promise<void> {
    try {
      const catalog = await this.catalogService.getCatalog();
      // search bands 1..5 for slug
      const problem =
        catalog[pattern]?.[1]?.find((p: CatalogProblem) => p.slug === slug) ||
        catalog[pattern]?.[2]?.find((p: CatalogProblem) => p.slug === slug) ||
        catalog[pattern]?.[3]?.find((p: CatalogProblem) => p.slug === slug) ||
        catalog[pattern]?.[4]?.find((p: CatalogProblem) => p.slug === slug) ||
        catalog[pattern]?.[5]?.find((p: CatalogProblem) => p.slug === slug);

      if (!problem) {
        vscode.window.showErrorMessage('Problem not found in catalog');
        return;
      }

      const workspaceFolder = this.getWorkspaceFolder();
      if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
      }

      const problemNumber = await this.getNextProblemNumber(pattern);
      const date = new Date().toISOString().split('T')[0];
      const problemDirName = `problem-${problemNumber.toString().padStart(3, '0')}-${slug}`;

      const filePath = path.join(
        workspaceFolder, 'patterns', pattern, problemDirName, date, 'homework.js'
      );

      fs.mkdirSync(path.dirname(filePath), { recursive: true });

      const stub = this.generateProblemStub(problem, problemNumber, date);
      fs.writeFileSync(filePath, stub);

      const document = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(document);

      vscode.window.showInformationMessage(`Created: ${problem.title}`);
    } catch (e) {
      console.error('Failed to create problem from catalog:', e);
      vscode.window.showErrorMessage('Failed to create problem file');
    }
  }

  public async handleMarkSolved(): Promise<void> {
    if (!this.state.currentProblem) {
      vscode.window.showWarningMessage('No problem file is currently open');
      return;
    }
    const key = this.state.currentProblem.key;
    const currentlySolved = this.state.solvedKeys.includes(key);

    try {
      await this.saveSolvedState(key, !currentlySolved);
      this.state.patternStats = this.computePatternStats();
      this.sendStateUpdate();
      const action = currentlySolved ? 'unmarked as solved' : 'marked as solved';
      vscode.window.showInformationMessage(`Problem ${action}`);
    } catch {
      vscode.window.showErrorMessage('Failed to update solved state');
    }
  }

  public async handleMarkSolvedBySlug(pattern: string, slug: string): Promise<void> {
    if (!pattern || !slug) {
      vscode.window.showWarningMessage('Invalid problem reference');
      return;
    }
    const key = `${pattern}/${slug}`;
    const currentlySolved = !!this.solvedCatalog[key];
    try {
      if (currentlySolved) {
        delete this.solvedCatalog[key];
      } else {
        this.solvedCatalog[key] = new Date().toISOString();
        
        // Add time to calendar when marking as solved (default 5 minutes)
        const today = this.getTodayKey();
        const minutesToAdd = 5; // Default time credit for solving a problem
        this.state.calendar.dailyMinutes[today] = (this.state.calendar.dailyMinutes[today] || 0) + minutesToAdd;
        this.state.session.todayMinutes = this.state.calendar.dailyMinutes[today];
        await this.saveCalendarData();
      }
      await this.context.globalState.update('cq.solvedCatalog.v1', this.solvedCatalog);
      // Reflect in state
      this.state.solvedKeys = [
        ...Object.keys(this.solvedCatalog)
      ];
      this.state.patternStats = await this.computePatternStatsFromCatalog();
      this.sendStateUpdate();
      vscode.window.showInformationMessage(`Problem ${currentlySolved ? 'unmarked' : 'marked'} as solved`);
    } catch (e) {
      console.error(e);
      vscode.window.showErrorMessage('Failed to update solved state');
    }
  }

  public async handleOpenNextUnsolved(): Promise<void> {
    const unsolved = this.state.problems.filter(p => !this.state.solvedKeys.includes(p.key));
    if (unsolved.length === 0) {
      vscode.window.showInformationMessage('🎉 All problems are solved! Great work!');
      return;
    }
    await this.handleOpenProblem(unsolved[0].key);
  }

  // ---------- Preview/lifecycle ----------

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
      session: { running: false, todayMinutes: 0 },
      calendar: { dailyMinutes: {} },
      ...overrides
    };
  }

  public previewUiState(stateName: string): void {
    if (!this.webview) return;

    const ws = this.getWorkspacePath();
    let preview: ExtensionState;

    switch (stateName) {
      case 'Empty Workspace':
        preview = this.createPreviewState({});
        break;
      case 'No File Open':
        preview = this.createPreviewState({ workspacePath: ws, problemCount: 3 });
        break;
      case 'Detected Problem':
        preview = this.createPreviewState({
          workspacePath: ws,
          problemCount: 3,
          currentProblem: {
            pattern: 'Arrays And Hashing',
            number: '001',
            name: 'Two Sum',
            date: '2025-07-15',
            difficulty: 'Easy',
            key: 'patterns/arrays-and-hashing/problem-001-two-sum/2025-07-15/homework.js'
          } as ProblemInfo,
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
          ] as any,
          solvedKeys: ['patterns/arrays-and-hashing/problem-002-contains-duplicate/2025-07-16/homework.js'],
          patternStats: [
            { pattern: 'Arrays And Hashing', solved: 1, total: 2 },
            { pattern: 'Two Pointers', solved: 0, total: 1 }
          ],
          session: {
            running: true,
            startedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
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
        preview = this.createPreviewState({ workspacePath: 'Loading…' });
        break;
      default:
        return;
    }

    this.webview.postMessage({ type: 'updateState', data: preview });
    this.webview.postMessage({ type: 'setPreviewMode', data: { enabled: true, label: stateName } });
  }

  public async exitPreviewMode(): Promise<void> {
    if (!this.webview) return;

    this.state.workspacePath = this.getWorkspacePath();
    this.state.problems = [];
    this.state.problemCount = 0;
    this.state.patternStats = this.computePatternStats();

    this.sendStateUpdate();
    this.webview.postMessage({ type: 'setPreviewMode', data: { enabled: false, label: '' } });
  }

  // ---------- HTML & utilities ----------

  private sendStateUpdate(): void {
    this.webview?.postMessage({ type: 'updateState', data: this.state });
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const nonce = crypto.randomBytes(16).toString('base64');
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'dashboard.css')
    );
    // App bundle
    const jsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'dashboard', 'main.js')
    );
    // D3 library for calendar
    const d3Uri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'vendor', 'd3.min.js')
    );
    const cspSource = webview.cspSource;

    return buildDashboardHtml({
      cssUri: cssUri.toString(),
      jsUri: jsUri.toString(),
      d3Uri: d3Uri.toString(),
      cspSource,
      nonce
    });
  }

  private getWorkspaceFolder(): string | undefined {
    const folders = vscode.workspace.workspaceFolders;
    return folders && folders.length > 0 ? folders[0].uri.fsPath : undefined;
  }

  private getWorkspacePath(): string {
    const wf = vscode.workspace.workspaceFolders?.[0];
    return wf ? wf.uri.fsPath : 'No folder open';
  }

  private slugifyName(name: string): string {
    return name.trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private async getNextProblemNumber(pattern: string): Promise<number> {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) return 1;
      const patternDir = path.join(workspaceFolder.uri.fsPath, 'patterns', pattern);

      try {
        const entries = await fs.promises.readdir(patternDir, { withFileTypes: true });
        const problemDirs = entries.filter(e => e.isDirectory() && e.name.startsWith('problem-'));
        let max = 0;
        for (const dir of problemDirs) {
          const m = dir.name.match(/^problem-(\d+)-/);
          if (m) max = Math.max(max, parseInt(m[1], 10));
        }
        return max + 1;
      } catch {
        return 1; // directory absent
      }
    } catch (e) {
      console.error('Error getting next problem number:', e);
      return 1;
    }
  }

  private formatPatternName(pattern: string): string {
    return pattern.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  private generateProblemStub(problem: CatalogProblem, problemNumber: number, date: string): string {
    const bandNames: Record<number, string> = {
      1: 'Very Easy', 2: 'Easy', 3: 'Medium', 4: 'Hard', 5: 'Very Hard'
    };
    const patternName = this.formatPatternName(problem.pattern);
    const bandName = bandNames[problem.band] || `Band ${problem.band}`;

    return `// Pattern: ${patternName} | Problem ${problemNumber.toString().padStart(3, '0')} — ${problem.title} | ${date}
// Difficulty: ${bandName} (Band ${problem.band})
// Source: ${problem.url}
// Notes: Read problem statement at the URL above.
// TODO: Outline approach, time/space, and tests.

function solve(/* input */) {
  // your code here
}

module.exports = solve;
`;
  }

  private handleLogDiagnostics(data: any): void {
    try {
      // Forward to the command handler which will log to output channel
      vscode.commands.executeCommand('codequest.logDiagnostics', data);
      
      // Also send back to webview for local logging
      this.webview?.postMessage({
        type: 'diagnosticsLogged',
        data: data
      });
    } catch (error: any) {
      console.error('Failed to log diagnostics:', error);
    }
  }
}
