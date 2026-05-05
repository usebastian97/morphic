import * as React from 'react'

import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-[10px] py-[4px] text-[11px] font-semibold uppercase tracking-[0.88px] transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        // Default badge-pill — surface-strong background
        default:
          'border-transparent bg-secondary text-secondary-foreground',
        // Secondary alias for default (backwards compatibility)
        secondary:
          'border-transparent bg-secondary text-secondary-foreground',
        // Primary — Cursor Orange pill
        primary:
          'border-transparent bg-primary text-primary-foreground',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground',
        outline: 'border-border text-foreground bg-transparent'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
