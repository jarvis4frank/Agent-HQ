import { LucideIcon } from 'lucide-react'

interface IconButtonProps {
  icon: LucideIcon
  label?: string
  onClick?: () => void
  variant?: 'default' | 'primary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
}

export default function IconButton({ 
  icon: Icon, 
  label, 
  onClick, 
  variant = 'default',
  size = 'md',
  disabled = false,
  className = ''
}: IconButtonProps) {
  const sizeClasses = {
    sm: 'icon-btn-sm',
    md: 'icon-btn-md', 
    lg: 'icon-btn-lg'
  }
  
  const variantClasses = {
    default: 'icon-btn-default',
    primary: 'icon-btn-primary',
    danger: 'icon-btn-danger',
    ghost: 'icon-btn-ghost'
  }

  return (
    <button
      className={`icon-btn ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      title={label}
      type="button"
    >
      <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
    </button>
  )
}