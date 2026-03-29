import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react'
import { useAppStore } from '../stores/appStore'

interface HooksModalProps {
  onClose: () => void
  isOpen: boolean
}

export default function HooksModal({ onClose, isOpen }: HooksModalProps) {
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
    window.open('https://docs.anthropic.com/en/docs/claude-code/hooks', '_blank')
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Claude Hooks Setup</DialogTitle>
          <DialogDescription>
            Configure Claude Code hooks to track agent events.
          </DialogDescription>
        </DialogHeader>

        {/* Status Display */}
        <div className="mb-5">
          <div
            className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
              hooksConfigured
                ? 'bg-green-900/30 text-green-400'
                : 'bg-amber-900/30 text-amber-400'
            }`}
          >
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

          <div className="mt-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground min-w-[100px]">Hook Script:</span>
              <span className={hooksHookScriptExists ? 'text-green-400' : 'text-red-400'}>
                {hooksHookScriptExists ? 'exists' : 'missing'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground min-w-[100px]">Events Configured:</span>
              <span className="text-foreground">
                {hooksConfiguredEvents.length > 0 ? hooksConfiguredEvents.join(', ') : 'none'}
              </span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-sm border border-red-900/30 bg-red-900/10 px-3 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 rounded-sm border border-green-900/30 bg-green-900/10 px-3 py-3 text-sm text-green-400">
            Hooks configured successfully! Agent events will now be tracked.
          </div>
        )}

        {/* Action Buttons */}
        {!hooksConfigured && (
          <div className="flex flex-col gap-2.5">
            <Button onClick={handleOneClickSetup} disabled={loading}>
              {loading ? 'Setting up...' : 'One-click Setup'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleManualSetup}>
              <ExternalLink size={14} />
              View Manual Setup
            </Button>
          </div>
        )}

        {/* Already configured info */}
        {hooksConfigured && (
          <div className="rounded-md bg-muted px-4 py-4">
            <p className="mb-2 text-sm text-foreground">
              Hooks are already configured! Agent events will be tracked automatically.
            </p>
            <p className="text-xs text-muted-foreground">
              To modify hooks, edit ~/.claude/settings.json or ~/.claude/hooks/send-hook.sh
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
