# CodeQuest Coach VS Code Extension

A VS Code extension that provides a **sidebar dashboard** for tracking your LeetCode practice progress directly within VS Code. Automatically scans your workspace for coding problems and displays current progress with pattern recognition and difficulty estimation.

## Features

- **Activity Bar Integration**: Adds a CodeQuest icon to VS Code Activity Bar
- **Dashboard View**: Real-time workspace scanning and problem detection
- **Pattern Recognition**: Automatically parses problem structure from file paths
- **Progress Tracking**: Persistent state tracking with installation history
- **Command Integration**: Session management and problem tracking commands

## Where to Find the Extension

1. **Activity Bar**: Look for the CodeQuest icon (puzzle piece) in the left sidebar
2. **Dashboard Panel**: Click the icon to reveal the Dashboard view
3. **Command Palette**: Access commands via `Ctrl+Shift+P` -> "CodeQuest:"

## Development Setup

### Prerequisites
- VS Code 1.86.0 or higher
- Node.js and npm

### Local Development
```bash
# Install dependencies
npm install

# Compile the extension
npm run compile

# Or run in watch mode for development
npm run watch
```

### Testing the Extension
1. Open this folder (`codequest-coach`) in VS Code
2. Press **F5** to launch Extension Development Host
3. In the new VS Code window:
   - Look for the CodeQuest icon in the Activity Bar
   - Click it to open the Dashboard
   - Open a `homework.js` file matching the pattern to see problem detection

## Run & Debug
Press **F5** to launch the extension in debug mode. The first run triggers a background watch build that automatically rebuilds the extension when you make changes to the source code.

### Expected Project Structure
The extension works best with projects following this structure:
```
patterns/
  <pattern-name>/
    problem-<number>-<slug>/
      <YYYY-MM-DD>/
        homework.js
```

Example:
```
patterns/
  arrays-and-hashing/
    problem-001-contains-duplicate/
      2025-07-17/
        homework.js
```

## Available Commands

Access these via Command Palette (`Ctrl+Shift+P`):

- **CodeQuest: Start Session** - Begin a practice session
- **CodeQuest: End Session** - End current session  
- **CodeQuest: Mark Current Problem Solved** - Mark active problem as completed
- **CodeQuest: Import Legacy Training File** - Import existing training data

## Dashboard Features

- **Workspace Status**: Shows current workspace path and problem count
- **Current Problem**: Displays details when a matching `homework.js` file is open:
  - Pattern name (e.g., "Arrays And Hashing")
  - Problem number and name
  - Practice date
  - Estimated difficulty (Easy/Medium/Hard)
- **Installation Tracking**: Shows when the extension was first installed

## Build Scripts

- `npm run compile` - Build the extension for production
- `npm run watch` - Build and watch for file changes during development
- `npm run vscode:prepublish` - Prepare extension for publishing

## Testing

The extension includes a comprehensive test suite with both unit and integration tests.

### Running Tests

```bash
# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests  
npm run test:integration

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

**Unit Tests** (`test/unit/`):
- `problemPath.test.ts` - Path parsing, slug conversion, difficulty inference (51 test cases)
- `htmlCsp.test.ts` - HTML generation and Content Security Policy validation (23 test cases)

**Integration Tests** (`test/integration/`):
- `scanProblems.test.ts` - Workspace scanning and file discovery (11 test cases)

### Test Fixtures

The test suite includes realistic workspace fixtures in `test-fixtures/`:
- `basic-workspace/` - Contains sample problems matching expected structure
- `empty-workspace/` - Empty directory for testing edge cases

### Dependencies

Testing uses Mocha and Chai with TypeScript support:
- `mocha` - Test runner
- `chai` - Assertion library 
- `ts-node` - TypeScript execution for tests
- `@types/mocha`, `@types/chai` - Type definitions

## Architecture

- **Extension Host**: `src/extension.ts` - Main extension logic
- **Dashboard Provider**: Manages webview and state updates
- **Workspace Scanner**: Automatically finds and counts problem files
- **Path Parser**: Extracts metadata from file paths using regex patterns
- **State Management**: Uses VS Code globalState for persistence

This extension serves as a foundation for enhanced coding practice workflows within VS Code.
