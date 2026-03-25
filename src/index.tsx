import 'dotenv/config'

// CRITICAL: Check Claude CLI availability BEFORE any other imports that might load Ink
import './precheck.js'

// Fix Raw mode error
try {
  const stdin = process.stdin as any
  if (!stdin.isTTY) {
    Object.defineProperty(stdin, 'isTTY', {
      get: () => true,
      set: () => {},
      configurable: true
    })
    if (typeof stdin.ref !== 'function') stdin.ref = () => {}
    if (typeof stdin.unref !== 'function') stdin.unref = () => {}
    if (typeof stdin.addListener !== 'function') stdin.addListener = () => stdin
    if (typeof stdin.on !== 'function') stdin.on = () => stdin
    if (typeof stdin.setRawMode !== 'function') stdin.setRawMode = () => {}
    if (typeof stdin.setEncoding !== 'function') stdin.setEncoding = () => {}
    if (typeof stdin.resume !== 'function') stdin.resume = () => {}
    if (typeof stdin.pause !== 'function') stdin.pause = () => {}
  }
} catch (e) {}

// Parse command line args for mode
const args = process.argv.slice(2)
const teamArg = args.includes('--team') || args.includes('-t')
const envMode = process.env.AGENT_HQ_MODE
const teamMode = teamArg || envMode === 'team'

// Import store and set mode
import { useStore, hasClaudeCli, getAppMode, setAppMode } from './store'

if (teamMode) {
  setAppMode('session-agent-team')
} else {
  setAppMode('monitor') // Default: monitor mode
}

import React from 'react'
import { render, Box } from 'ink'
import OfficeView from './components/OfficeView'
import SessionController from './components/SessionController'
import TeamController from './components/TeamController'

const App: React.FC = () => {
  const mode = getAppMode()
  
  return (
    <Box flexDirection="column">
      {mode === 'monitor' && <SessionController />}
      {mode === 'session-agent-team' && <TeamController />}
      <OfficeView cliAvailable={hasClaudeCli()} />
    </Box>
  )
}

render(<App />)
