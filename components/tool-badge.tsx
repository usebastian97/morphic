import React from 'react'

import { Icon } from '@iconify/react'

import { cn } from '@/lib/utils'

import { Badge } from './ui/badge'

type ToolBadgeProps = {
  tool: string
  children: React.ReactNode
  className?: string
  isLoading?: boolean
}

export const ToolBadge: React.FC<ToolBadgeProps> = ({
  tool,
  children,
  className,
  isLoading = false
}) => {
  const iconMap: Record<string, string> = {
    search: 'solar:magnifer-bold',
    fetch: 'solar:link-bold'
  }

  const iconName = iconMap[tool]

  return (
    <Badge
      className={cn(
        'inline-flex items-center max-w-full',
        isLoading && 'animate-pulse',
        className
      )}
      variant={'secondary'}
    >
      {iconName && <Icon icon={iconName} className="size-3.5 shrink-0" />}
      <span className="ml-1 truncate">{children}</span>
    </Badge>
  )
}
