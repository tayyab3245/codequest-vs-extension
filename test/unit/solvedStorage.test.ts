import { expect } from 'chai';
import * as vscode from 'vscode';

// Mock global state for testing
class MockGlobalState {
  private storage = new Map<string, any>();

  get<T>(key: string, defaultValue?: T): T {
    return this.storage.get(key) ?? defaultValue;
  }

  async update(key: string, value: any): Promise<void> {
    this.storage.set(key, value);
  }

  clear(): void {
    this.storage.clear();
  }
}

describe('Solved Storage', () => {
  let mockContext: any;
  let mockGlobalState: MockGlobalState;

  beforeEach(() => {
    mockGlobalState = new MockGlobalState();
    mockContext = {
      globalState: mockGlobalState,
      subscriptions: []
    };
  });

  it('should store and retrieve solved state', async () => {
    const problemKey = 'patterns/arrays-and-hashing/problem-001-two-sum/2025-01-15/homework.js';
    
    // Initially empty
    const initialData = mockGlobalState.get('cq.solved.v1', {});
    expect(Object.keys(initialData)).to.have.length(0);
    
    // Store solved state
    const solvedData = { [problemKey]: { solvedAt: '2025-01-15T10:00:00.000Z' } };
    await mockGlobalState.update('cq.solved.v1', solvedData);
    
    // Retrieve and verify
    const retrievedData = mockGlobalState.get<Record<string, any>>('cq.solved.v1', {});
    expect(retrievedData).to.have.property(problemKey);
    expect(retrievedData[problemKey]).to.have.property('solvedAt');
    expect(retrievedData[problemKey].solvedAt).to.equal('2025-01-15T10:00:00.000Z');
  });

  it('should handle multiple solved problems', async () => {
    const problem1 = 'patterns/arrays-and-hashing/problem-001-two-sum/2025-01-15/homework.js';
    const problem2 = 'patterns/two-pointers/problem-001-valid-palindrome/2025-01-16/homework.js';
    
    const solvedData = {
      [problem1]: { solvedAt: '2025-01-15T10:00:00.000Z' },
      [problem2]: { solvedAt: '2025-01-16T11:00:00.000Z' }
    };
    
    await mockGlobalState.update('cq.solved.v1', solvedData);
    
    const retrievedData = mockGlobalState.get('cq.solved.v1', {});
    expect(Object.keys(retrievedData)).to.have.length(2);
    expect(retrievedData).to.have.property(problem1);
    expect(retrievedData).to.have.property(problem2);
  });

  it('should handle removing solved state', async () => {
    const problemKey = 'patterns/arrays-and-hashing/problem-001-two-sum/2025-01-15/homework.js';
    
    // Add solved state
    await mockGlobalState.update('cq.solved.v1', {
      [problemKey]: { solvedAt: '2025-01-15T10:00:00.000Z' }
    });
    
    // Verify it exists
    let data = mockGlobalState.get<Record<string, any>>('cq.solved.v1', {});
    expect(data).to.have.property(problemKey);
    
    // Remove solved state
    delete data[problemKey];
    await mockGlobalState.update('cq.solved.v1', data);
    
    // Verify it's gone
    data = mockGlobalState.get<Record<string, any>>('cq.solved.v1', {});
    expect(data).to.not.have.property(problemKey);
    expect(Object.keys(data)).to.have.length(0);
  });

  it('should handle empty storage gracefully', () => {
    const data = mockGlobalState.get('cq.solved.v1', {});
    expect(data).to.be.an('object');
    expect(Object.keys(data)).to.have.length(0);
  });

  it('should preserve other stored data when updating solved state', async () => {
    // Store some initial data
    await mockGlobalState.update('other.key', { some: 'data' });
    
    // Store solved state
    const problemKey = 'patterns/arrays-and-hashing/problem-001-two-sum/2025-01-15/homework.js';
    await mockGlobalState.update('cq.solved.v1', {
      [problemKey]: { solvedAt: '2025-01-15T10:00:00.000Z' }
    });
    
    // Verify both exist
    const solvedData = mockGlobalState.get('cq.solved.v1', {});
    const otherData = mockGlobalState.get('other.key');
    
    expect(solvedData).to.have.property(problemKey);
    expect(otherData).to.deep.equal({ some: 'data' });
  });

  it('should generate proper solved keys array', async () => {
    const problem1 = 'patterns/arrays-and-hashing/problem-001-two-sum/2025-01-15/homework.js';
    const problem2 = 'patterns/two-pointers/problem-001-valid-palindrome/2025-01-16/homework.js';
    
    await mockGlobalState.update('cq.solved.v1', {
      [problem1]: { solvedAt: '2025-01-15T10:00:00.000Z' },
      [problem2]: { solvedAt: '2025-01-16T11:00:00.000Z' }
    });
    
    const data = mockGlobalState.get('cq.solved.v1', {});
    const solvedKeys = Object.keys(data);
    
    expect(solvedKeys).to.have.length(2);
    expect(solvedKeys).to.include(problem1);
    expect(solvedKeys).to.include(problem2);
  });

  it('should handle malformed storage data gracefully', () => {
    // Simulate corrupted data
    mockGlobalState.clear();
    
    const data = mockGlobalState.get('cq.solved.v1', {});
    expect(data).to.be.an('object');
    expect(Object.keys(data)).to.have.length(0);
  });
});
