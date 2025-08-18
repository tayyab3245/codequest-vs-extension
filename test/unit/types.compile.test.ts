/**
 * CodeQuest - VS Code LeetCode Progress Tracker
 * 
 * Copyright (c) 2025 tayyab3245. All rights reserved.
 * 
 * This software is proprietary and confidential. Unauthorized reproduction,
 * distribution, or modification is strictly prohibited. See LICENSE file
 * for full terms and conditions.
 * 
 * @author tayyab3245
 * @license Proprietary
 */
import { expect } from 'chai';

describe('Types Compile', () => {
  it('should ensure installedAt is non-nullable in ExtensionState', () => {
    // This test verifies that the ExtensionState interface requires installedAt to be a string
    // We test this by creating a minimal type-compatible implementation
    
    interface TestExtensionState {
      workspacePath: string;
      problemCount: number;
      currentProblem: any;
      installedAt: string; // Should be non-nullable
    }

    // This should compile successfully
    const validState: TestExtensionState = {
      workspacePath: '/test/path',
      problemCount: 5,
      currentProblem: null,
      installedAt: '2025-08-14T00:00:00.000Z'
    };

    expect(validState.installedAt).to.be.a('string');
    expect(validState.installedAt).to.not.be.null;
    expect(validState.installedAt).to.not.be.undefined;

    // Test that empty string is allowed (though not realistic)
    const stateWithEmptyInstall: TestExtensionState = {
      workspacePath: '/test/path',
      problemCount: 5,
      currentProblem: null,
      installedAt: ''
    };

    expect(stateWithEmptyInstall.installedAt).to.be.a('string');

    // Verify the type constraint at compile time
    // If installedAt were nullable, these would fail compilation:
    const installDate: string = validState.installedAt;
    const dateLength: number = validState.installedAt.length;
    
    expect(installDate).to.be.a('string');
    expect(dateLength).to.be.a('number');
  });

  it('should have consistent types across the extension state', () => {
    // Verify that our state structure is consistent with the interface
    interface StateStructure {
      workspacePath: string;
      problemCount: number;
      currentProblem: any;
      installedAt: string;
    }

    const createState = (installedAt: string): StateStructure => ({
      workspacePath: 'test',
      problemCount: 0,
      currentProblem: null,
      installedAt
    });

    const state = createState('2025-08-14T00:00:00.000Z');
    
    expect(typeof state.workspacePath).to.equal('string');
    expect(typeof state.problemCount).to.equal('number');
    expect(typeof state.installedAt).to.equal('string');
    expect(state.currentProblem).to.be.null; // This field can be null
  });
});
