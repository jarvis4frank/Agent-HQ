import { useEffect } from 'react'
import { useAppStore } from './stores/appStore'
import { WebSocketProvider, useWebSocket } from './hooks/useWebSocket'
import Header from './components/Header'
import TerminalPanel from './components/TerminalPanel'
import AgentPanel from './components/AgentPanel'
import StatusBar from './components/StatusBar'
import './styles/globals.css'

function AppContent() {
  const { fetchProjects, terminalMode } = useAppStore()
  const { reconnect } = useWebSocket()

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // Fetch projects periodically
  useEffect(() => {
    const interval = setInterval(fetchProjects, 5000)
    return () => clearInterval(interval)
  }, [fetchProjects])

  return (
    <div className={`app terminal-${terminalMode}`}>
      <Header onReconnect={reconnect} />
      <main className="main-content">
        {terminalMode !== 'full' && <AgentPanel />}
        {terminalMode !== 'collapsed' && <TerminalPanel />}
      </main>
      <StatusBar />
    </div>
  )
}

export default function App() {
  return (
    <WebSocketProvider>
      <AppContent />
    </WebSocketProvider>
  )
}
