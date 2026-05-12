'use client'

import Link from 'next/link'

import { Icon } from '@iconify/react'

import { DropdownMenuItem } from '@/components/ui/dropdown-menu'

const externalLinks = [
  {
    name: 'Source code',
    href: 'https://git.new/morphic',
    icon: <Icon icon="solar:code-bold" className="mr-2 size-4" />
  },
  {
    name: 'Swiss tax portal',
    href: 'https://www.estv.admin.ch/',
    icon: <Icon icon="solar:buildings-bold" className="mr-2 size-4" />
  }
]

export function ExternalLinkItems() {
  return (
    <>
      {externalLinks.map(link => (
        <DropdownMenuItem key={link.name} asChild>
          <Link href={link.href} target="_blank" rel="noopener noreferrer">
            {link.icon}
            <span>{link.name}</span>
          </Link>
        </DropdownMenuItem>
      ))}
    </>
  )
}
