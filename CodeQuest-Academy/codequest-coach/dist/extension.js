"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode = __toESM(require("vscode"));
var crypto = __toESM(require("crypto"));
var path = __toESM(require("path"));
var fs = __toESM(require("fs"));

// src/lib/problemPath.ts
function parseProblemPath(filePath) {
  if (!filePath) {
    return null;
  }
  const regex = /patterns[\/\\]([^\/\\]+)[\/\\]problem-(\d+)-([^\/\\]+)[\/\\]([0-9]{4}-[0-9]{2}-[0-9]{2})[\/\\]homework\.js$/i;
  const match = filePath.match(regex);
  if (!match) {
    return null;
  }
  const patternSlug = match[1];
  const num = match[2];
  const nameSlug = match[3];
  const date = match[4];
  const pattern = slugToName(patternSlug);
  const name = slugToName(nameSlug);
  const difficulty = inferDifficulty(patternSlug, parseInt(num, 10));
  const key = `patterns/${patternSlug}/problem-${num}-${nameSlug}/${date}/homework.js`;
  return {
    pattern,
    number: num,
    name,
    date,
    difficulty,
    key
  };
}
function slugToName(slug) {
  return slug.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}
function inferDifficulty(patternSlug, num) {
  if (patternSlug === "arrays-and-hashing" || patternSlug === "two-pointers") {
    if (num <= 3)
      return "Easy";
    if (num <= 7)
      return "Medium";
    return "Hard";
  } else {
    if (num <= 2)
      return "Easy";
    return "Medium";
  }
}

