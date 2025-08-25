/**
 * Command registrations, split by concern.
 * No behavior changes vs monolith.
 */
import * as vscode from 'vscode';
import { DashboardProvider } from '../webview/DashboardProvider';
import { CatalogService } from '../services/catalog';

export function registerCommands(
  context: vscode.ExtensionContext,
  dashboard: DashboardProvider,
  catalogService: CatalogService
) {
  // Session commands
  context.subscriptions.push(
    vscode.commands.registerCommand('codequest.startSession', async () => {
      await dashboard.startSession();
      vscode.window.showInformationMessage('CodeQuest: Session started');
    }),
    vscode.commands.registerCommand('codequest.endSession', async () => {
      await dashboard.endSession();
      vscode.window.showInformationMessage('CodeQuest: Session ended');
    })
  );

  // Problem actions
  context.subscriptions.push(
    vscode.commands.registerCommand('codequest.markSolved', async () => {
      await dashboard.handleMarkSolved();
    }),
    vscode.commands.registerCommand('codequest.openNextUnsolved', async () => {
      await dashboard.handleOpenNextUnsolved();
    }),
    vscode.commands.registerCommand('codequest.newProblem', async () => {
      await dashboard.handleNewProblem();
    }),
    vscode.commands.registerCommand('codequest.importLegacy', () => {
      dashboard.handleCommand('Import Legacy invoked');
      vscode.window.showInformationMessage('CodeQuest: Legacy import invoked');
    }),
    vscode.commands.registerCommand('codequest.previewUiState', async () => {
      const selected = await vscode.window.showQuickPick(
        ['Empty Workspace', 'No File Open', 'Detected Problem', 'Skeleton Loading'],
        { placeHolder: 'Select UI state to preview' }
      );
      if (selected) dashboard.previewUiState(selected);
    })
  );

  // Catalog maintenance
  context.subscriptions.push(
    vscode.commands.registerCommand('codequest.buildCatalog', async () => {
      try {
        await catalogService.buildCatalog();
        vscode.window.showInformationMessage('Catalog built successfully!');
      } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to build catalog: ${error?.message ?? 'Unknown error'}`);
      }
    }),
    vscode.commands.registerCommand('codequest.refreshCatalog', async () => {
      try {
        await catalogService.refreshCatalog();
        vscode.window.showInformationMessage('Catalog refreshed successfully!');
      } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to refresh catalog: ${error?.message ?? 'Unknown error'}`);
      }
    })
  );

  // Extension self-update helper (for dev convenience)
  context.subscriptions.push(
    vscode.commands.registerCommand('codequest.updateExtension', async () => {
      const terminal = vscode.window.createTerminal('CodeQuest Update');
      terminal.show();
      terminal.sendText(`cd "${context.extensionPath}"`);
      terminal.sendText('npm run compile');
      terminal.sendText('vsce package --out codequest-coach-0.1.0.vsix --allow-missing-repository');
      terminal.sendText('code --uninstall-extension you.codequest-coach');
      terminal.sendText('code --install-extension codequest-coach-0.1.0.vsix');
      vscode.window.showInformationMessage('Extension update process started in terminal. Reload VS Code after completion.');
    })
  );

  // Diagnostic and utility commands
  const diag = vscode.window.createOutputChannel('CodeQuest Dashboard');
  context.subscriptions.push(diag);

  context.subscriptions.push(
    vscode.commands.registerCommand('codequest.logDiagnostics', (data?: any) => {
      const stamp = new Date().toISOString();
      diag.appendLine(`[${stamp}] ${typeof data === 'string' ? data : JSON.stringify(data)}`);
      diag.show(true);
    })
  );
}
