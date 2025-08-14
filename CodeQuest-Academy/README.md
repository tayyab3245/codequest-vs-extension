# CodeQuest Academy

A VS Code extension and development framework for practicing LeetCode problems with structured learning patterns. This project demonstrates building developer tools for algorithmic practice and progress tracking.

## Project Overview

This repository contains:

1. **CodeQuest Coach VS Code Extension** - A comprehensive dashboard and productivity tool for coding practice
2. **Problem Generation Tools** - Scripts for creating structured practice environments  
3. **Development Framework** - Complete testing, security, and build pipeline

The extension provides a webview dashboard that tracks workspace problems, manages coding sessions, and integrates with VS Code's workflow for seamless algorithmic practice.

## VS Code Extension Features

- **Activity Bar Integration** - Dedicated CodeQuest panel in VS Code
- **Problem Detection** - Automatically scans workspace for homework.js files
- **Live Dashboard** - Real-time problem count, workspace status, and current file tracking
- **Preview Mode** - Test different UI states (Empty Workspace, No File Open, Detected Problem, Skeleton Loading)
- **Security Hardening** - Content Security Policy with nonce-based script execution
- **Comprehensive Testing** - 91 test cases covering unit, integration, and security scenarios

## Project Structure

```
CodeQuest-Academy/
├── codequest-coach/            # VS Code extension (main project)
│   ├── src/                    # TypeScript source code
│   │   ├── extension.ts        # Main extension logic
│   │   ├── lib/               # Pure utility functions
│   │   └── webview/           # HTML/CSS generation
│   ├── media/                  # Extension assets (CSS, JS, icons)
│   ├── test/                   # Comprehensive test suite
│   │   ├── unit/              # Unit tests (security, parsing, HTML)
│   │   ├── integration/       # Integration tests (workspace scanning)
│   │   └── test-fixtures/     # Realistic test data
│   └── dist/                   # Compiled extension bundle
├── problem-generator.js        # Utility for creating practice structures
└── package.json               # Root project configuration
```

## Technical Implementation

### Extension Architecture
- **TypeScript** - Strongly typed development with comprehensive error checking
- **ESBuild** - Fast compilation and bundling (12.7kb output)
- **Mocha/Chai** - Professional testing framework with 91 test cases
- **Content Security Policy** - Nonce-based script execution for security
- **Cross-platform** - Handles Windows/POSIX paths and file systems

### Key Components
- **Problem Path Parser** - Extracts metadata from file paths with pattern recognition
- **Dashboard HTML Builder** - Pure functions for generating secure webview content
- **State Management** - Live workspace scanning with file system watchers
- **Preview System** - Deterministic UI state testing and development
- **Security Layer** - HTML escaping, CSP validation, and XSS prevention

### Development Workflow
```bash
# Install dependencies
cd codequest-coach
npm install

# Run comprehensive test suite (91 tests)
npm test

# Compile extension
npm run compile

# Development with watch mode
npm run watch
```

## Getting Started

1. **Clone the repository**
2. **Install extension dependencies**: `cd codequest-coach && npm install`
3. **Run tests**: `npm test` (should see 91 passing tests)
4. **Compile**: `npm run compile`
5. **Load in VS Code**: Press F5 to launch Extension Development Host

The extension will activate automatically and provide a CodeQuest panel in the Activity Bar.

## Contributing

This project demonstrates modern VS Code extension development with:
- Comprehensive security practices
- Full test coverage (unit, integration, security)
- Clean architecture with pure, testable functions
- Professional development workflow

The codebase serves as an example of building production-ready developer tools with VS Code's extension API.
- Progress tracking directly within the editor

### Installing the Extension
1. Open the `codequest-coach/` folder in VS Code
2. Press F5 to launch the Extension Development Host
3. In the new VS Code window, look for the CodeQuest icon in the Activity Bar

## Progress Tracking

The `progress-tracker/` folder contains web-based tools for visualizing your progress through the problems and tracking your learning journey.

## Getting Started

1. Choose a pattern to focus on
2. Navigate to the specific problem folder
3. Create a dated folder (YYYY-MM-DD format)
4. Add your solution in `homework.js`
5. Use the VS Code extension for enhanced tracking

This structured approach helps maintain consistent practice and allows for easy progress monitoring.
