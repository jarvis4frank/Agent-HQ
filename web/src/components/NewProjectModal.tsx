import { useState } from 'react'
import { X } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import styles from './NewProjectModal.module.css'

interface NewProjectModalProps {
  onClose: () => void
}

export default function NewProjectModal({ onClose }: NewProjectModalProps) {
  const { fetchProjects } = useAppStore()
  
  const [workDir, setWorkDir] = useState('')
  const [initialPrompt, setInitialPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!workDir.trim()) {
      setError('Working directory is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          path: workDir.trim(),
          initialPrompt: initialPrompt.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (data.project) {
        // Refresh projects list
        await fetchProjects()
        
        // If there's an initial prompt, we could send it to the terminal
        // For now, just close the modal - the project will appear in the list
        onClose()
      } else {
        setError(data.error || 'Failed to create project')
      }
    } catch (e) {
      setError('Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>New Project</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form className={styles.content} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="workDir">
              Working Directory
            </label>
            <input
              id="workDir"
              type="text"
              className={styles.input}
              placeholder="/path/to/project"
              value={workDir}
              onChange={(e) => setWorkDir(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="initialPrompt">
              Initial Prompt
            </label>
            <textarea
              id="initialPrompt"
              className={`${styles.input} ${styles.textarea}`}
              placeholder="What would you like Claude to work on?"
              value={initialPrompt}
              onChange={(e) => setInitialPrompt(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={loading || !workDir.trim()}
            >
              {loading ? 'Creating...' : 'Start Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}