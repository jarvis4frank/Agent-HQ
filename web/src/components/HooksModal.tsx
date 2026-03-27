import { useState } from 'react'
import { CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './Dialog'
import styles from './HooksModal.module.css'

interface HooksModalProps {
  onClose: () => void
}

export default function HooksModal({ onClose }: HooksModalProps) {
  const { 
    hooksConfigured, 
    hooksHookScriptExists, 
    hooksConfiguredEvents,
    setHooksStatus,
  } = useAppStore()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleOneClickSetup = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    
    try {
      const res = await fetch('/api/hooks/setup', { method: 'POST' })
      const data = await res.json()
      
      if (data.success) {
        setSuccess(true)
        setHooksStatus({
          configured: data.configured,
          hookScriptExists: data.hookScriptExists,
          hooksConfigured: data.hooksConfigured,
        })
      } else {
        setError(data.error || 'Failed to setup hooks')
      }
    } catch (e) {
      setError('Failed to setup hooks')
    } finally {
      setLoading(false)
    }
  }

  const handleManualSetup = () => {
    // Open Claude Code settings documentation
    window.open('https://docs.anthropic.com/en/docs/claude-code/hooks', '_blank')
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Claude Hooks Setup</DialogTitle>
          <DialogDescription>
            Configure hooks to track agent events in Agent HQ
          </DialogDescription>
        </DialogHeader>

        <div className={styles.content}>
          {/* Status Display */}
          <div className={styles.statusSection}>
            <div className={`${styles.statusBadge} ${hooksConfigured ? styles.configured : styles.notConfigured}`}>
              {hooksConfigured ? (
                <>
                  <CheckCircle size={16} />
                  <span>Configured</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={16} />
                  <span>Not Configured</span>
                </>
              )}
            </div>
            
            <div className={styles.statusDetails}>
              <div className={styles.statusItem}>
                <span className={styles.label}>Hook Script:</span>
                <span className={hooksHookScriptExists ? styles.success : styles.error}>
                  {hooksHookScriptExists ? 'exists' : 'missing'}
                </span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.label}>Events Configured:</span>
                <span className={styles.value}>
                  {hooksConfiguredEvents.length > 0 ? hooksConfiguredEvents.join(', ') : 'none'}
                </span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className={styles.success}>
              Hooks configured successfully! Agent events will now be tracked.
            </div>
          )}
        </div>

        <DialogFooter>
          {/* Action Buttons */}
          {!hooksConfigured && (
            <div className={styles.actions}>
              <button 
                className={styles.primaryBtn}
                onClick={handleOneClickSetup}
                disabled={loading}
              >
                {loading ? 'Setting up...' : 'One-click Setup'}
              </button>
              <button 
                className={styles.secondaryBtn}
                onClick={handleManualSetup}
              >
                <ExternalLink size={14} />
                View Manual Setup
              </button>
            </div>
          )}

          {/* Already configured info */}
          {hooksConfigured && (
            <div className={styles.configuredInfo}>
              <p>Hooks are already configured! Agent events will be tracked automatically.</p>
              <p className={styles.hint}>
                To modify hooks, edit ~/.claude/settings.json or ~/.claude/hooks/send-hook.sh
              </p>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
