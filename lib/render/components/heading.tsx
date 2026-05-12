'use client'

import { Icon } from '@iconify/react'
import type { ComponentFn } from '@json-render/react'

import { type CatalogType, iconMap } from './shared'

export const Heading: ComponentFn<CatalogType, 'Heading'> = ({ props }) => {
  const iconName = props.icon ? iconMap[props.icon] : null
  return (
    <div className="flex items-center gap-2 text-lg font-bold text-foreground">
      {iconName && <Icon icon={iconName} className="size-5" />}
      {props.title}
    </div>
  )
}
