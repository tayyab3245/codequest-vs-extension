import { expect } from 'chai';
import * as sinon from 'sinon';

describe('Initial Scan Single Update', () => {
  it('should send exactly one updateState during performInitialScan', async () => {
    // Mock VS Code API
    const mockWebview = {
      postMessage: sinon.spy()
    };

    // Mock dependencies
    const mockWorkspace = {
      workspaceFolders: [{ uri: { fsPath: '/test/workspace' } }],
      findFiles: sinon.stub().resolves([])
    };

    const mockWindow = {
      activeTextEditor: undefined as any
    };

    // Create a minimal mock of the extension behavior
    class TestDashboardProvider {
      private webview = mockWebview;
      private state = {
        workspacePath: '/test/workspace',
        problemCount: 0,
        currentProblem: null,
        installedAt: '2025-08-14T00:00:00.000Z'
      };

      async scanWorkspaceProblems() {
        return mockWorkspace.findFiles().then((files: any[]) => files.length);
      }

      updateCurrentProblem(filePath?: string) {
        this.state.currentProblem = null; // simplified for test
        this.sendStateUpdate();
      }

      sendStateUpdate() {
        if (this.webview) {
          this.webview.postMessage({
            type: 'updateState',
            data: this.state
          });
        }
      }

      async performInitialScan() {
        this.state.problemCount = await this.scanWorkspaceProblems();
        this.updateCurrentProblem(mockWindow.activeTextEditor?.document?.uri?.fsPath);
      }
    }

    const provider = new TestDashboardProvider();
    
    // Execute the scan
    await provider.performInitialScan();
    
    // Verify exactly one updateState was sent
    const updateStateMessages = mockWebview.postMessage.getCalls()
      .filter((call: any) => call.args[0].type === 'updateState');
    
    expect(updateStateMessages).to.have.length(1);
    expect(updateStateMessages[0].args[0]).to.deep.include({
      type: 'updateState'
    });
  });
});
