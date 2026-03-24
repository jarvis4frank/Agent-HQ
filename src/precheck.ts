// Pre-check Claude CLI availability BEFORE any other imports that might load Ink
// This file must be imported FIRST in index.tsx

import { spawnSync } from 'child_process'

let hasCli = false
try {
  const result = spawnSync('claude', ['--version'], { stdio: 'ignore' })
  hasCli = result.status === 0
} catch {
  hasCli = false
}

console.log('[Precheck] Claude CLI available:', hasCli)

// Store the result globally so we can access it later
;(globalThis as any).__CLAUDE_CLI_AVAILABLE__ = hasCli
