import { useState, useEffect, useRef } from 'react'
import { X, FolderOpen } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useWebSocket } from '../hooks/useWebSocket'
import styles from './NewSessionModal.module.css'

export default function NewSessionModal() {
  const { setShowNewSessionModal, setCurrentSession, sessions } = useAppStore()
  const { switchSession } = useWebSocket()

  const [workDir, setWorkDir] = useState('')
  const [initialPrompt, setInitialPrompt] = useState('')
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowNewSessionModal(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setShowNewSessionModal])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowNewSessionModal(false)
    }
  }

  const handleBrowse = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      // Get the first selected directory's path
      // Note: webkitdirectory returns the folder path
      const file = files[0] as File & { path?: string }
      if (file.path) {
        setWorkDir(file.path)
        setError('')
      }
    }
  }

  const handleStart = async () => {
    if (!workDir.trim()) {
      setError('Working directory is required')
      return
    }

    setIsCreating(true)
    setError('')

    try {
      // Check if workDir already exists in sessions (as an existing project)
      const existingSession = sessions.find(s => s.workDir === workDir)
      if (existingSession) {
        // Switch to existing session directly
        setCurrentSession(existingSession.id)
        switchSession(workDir)
      } else {
        // Create new session via API then switch
        const res = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workDir, initialPrompt: initialPrompt.trim() || undefined }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Failed to create session' }))
          throw new Error(err.error || 'Failed to create session')
        }
        // Switch to the new workDir - findOrCreateSession will handle it
        switchSession(workDir)
      }
      setShowNewSessionModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session')
      setIsCreating(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>New Session</h2>
          <button
            className={styles.closeBtn}
            onClick={() => setShowNewSessionModal(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.field}>
            <label className={styles.label}>Working Directory</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className={styles.input}
                value={workDir}
                onChange={(e) => {
                  setWorkDir(e.target.value)
                  setError('')
                }}
                placeholder="/path/to/project"
              />
              <button
                className={styles.browseBtn}
                onClick={handleBrowse}
                title="Browse folder"
              >
                <FolderOpen size={18} />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              {...({ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <p className={styles.hint}>Select the project folder for this session</p>
            {error && workDir.trim() === '' && (
              <p className={styles.error}>{error}</p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Initial Prompt (optional)</label>
            <textarea
              className={styles.textarea}
              value={initialPrompt}
              onChange={(e) => setInitialPrompt(e.target.value)}
              placeholder="What would you like to work on?"
            />
          </div>
        </div>

        <div className={styles.footer}>
          <button
            className={styles.cancelBtn}
            onClick={() => setShowNewSessionModal(false)}
          >
            Cancel
          </button>
          <button
            className={styles.startBtn}
            onClick={handleStart}
            disabled={isCreating || !workDir.trim()}
          >
            {isCreating ? 'Creating...' : 'Start'}
          </button>
        </div>
      </div>
    </div>
  )
}
