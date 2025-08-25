/**
 * CodeQuest - VS Code LeetCode Progress Tracker
 * (c) 2025 tayyab3245. Proprietary.
 */
import * as vscode from 'vscode';
import { CatalogService } from './services/catalog';
import { DashboardProvider } from './webview/DashboardProvider';
import { registerCommands } from './features/commands';

export async function activate(context: vscode.ExtensionContext) {
  console.log('CodeQuest Coach extension is activating...');

  // one-time install timestamp
  let installedAt = context.globalState.get<string>('installedAt');
  if (!installedAt) {
    installedAt = new Date().toISOString();
    await context.globalState.update('installedAt', installedAt);
  }

  // services
  const catalogService = new CatalogService(context);

  // webview provider
  const dashboardProvider = new DashboardProvider(context, installedAt, catalogService);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'codequest.dashboard',
      dashboardProvider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  // commands (sessions, catalog, AI config, utilities)
  registerCommands(context, dashboardProvider, catalogService);

  console.log('CodeQuest Coach extension activated successfully');
}

export function deactivate() {
  console.log('CodeQuest Coach extension deactivated');
}