import { useEffect } from 'react'
import { useAppStore } from './stores/appStore'
import { useWebSocket } from './hooks/useWebSocket'
import Header from './components/Header'
import TerminalPanel from './components/TerminalPanel'
import AgentPanel from './components/AgentPanel'
import StatusBar from './components/StatusBar'
import NewSessionModal from './components/NewSessionModal'
import './styles/globals.css'

export default function App() {
  const { showNewSessionModal, fetchSessions } = useAppStore()
  const { reconnect } = useWebSocket()

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Fetch sessions periodically
  useEffect(() => {
    const interval = setInterval(fetchSessions, 5000)
    return () => clearInterval(interval)
  }, [fetchSessions])

  return (
    <div className="app">
      <Header onReconnect={reconnect} />
      <main className="main-content">
        <TerminalPanel />
        <AgentPanel />
      </main>
      <StatusBar />
      {showNewSessionModal && <NewSessionModal />}
    </div>
  )
}
