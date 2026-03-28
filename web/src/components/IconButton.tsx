import { useState } from 'react'
import { LucideIcon } from 'lucide-react'

interface IconButtonProps {
  icon: LucideIcon
  label?: string
  onClick?: () => void
  variant?: 'default' | 'primary' | 'danger' | 'ghost' | 'success' | 'warning'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

export default function IconButton({ 
  icon: Icon, 
  label, 
  onClick, 
  variant = 'default',
  size = 'md',
  disabled = false
}: IconButtonProps) {
  const sizeStyles = {
    sm: { width: 24, height: 24 },
    md: { width: 32, height: 32 }, 
    lg: { width: 40, height: 40 }
  }
  
  const variantStyles = {
    default: { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' },
    primary: { backgroundColor: 'var(--accent-blue)', color: 'white' },
    danger: { backgroundColor: 'transparent', color: 'var(--accent-red)' },
    ghost: { backgroundColor: 'transparent', color: 'var(--text-secondary)' },
    success: { backgroundColor: '#2ecc71', color: 'white' },
    warning: { backgroundColor: '#f1c40f', color: 'black' }
  }

  const variantHoverStyles = {
    default: { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' },
    primary: { backgroundColor: '#4a94e8', color: 'white' },
    danger: { backgroundColor: 'rgba(248, 81, 73, 0.1)', color: 'var(--accent-red)' },
    ghost: { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' },
    success: { backgroundColor: '#27ae60', color: 'white' },
    warning: { backgroundColor: '#f39c12', color: 'black' }
  }

  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      style={{
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...(isHovered ? variantHoverStyles[variant] : {}),
        borderRadius: 'var(--radius-sm)',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all var(--transition-fast)',
        opacity: disabled ? 0.5 : 1
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled}
      title={label}
      type="button"
    >
      <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
    </button>
  )
}