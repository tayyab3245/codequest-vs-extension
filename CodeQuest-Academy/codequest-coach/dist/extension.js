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
var fs = __toESM(require("fs"));
var crypto = __toESM(require("crypto"));
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
    vscode.commands.registerCommand("codequest.markSolved", () => {
      dashboardProvider.handleCommand("Mark Solved invoked");
      vscode.window.showInformationMessage("CodeQuest: Problem marked as solved");
    }),
    vscode.commands.registerCommand("codequest.importLegacy", () => {
      dashboardProvider.handleCommand("Import Legacy invoked");
      vscode.window.showInformationMessage("CodeQuest: Legacy import invoked");
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
    watcher.onDidChange(() => dashboardProvider.refreshProblemCount())
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
      installedAt: this.installedAt
    };
  }
  webview;
  state;
  resolveWebviewView(webviewView) {
    this.webview = webviewView.webview;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri]
    };
    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);
    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case "getInitialState":
          this.sendStateUpdate();
          break;
        case "codequest.startSession":
        case "codequest.endSession":
        case "codequest.markSolved":
        case "codequest.importLegacy":
          vscode.commands.executeCommand(message.command);
          break;
      }
    });
  }
  async performInitialScan() {
    this.state.problemCount = await this.scanWorkspaceProblems();
    this.updateCurrentProblem(vscode.window.activeTextEditor?.document.uri.fsPath);
    this.sendStateUpdate();
  }
  async refreshProblemCount() {
    this.state.problemCount = await this.scanWorkspaceProblems();
    this.sendStateUpdate();
  }
  updateCurrentProblem(filePath) {
    this.state.currentProblem = this.parseProblemPath(filePath);
    this.sendStateUpdate();
  }
  handleCommand(message) {
    if (this.webview) {
      this.webview.postMessage({
        type: "commandResult",
        message
      });
    }
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
  parseProblemPath(filePath) {
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
  slugToName(slug) {
    return slug.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  }
  inferDifficulty(patternSlug, num) {
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
    const htmlPath = vscode.Uri.joinPath(this.context.extensionUri, "media", "dashboard.html");
    try {
      let html = fs.readFileSync(htmlPath.fsPath, "utf8");
      html = html.replace(/\$\{cssUri\}/g, cssUri.toString());
      html = html.replace(/\$\{jsUri\}/g, jsUri.toString());
      html = html.replace(/\$\{cspSource\}/g, cspSource);
      html = html.replace(/\$\{nonce\}/g, nonce);
      return html;
    } catch (error) {
      console.error("Error reading HTML template:", error);
      return this.getFallbackHtml(cssUri, jsUri, cspSource, nonce);
    }
  }
  getFallbackHtml(cssUri, jsUri, cspSource, nonce) {
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
        <span class="badge">Fallback Mode</span>
      </div>
      <div class="grid">
        <div class="card">
          <h2>Error</h2>
          <p>Could not load dashboard template. Extension is running in fallback mode.</p>
        </div>
      </div>
      <script nonce="${nonce}" src="${jsUri}"></script>
    </body>
    </html>`;
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