// src/webview/html.ts
function buildDashboardHtml(options) {
  const { cssUri, jsUri, cspSource, nonce } = options;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none'; img-src ${cspSource} https: data:; style-src ${cspSource}; script-src 'nonce-${nonce}';">
  <title>CodeQuest Dashboard</title>
  <link rel="stylesheet" href="${cssUri}">
</head>
<body>
  <div class="header">
    <h1>CodeQuest Coach</h1>
    <span id="installedBadge" class="badge">Loading...</span>
  </div>

  <div class="grid">
    <div class="card">
      <h2>Workspace</h2>
      <div class="workspace-info">
        <div>Root folder:</div>
        <div id="workspacePath" class="workspace-path">No folder open</div>
      </div>
      <div class="stats-grid">
        <div class="stat-item">
          <div id="problemCount" class="stat-value">0</div>
          <div class="stat-label">Problems found</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2>Current Problem</h2>
      <div id="currentProblem">
        <div class="no-problem">No homework.js file open</div>
      </div>
    </div>

    <div class="card">
      <h2>Problems</h2>
      <div id="patternStats" class="pattern-stats" aria-live="polite"></div>
      <div id="problemFilters" class="filter-chips" role="tablist" aria-label="Filter problems">
        <button class="filter-chip active" data-filter="all" role="tab" aria-selected="true">All</button>
        <button class="filter-chip" data-filter="unsolved" role="tab" aria-selected="false">Unsolved</button>
        <button class="filter-chip" data-filter="solved" role="tab" aria-selected="false">Solved</button>
      </div>
      <div id="problemsList" role="list" aria-busy="false"></div>
      <div class="command-grid">
        <button id="newProblem" class="command-btn">New Problem</button>
        <button id="refreshProblems" class="command-btn">Refresh</button>
      </div>
    </div>

    <div class="card">
      <h2>Commands</h2>
      <div id="previewBanner" class="status-message hidden" role="status" aria-live="polite" aria-atomic="true"></div>
      <div class="command-grid">
        <button id="startSession" class="command-btn">Start Session</button>
        <button id="endSession" class="command-btn">End Session</button>
        <button id="markSolved" class="command-btn">Mark Solved</button>
        <button id="importLegacy" class="command-btn">Import Legacy</button>
        <button id="exitPreview" class="command-btn hidden">Exit Preview</button>
      </div>
      <div id="statusMessage" class="status-message hidden" role="status" aria-live="polite"></div>
    </div>
  </div>

  <script nonce="${nonce}" src="${jsUri}"></script>
</body>
</html>`;
}

// src/extension.ts
function activate(context) {
  console.log("CodeQuest Coach extension is activating...");
  let installedAt = context.globalState.get("installedAt");
  if (!installedAt) {
    installedAt = (/* @__PURE__ */ new Date()).toISOString();
    context.globalState.update("installedAt", installedAt);
  }
  const dashboardProvider = new DashboardProvider(context, installedAt);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "codequest.dashboard",
      dashboardProvider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("codequest.startSession", () => {
      dashboardProvider.handleCommand("Start Session invoked");
      vscode.window.showInformationMessage("CodeQuest: Session started");
    }),
    vscode.commands.registerCommand("codequest.endSession", () => {
      dashboardProvider.handleCommand("End Session invoked");
      vscode.window.showInformationMessage("CodeQuest: Session ended");
    }),
    vscode.commands.registerCommand("codequest.markSolved", async () => {
      await dashboardProvider.handleMarkSolved();
    }),
    vscode.commands.registerCommand("codequest.openNextUnsolved", async () => {
      await dashboardProvider.handleOpenNextUnsolved();
    }),
    vscode.commands.registerCommand("codequest.importLegacy", () => {
      dashboardProvider.handleCommand("Import Legacy invoked");
      vscode.window.showInformationMessage("CodeQuest: Legacy import invoked");
    }),
    vscode.commands.registerCommand("codequest.previewUiState", async () => {
      const options = [
        "Empty Workspace",
        "No File Open",
        "Detected Problem",
        "Skeleton Loading"
      ];
      const selected = await vscode.window.showQuickPick(options, {
        placeHolder: "Select UI state to preview"
      });
      if (selected) {
        dashboardProvider.previewUiState(selected);
      }
    }),
    vscode.commands.registerCommand("codequest.newProblem", async () => {
      await dashboardProvider.handleNewProblem();
    })
  );
  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      dashboardProvider.handleWorkspaceChange();
    })
  );
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      dashboardProvider.updateCurrentProblem(editor?.document.uri.fsPath);
    })
  );
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((document) => {
      if (document.uri.fsPath.endsWith("homework.js")) {
        dashboardProvider.updateCurrentProblem(document.uri.fsPath);
      }
    })
  );
  const watcher = vscode.workspace.createFileSystemWatcher("**/patterns/**/homework.js");
  context.subscriptions.push(
    watcher,
    watcher.onDidCreate(() => dashboardProvider.refreshProblemCount()),
    watcher.onDidDelete(() => dashboardProvider.refreshProblemCount()),
    watcher.onDidChange(() => dashboardProvider.refreshProblemCount()),
    { dispose: () => dashboardProvider.dispose() }
  );
  dashboardProvider.performInitialScan();
  console.log("CodeQuest Coach extension activated successfully");
}
var DashboardProvider = class {
  constructor(context, installedAt) {
    this.context = context;
    this.installedAt = installedAt;
    this.state = {
      workspacePath: this.getWorkspacePath(),
      problemCount: 0,
      currentProblem: null,
      problems: [],
      solvedKeys: [],
      filter: "all",
      patternStats: [],
      installedAt: this.installedAt
    };
    this.loadSolvedState();
  }
  webview;
  state;
  refreshDebounce;
  loadSolvedState() {
    const solvedData = this.context.globalState.get("cq.solved.v1", {});
    this.state.solvedKeys = Object.keys(solvedData);
  }
  async saveSolvedState(problemKey, solved) {
    const currentData = this.context.globalState.get("cq.solved.v1", {});
    if (solved) {
      currentData[problemKey] = { solvedAt: (/* @__PURE__ */ new Date()).toISOString() };
    } else {
      delete currentData[problemKey];
    }
    await this.context.globalState.update("cq.solved.v1", currentData);
    this.state.solvedKeys = Object.keys(currentData);
  }
  computePatternStats() {
    const patternMap = /* @__PURE__ */ new Map();
    for (const problem of this.state.problems) {
      const current = patternMap.get(problem.pattern) || { solved: 0, total: 0 };
      current.total++;
      if (this.state.solvedKeys.includes(problem.key)) {
        current.solved++;
      }
      patternMap.set(problem.pattern, current);
    }
    return Array.from(patternMap.entries()).map(([pattern, stats]) => ({
      pattern,
      solved: stats.solved,
      total: stats.total
    }));
  }
  resolveWebviewView(webviewView) {
    this.webview = webviewView.webview;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, "media")]
    };
    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);
    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case "getInitialState":
          this.sendStateUpdate();
          break;
        case "codequest.startSession":
        case "codequest.endSession":
        case "codequest.importLegacy":
          vscode.commands.executeCommand(message.command);
          break;
        case "codequest.markSolved":
          this.handleMarkSolved();
          break;
        case "codequest.requestLiveState":
          this.exitPreviewMode();
          break;
        case "codequest.newProblem":
          this.handleNewProblem();
          break;
        case "codequest.openProblem":
          this.handleOpenProblem(message.key);
          break;
        case "codequest.refreshProblems":
          this.handleRefreshProblems();
          break;
        case "codequest.setFilter":
          this.state.filter = message.filter;
          this.sendStateUpdate();
          break;
      }
    });
  }
  async performInitialScan() {
    this.state.problems = await this.scanWorkspaceList();
    this.state.problemCount = this.state.problems.length;
    this.state.patternStats = this.computePatternStats();
    this.updateCurrentProblem(vscode.window.activeTextEditor?.document.uri.fsPath);
  }
  async refreshProblemCount() {
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
  updateCurrentProblem(filePath) {
    this.state.currentProblem = parseProblemPath(filePath);
    this.sendStateUpdate();
  }
  dispose() {
    if (this.refreshDebounce) {
      clearTimeout(this.refreshDebounce);
      this.refreshDebounce = void 0;
    }
  }
  handleWorkspaceChange() {
    this.state.workspacePath = this.getWorkspacePath();
    this.refreshProblemCount();
  }
  handleCommand(message) {
    if (this.webview) {
      this.webview.postMessage({
        type: "commandResult",
        message
      });
    }
  }
  async handleNewProblem() {
    try {
      const patterns = [
        "arrays-and-hashing",
        "two-pointers",
        "sliding-window",
        "stack",
        "binary-search",
        "dynamic-programming",
        "graph"
      ];
      const selectedPattern = await vscode.window.showQuickPick(patterns, {
        placeHolder: "Select a pattern for the new problem"
      });
      if (!selectedPattern)
        return;
      const problemName = await vscode.window.showInputBox({
        prompt: "Enter the problem name",
        placeHolder: 'e.g., "Two Sum", "Valid Palindrome"'
      });
      if (!problemName)
        return;
      const slugifiedName = this.slugifyName(problemName);
      const nextNumber = await this.getNextProblemNumber(selectedPattern);
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showErrorMessage("No workspace folder open");
        return;
      }
      const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      const problemDir = path.join(
        workspaceFolder.uri.fsPath,
        "patterns",
        selectedPattern,
        `problem-${nextNumber.toString().padStart(3, "0")}-${slugifiedName}`,
        today
      );
      const filePath = path.join(problemDir, "homework.js");
      await fs.promises.mkdir(problemDir, { recursive: true });
      const patternTitle = selectedPattern.split("-").map(
        (word) => word.charAt(0).toUpperCase() + word.slice(1)
      ).join(" ");
      const template = `// Pattern: ${patternTitle} | Problem ${nextNumber.toString().padStart(3, "0")} \u2014 ${problemName} | ${today}
// TODO: write solution; annotate time/space complexity.

function solve(/* input */) {
  // your code here
}

module.exports = solve;
`;
      await fs.promises.writeFile(filePath, template, "utf8");
      const uri = vscode.Uri.file(filePath);
      await vscode.window.showTextDocument(uri);
      await this.handleRefreshProblems();
      this.handleCommand(`New problem created: ${problemName}`);
    } catch (error) {
      console.error("Error creating new problem:", error);
      vscode.window.showErrorMessage("Failed to create new problem");
    }
  }
  async handleOpenProblem(key) {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showErrorMessage("No workspace folder open");
        return;
      }
      const filePath = path.join(workspaceFolder.uri.fsPath, key);
      const uri = vscode.Uri.file(filePath);
      await vscode.window.showTextDocument(uri);
    } catch (error) {
      console.error("Error opening problem:", error);
      vscode.window.showErrorMessage("Failed to open problem file");
    }
  }
  async handleRefreshProblems() {
    this.state.problems = await this.scanWorkspaceList();
    this.state.problemCount = this.state.problems.length;
    this.state.patternStats = this.computePatternStats();
    this.sendStateUpdate();
  }
  async handleMarkSolved() {
    if (!this.state.currentProblem) {
      vscode.window.showWarningMessage("No problem file is currently open");
      return;
    }
    const currentKey = this.state.currentProblem.key;
    const isCurrentlySolved = this.state.solvedKeys.includes(currentKey);
    try {
      await this.saveSolvedState(currentKey, !isCurrentlySolved);
      this.state.patternStats = this.computePatternStats();
      this.sendStateUpdate();
      const action = isCurrentlySolved ? "unmarked as solved" : "marked as solved";
      vscode.window.showInformationMessage(`Problem ${action}`);
    } catch (error) {
      vscode.window.showErrorMessage("Failed to update solved state");
    }
  }
  async handleOpenNextUnsolved() {
    const unsolvedProblems = this.state.problems.filter((p) => !this.state.solvedKeys.includes(p.key));
    if (unsolvedProblems.length === 0) {
      vscode.window.showInformationMessage("\u{1F389} All problems are solved! Great work!");
      return;
    }
    const nextProblem = unsolvedProblems[0];
    await this.handleOpenProblem(nextProblem.key);
  }
  slugifyName(name) {
    return name.trim().toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  }
  async getNextProblemNumber(pattern) {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder)
        return 1;
      const patternDir = path.join(workspaceFolder.uri.fsPath, "patterns", pattern);
      try {
        const entries = await fs.promises.readdir(patternDir, { withFileTypes: true });
        const problemDirs = entries.filter(
          (entry) => entry.isDirectory() && entry.name.startsWith("problem-")
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
        return 1;
      }
    } catch (error) {
      console.error("Error getting next problem number:", error);
      return 1;
    }
  }
  previewUiState(stateName) {
    if (!this.webview)
      return;
    let previewState;
    const currentWorkspacePath = this.getWorkspacePath();
    switch (stateName) {
      case "Empty Workspace":
        previewState = {
          workspacePath: "No folder open",
          problemCount: 0,
          currentProblem: null,
          problems: [],
          solvedKeys: [],
          filter: "all",
          patternStats: [],
          installedAt: this.state.installedAt
        };
        break;
      case "No File Open":
        previewState = {
          workspacePath: currentWorkspacePath,
          problemCount: 3,
          currentProblem: null,
          problems: [],
          solvedKeys: [],
          filter: "all",
          patternStats: [],
          installedAt: this.state.installedAt
        };
        break;
      case "Detected Problem":
        previewState = {
          workspacePath: currentWorkspacePath,
          problemCount: 3,
          currentProblem: {
            pattern: "Arrays And Hashing",
            number: "001",
            name: "Two Sum",
            date: "2025-07-15",
            difficulty: "Easy",
            key: "patterns/arrays-and-hashing/problem-001-two-sum/2025-07-15/homework.js"
          },
          problems: [
            {
              pattern: "Arrays And Hashing",
              number: "001",
              name: "Two Sum",
              date: "2025-07-15",
              difficulty: "Easy",
              key: "patterns/arrays-and-hashing/problem-001-two-sum/2025-07-15/homework.js"
            },
            {
              pattern: "Arrays And Hashing",
              number: "002",
              name: "Contains Duplicate",
              date: "2025-07-16",
              difficulty: "Easy",
              key: "patterns/arrays-and-hashing/problem-002-contains-duplicate/2025-07-16/homework.js"
            },
            {
              pattern: "Two Pointers",
              number: "001",
              name: "Valid Palindrome",
              date: "2025-07-17",
              difficulty: "Easy",
              key: "patterns/two-pointers/problem-001-valid-palindrome/2025-07-17/homework.js"
            }
          ],
          solvedKeys: ["patterns/arrays-and-hashing/problem-002-contains-duplicate/2025-07-16/homework.js"],
          filter: "all",
          patternStats: [
            { pattern: "Arrays And Hashing", solved: 1, total: 2 },
            { pattern: "Two Pointers", solved: 0, total: 1 }
          ],
          installedAt: this.state.installedAt
        };
        break;
      case "Skeleton Loading":
        previewState = {
          workspacePath: "Loading\u2026",
          problemCount: 0,
          currentProblem: null,
          problems: [],
          solvedKeys: [],
          filter: "all",
          patternStats: [],
          installedAt: this.state.installedAt
        };
        break;
      default:
        return;
    }
    this.webview.postMessage({
      type: "updateState",
      data: previewState
    });
    this.webview.postMessage({
      type: "setPreviewMode",
      data: { enabled: true, label: stateName }
    });
  }
  async exitPreviewMode() {
    if (!this.webview)
      return;
    this.state.workspacePath = this.getWorkspacePath();
    this.state.problems = await this.scanWorkspaceList();
    this.state.problemCount = this.state.problems.length;
    this.state.patternStats = this.computePatternStats();
    this.updateCurrentProblem(vscode.window.activeTextEditor?.document.uri.fsPath);
    this.webview.postMessage({
      type: "setPreviewMode",
      data: { enabled: false, label: "" }
    });
  }
  getWorkspacePath() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    return workspaceFolder ? workspaceFolder.uri.fsPath : "No folder open";
  }
  async scanWorkspaceProblems() {
    try {
      const files = await vscode.workspace.findFiles("patterns/**/homework.js");
      return files.length;
    } catch (error) {
      console.error("Error scanning workspace problems:", error);
      return 0;
    }
  }
  async scanWorkspaceList() {
    try {
      const files = await vscode.workspace.findFiles("patterns/**/homework.js");
      const problems = [];
      for (const file of files) {
        const problemInfo = parseProblemPath(file.fsPath);
        if (problemInfo) {
          problems.push(problemInfo);
        }
      }
      problems.sort((a, b) => {
        const patternCompare = a.pattern.localeCompare(b.pattern);
        if (patternCompare !== 0)
          return patternCompare;
        const numA = parseInt(a.number, 10);
        const numB = parseInt(b.number, 10);
        if (numA !== numB)
          return numB - numA;
        return b.date.localeCompare(a.date);
      });
      return problems;
    } catch (error) {
      console.error("Error scanning workspace problem list:", error);
      return [];
    }
  }
  sendStateUpdate() {
    if (this.webview) {
      this.webview.postMessage({
        type: "updateState",
        data: this.state
      });
    }
  }
  getHtmlForWebview(webview) {
    const nonce = crypto.randomBytes(16).toString("base64");
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "dashboard.css")
    );
    const jsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "dashboard.js")
    );
    const cspSource = webview.cspSource;
    return buildDashboardHtml({
      cssUri: cssUri.toString(),
      jsUri: jsUri.toString(),
      cspSource,
      nonce
    });
  }
};
function deactivate() {
  console.log("CodeQuest Coach extension deactivated");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
