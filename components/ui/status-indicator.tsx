import { ReactNode } from 'react'

import { Icon } from '@iconify/react'

interface StatusIndicatorProps {
  icon: string
  iconClassName?: string
  children?: ReactNode
}

export function StatusIndicator({
  icon,
  iconClassName,
  children
}: StatusIndicatorProps) {
  return (
    <span className="flex items-center gap-1 text-muted-foreground text-xs">
      <Icon icon={icon} className={`size-4 ${iconClassName ?? ''}`} />
      {children && <span>{children}</span>}
    </span>
  )
}
