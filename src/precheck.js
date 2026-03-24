// Pre-check Claude CLI availability BEFORE any other imports that might load Ink
// This file must be required FIRST in index.tsx

const { execSync } = require('child_process')

let hasCli = false
try {
  execSync('claude --version', { stdio: 'ignore', shell: true })
  hasCli = true
} catch {
  hasCli = false
}

console.log('[Precheck] Claude CLI available:', hasCli)

// Store the result globally so we can access it later
global.__CLAUDE_CLI_AVAILABLE__ = hasCli
