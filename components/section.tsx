'use client'

import React from 'react'

import { Icon } from '@iconify/react'

import { cn } from '@/lib/utils'

import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { StatusIndicator } from './ui/status-indicator'
import { ToolBadge } from './tool-badge'

type SectionProps = {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
  title?: string
  separator?: boolean
}

export const Section: React.FC<SectionProps> = ({
  children,
  className,
  size = 'md',
  title,
  separator = false
}) => {
  const iconSize = 16
  const iconClassName = 'mr-1.5 text-muted-foreground'
  let icon: React.ReactNode
  let type: 'text' | 'badge' = 'text'
  switch (title) {
    case 'Images':
      icon = (
        <Icon
          icon="solar:gallery-bold"
          className={iconClassName}
          style={{ fontSize: iconSize }}
        />
      )
      break
    case 'Videos':
      icon = (
        <Icon
          icon="solar:video-library-bold"
          className={iconClassName}
          style={{ fontSize: iconSize }}
        />
      )
      type = 'badge'
      break
    case 'Sources':
      icon = (
        <Icon
          icon="solar:document-text-bold"
          className={iconClassName}
          style={{ fontSize: iconSize }}
        />
      )
      type = 'badge'
      break
    case 'Answer':
      icon = (
        <Icon
          icon="solar:book-bookmark-bold"
          className={iconClassName}
          style={{ fontSize: iconSize }}
        />
      )
      break
    case 'Related':
      icon = (
        <Icon
          icon="solar:restart-bold"
          className={iconClassName}
          style={{ fontSize: iconSize }}
        />
      )
      break
    case 'Follow-up':
      icon = (
        <Icon
          icon="solar:chat-round-dots-bold"
          className={iconClassName}
          style={{ fontSize: iconSize }}
        />
      )
      break
    case 'Content':
      icon = (
        <Icon
          icon="solar:file-bold"
          className={iconClassName}
          style={{ fontSize: iconSize }}
        />
      )
      type = 'badge'
      break
    default:
      icon = (
        <Icon
          icon="solar:magnifer-bold"
          className={iconClassName}
          style={{ fontSize: iconSize }}
        />
      )
  }

  return (
    <>
      {separator && <Separator className="my-2 bg-primary/10" />}
      <section
        className={cn(
          ` ${size === 'sm' ? 'py-1' : size === 'lg' ? 'py-4' : 'py-2'}`,
          className
        )}
      >
        {title && type === 'text' && (
          <h2 className="flex items-center leading-none py-2">
            {icon}
            {title}
          </h2>
        )}
        {title && type === 'badge' && (
          <Badge variant="secondary" className="mb-2">
            {icon}
            {title}
          </Badge>
        )}
        {children}
      </section>
    </>
  )
}

export function ToolArgsSection({
  children,
  tool,
  number,
  isLoading
}: {
  children: React.ReactNode
  tool: string
  number?: number
  isLoading?: boolean
}) {
  return (
    <Section
      size="sm"
      className="py-0 flex items-center justify-between w-full gap-2 overflow-hidden min-w-0"
    >
      <div className="min-w-0 flex-1 overflow-hidden">
        <ToolBadge tool={tool} isLoading={isLoading}>
          {children}
        </ToolBadge>
      </div>
      {number && number > 0 && (
        <div className="shrink-0">
          <StatusIndicator
            icon="solar:check-bold"
            iconClassName="text-green-500"
          >
            {number} results
          </StatusIndicator>
        </div>
      )}
    </Section>
  )
}
