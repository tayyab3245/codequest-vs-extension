const fs = require('fs');
const path = require('path');

class ProblemGenerator {
    constructor() {
        this.baseDir = path.join(__dirname);
        this.patternsDir = path.join(this.baseDir, 'patterns');
    }

    createNewProblem(pattern, problemNumber, problemName, difficulty = 'Easy') {
        const today = new Date().toISOString().split('T')[0];
        const problemDir = `problem-${problemNumber.toString().padStart(3, '0')}-${this.slugify(problemName)}`;
        const fullPath = path.join(this.patternsDir, pattern, problemDir, today);

        // Create directory structure
        fs.mkdirSync(fullPath, { recursive: true });

        // Create homework.js file
        const homeworkContent = this.generateHomeworkTemplate(problemName, pattern, difficulty, problemNumber);
        fs.writeFileSync(path.join(fullPath, 'homework.js'), homeworkContent);

        console.log(`✅ Created new problem: ${problemName}`);
        console.log(`📁 Location: ${fullPath}`);
        console.log(`🎯 Pattern: ${pattern}`);
        console.log(`⭐ Difficulty: ${difficulty}`);
    }

    generateHomeworkTemplate(problemName, pattern, difficulty, problemNumber) {
        const date = new Date().toISOString().split('T')[0];
        return `/*
🎮 CodeQuest Academy - Daily Quest Log
📅 Date: ${date}
🏷️ Pattern: ${this.capitalizePattern(pattern)}
🎯 Problem: ${problemName} (Problem #${problemNumber.toString().padStart(3, '0')})
⭐ Difficulty: ${difficulty}
🔗 NeetCode: https://neetcode.io/problems/

=== PROBLEM DESCRIPTION ===
// Copy the problem description here

=== MY APPROACH ===
// Write your approach here before coding
// 1. 
// 2. 
// 3. 

=== SOLUTION ===
*/

function ${this.functionName(problemName)}() {
    // Your solution goes here
    
}

// Test cases
console.log(${this.functionName(problemName)}()); // Expected: 

/*
=== REFLECTION ===
// After solving, reflect on:
// - What did I learn?
// - What was challenging?
// - How can I improve?
// - Time complexity: O(?)
// - Space complexity: O(?)

=== NEXT STEPS ===
// What pattern or concept should I focus on next?
*/`;
    }

    slugify(text) {
        return text.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    capitalizePattern(pattern) {
        return pattern.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' & ');
    }

    functionName(problemName) {
        return problemName.toLowerCase()
            .replace(/[^a-z0-9]+/g, '')
            .replace(/^[0-9]+/, '');
    }

    listProblems() {
        const patterns = fs.readdirSync(this.patternsDir);
        
        patterns.forEach(pattern => {
            console.log(`\n📂 ${this.capitalizePattern(pattern)}:`);
            const patternPath = path.join(this.patternsDir, pattern);
            const problems = fs.readdirSync(patternPath);
            
            problems.forEach(problem => {
                const problemPath = path.join(patternPath, problem);
                const dates = fs.readdirSync(problemPath);
                console.log(`  └── ${problem} (${dates.length} attempt${dates.length === 1 ? '' : 's'})`);
            });
        });
    }
}

// CLI usage
if (require.main === module) {
    const generator = new ProblemGenerator();
    const args = process.argv.slice(2);
    
    if (args[0] === 'create') {
        const [_, pattern, problemNumber, problemName, difficulty] = args;
        if (!pattern || !problemNumber || !problemName) {
            console.log('Usage: node problem-generator.js create <pattern> <number> <name> [difficulty]');
            console.log('Example: node problem-generator.js create arrays-and-hashing 2 "Valid Anagram" Easy');
            process.exit(1);
        }
        generator.createNewProblem(pattern, parseInt(problemNumber), problemName, difficulty);
    } else if (args[0] === 'list') {
        generator.listProblems();
    } else {
        console.log('Available commands:');
        console.log('  create <pattern> <number> <name> [difficulty] - Create a new problem');
        console.log('  list - List all problems');
    }
}

module.exports = ProblemGenerator;
