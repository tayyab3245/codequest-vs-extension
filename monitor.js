#!/usr/bin/env node

// Automated Extension Health Monitor
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 CodeQuest Extension Health Monitor Started');
console.log('📊 Monitoring compilation, tests, and runtime health...\n');

let healthChecks = 0;
const startTime = Date.now();

function logStatus(status, message) {
  const timestamp = new Date().toLocaleTimeString();
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  console.log(`[${timestamp}] [${uptime}s] ${status} ${message}`);
}

function checkCompilation() {
  return new Promise((resolve) => {
    exec('npm run compile', { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error) {
        logStatus('❌', `Compilation failed: ${error.message}`);
        resolve(false);
      } else {
        logStatus('✅', 'Compilation successful');
        resolve(true);
      }
    });
  });
}

function checkTests() {
  return new Promise((resolve) => {
    exec('npm test', { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error) {
        logStatus('❌', `Tests failed: ${error.message}`);
        resolve(false);
      } else {
        const testCount = (stdout.match(/passing/g) || []).length;
        logStatus('✅', `All tests passing (${stdout.match(/\d+ passing/)?.[0] || 'unknown count'})`);
        resolve(true);
      }
    });
  });
}

function checkFileIntegrity() {
  const criticalFiles = [
    'dist/extension.js',
    'package.json',
    'src/extension.ts',
    'media/dashboard.css',
    'media/dashboard.js'
  ];
  
  for (const file of criticalFiles) {
    if (!fs.existsSync(file)) {
      logStatus('❌', `Critical file missing: ${file}`);
      return false;
    }
  }
  
  logStatus('✅', 'All critical files present');
  return true;
}

async function runHealthCheck() {
  healthChecks++;
  logStatus('🔍', `Health check #${healthChecks} starting...`);
  
  const compilationOk = await checkCompilation();
  const testsOk = await checkTests();
  const filesOk = checkFileIntegrity();
  
  if (compilationOk && testsOk && filesOk) {
    logStatus('💚', 'Extension is healthy and ready!');
  } else {
    logStatus('💥', 'Extension has issues that need attention!');
  }
  
  console.log('─'.repeat(60));
}

// Initial health check
runHealthCheck();

// Monitor every 30 seconds
setInterval(runHealthCheck, 30000);

// Monitor file changes
if (fs.existsSync('src')) {
  fs.watch('src', { recursive: true }, (eventType, filename) => {
    if (filename && filename.endsWith('.ts')) {
      logStatus('👀', `Source file changed: ${filename}`);
    }
  });
}

logStatus('🎯', 'Extension monitor is now running...');
logStatus('📋', 'Your extension should be available in the Extension Development Host window');
logStatus('🔍', 'Look for "CodeQuest" in the Activity Bar (left sidebar)');
