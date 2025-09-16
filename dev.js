#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Study AI Platform...');
console.log('📱 Frontend will be available at: http://localhost:3000');
console.log('🔧 Backend will be available at: http://localhost:3001');
console.log('');

// Start backend
const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

// Start frontend
const frontend = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  backend.kill();
  frontend.kill();
  process.exit();
});

backend.on('close', (code) => {
  if (code !== 0) {
    console.log(`Backend process exited with code ${code}`);
  }
});

frontend.on('close', (code) => {
  if (code !== 0) {
    console.log(`Frontend process exited with code ${code}`);
  }
});