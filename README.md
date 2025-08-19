# CodeQuest

**Master LeetCode patterns directly in VS Code.** CodeQuest transforms your coding practice into a visual journey with progress tracking, pattern mastery, and intelligent insights.

![Pattern Mastery View](docs/screenshots/patterns.png)

![CodeQuest Activity Dashboard](docs/screenshots/activity-demo.png)

![CodeQuest Problem Generator](docs/screenshots/problems.png)

## Features

- **Visual Progress Dashboard** - Track your LeetCode journey with GitHub-style contribution heatmaps
- **Pattern Mastery System** - Focus on the 75 essential coding patterns with structured learning paths  
- **Smart Workspace Detection** - Automatically discovers and categorizes your coding problems
- **Difficulty-Based Progress** - Easy/Medium/Hard tracking with visual indicators
- **Session Analytics** - Monitor your practice consistency and improvement over time
- **Real-time Sync** - Instantly updates as you solve problems in your workspace


## Quick Start

### Local Development Setup
1. **Clone Repository**: `git clone https://github.com/tayyab3245/codequest-vs-extension.git`
2. **Install Dependencies**: `cd CodeQuest-Coach && npm install`
3. **Open in VS Code**: Open the project folder in VS Code
4. **Run Extension**: Press `F5` to launch Extension Development Host
5. **Activate**: In the new VS Code window, click the CodeQuest icon in the Activity Bar
6. **Practice**: Organize your LeetCode solutions and watch your progress grow

## Expected Workspace Structure

CodeQuest works best when your coding problems follow this pattern:
```
leetcode/
├── arrays-and-hashing/
│   ├── two-sum/homework.js
│   ├── group-anagrams/homework.py
│   └── top-k-frequent/homework.cpp
├── two-pointers/
│   ├── valid-palindrome/homework.js
│   └── 3sum/homework.py
└── sliding-window/
    ├── longest-substring/homework.js
    └── minimum-window/homework.py
```

## Pattern Categories

CodeQuest recognizes 15+ essential coding patterns including:
- Arrays & Hashing
- Two Pointers  
- Sliding Window
- Stack & Queues
- Binary Search
- Linked Lists
- Trees & Graphs
- Dynamic Programming
- Backtracking
- And more...

## Progress Tracking

- **Daily Activity Heatmap** - Visualize your coding consistency
- **Pattern Completion Status** - See which areas need more practice  
- **Difficulty Distribution** - Balance your Easy/Medium/Hard problem solving
- **Session History** - Track your practice sessions over time

## Known Issues

- **File Generation**: Selecting a problem in the dashboard doesn't automatically generate the problem file sometimes.

## Future Enhancements

- **AI-Powered Insights** - Get personalized recommendations based on your progress patterns
- **Smart Problem Suggestions** - Intelligent next-problem recommendations  
- **Performance Analytics** - Advanced metrics and learning insights
- **Study Plan Generation** - Automated study schedules based on your goals

## Development

```bash
# Clone and setup
git clone https://github.com/tayyab3245/CodeQuest-Coach
cd CodeQuest-Coach
npm install

# Run in development mode
npm run watch
# Press F5 in VS Code to launch Extension Development Host

# Run tests
npm test
```

## License

Copyright (c) 2025 tayyab3245. All rights reserved.

This software is proprietary and confidential. See [LICENSE](LICENSE) for full terms.

---

**Ready to master coding patterns?** Setup CodeQuest and transform your LeetCode practice into a visual, data-driven journey!
