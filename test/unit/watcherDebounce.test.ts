import { expect } from 'chai';
import * as sinon from 'sinon';

describe('Watcher Debounce', () => {
  let clock: sinon.SinonFakeTimers;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

  it('should debounce rapid watcher events to a single scan call', async () => {
    const scanSpy = sinon.spy();

    // Create a minimal mock of the debounced refresh logic
    class TestDashboardProvider {
      private refreshDebounce?: NodeJS.Timeout;

      async scanWorkspaceProblems() {
        scanSpy();
        return 3; // mock result
      }

      async refreshProblemCount() {
        if (this.refreshDebounce) {
          clearTimeout(this.refreshDebounce);
        }
        
        this.refreshDebounce = setTimeout(async () => {
          await this.scanWorkspaceProblems();
        }, 200);
      }

      dispose() {
        if (this.refreshDebounce) {
          clearTimeout(this.refreshDebounce);
          this.refreshDebounce = undefined;
        }
      }
    }

    const provider = new TestDashboardProvider();

    // Simulate rapid file system events
    provider.refreshProblemCount(); // Event 1
    provider.refreshProblemCount(); // Event 2 (should cancel event 1)
    provider.refreshProblemCount(); // Event 3 (should cancel event 2)

    // Verify no scans have happened yet
    expect(scanSpy.callCount).to.equal(0);

    // Advance time by 199ms (just before the debounce delay)
    clock.tick(199);
    expect(scanSpy.callCount).to.equal(0);

    // Advance time by 1ms more (exactly at 200ms)
    clock.tick(1);
    expect(scanSpy.callCount).to.equal(1);

    // Clean up
    provider.dispose();
  });

  it('should allow multiple scans if they are spaced apart', async () => {
    const scanSpy = sinon.spy();

    class TestDashboardProvider {
      private refreshDebounce?: NodeJS.Timeout;

      async scanWorkspaceProblems() {
        scanSpy();
        return 3;
      }

      async refreshProblemCount() {
        if (this.refreshDebounce) {
          clearTimeout(this.refreshDebounce);
        }
        
        this.refreshDebounce = setTimeout(async () => {
          await this.scanWorkspaceProblems();
        }, 200);
      }
    }

    const provider = new TestDashboardProvider();

    // First batch of events
    provider.refreshProblemCount();
    clock.tick(200);
    expect(scanSpy.callCount).to.equal(1);

    // Second batch of events after debounce period
    provider.refreshProblemCount();
    clock.tick(200);
    expect(scanSpy.callCount).to.equal(2);
  });
});
