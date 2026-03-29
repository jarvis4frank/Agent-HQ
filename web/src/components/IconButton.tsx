import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface IconButtonProps {
  icon: LucideIcon
  label?: string
  onClick?: () => void
  variant?: 'default' | 'primary' | 'danger' | 'ghost' | 'success' | 'warning'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

const variantSizeMap: Record<string, 'default' | 'ghost' | 'destructive' | 'outline' | 'secondary' | null> = {
  default: 'secondary',
  primary: 'default',
  danger: 'destructive',
  ghost: 'ghost',
  success: 'default',
  warning: 'default',
}

const iconSizeMap: Record<string, 'icon-xs' | 'icon-sm' | 'icon' | 'icon-lg'> = {
  sm: 'icon-xs',
  md: 'icon-sm',
  lg: 'icon',
}

export default function IconButton({
  icon: Icon,
  label,
  onClick,
  variant = 'default',
  size = 'md',
  disabled = false,
}: IconButtonProps) {
  // Map our variant to shadcn Button variant
  const buttonVariant = variantSizeMap[variant] ?? 'secondary'
  const buttonSize = iconSizeMap[size] ?? 'icon-sm'

  // For primary/success/warning variants, we need custom styling
  // since shadcn doesn't have those built-in
  const isCustomVariant = variant === 'primary' || variant === 'success' || variant === 'warning'

  const customStyles: Record<string, { bg: string; color: string; hoverBg: string }> = {
    primary: { bg: '#58a6ff', color: 'white', hoverBg: '#4a94e8' },
    success: { bg: '#3fb950', color: 'white', hoverBg: '#27ae60' },
    warning: { bg: '#d29922', color: 'black', hoverBg: '#f39c12' },
  }

  if (isCustomVariant) {
    const style = customStyles[variant]
    return (
      <button
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size === 'sm' ? 24 : size === 'lg' ? 40 : 32,
          height: size === 'sm' ? 24 : size === 'lg' ? 40 : 32,
          borderRadius: 6,
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          backgroundColor: style.bg,
          color: style.color,
          opacity: disabled ? 0.5 : 1,
          transition: 'background-color var(--transition-fast)',
        }}
        onMouseEnter={(e) => {
          if (!disabled) e.currentTarget.style.backgroundColor = style.hoverBg
        }}
        onMouseLeave={(e) => {
          if (!disabled) e.currentTarget.style.backgroundColor = style.bg
        }}
        onClick={onClick}
        disabled={disabled}
        title={label}
        type="button"
      >
        <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
      </button>
    )
  }

  return (
    <Button
      variant={buttonVariant as 'secondary' | 'ghost' | 'destructive' | 'outline'}
      size={buttonSize}
      onClick={onClick}
      disabled={disabled}
      title={label}
      type="button"
    >
      <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
    </Button>
  )
}
