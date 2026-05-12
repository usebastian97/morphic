'use client'

import { useEffect, useRef, useState } from 'react'

import { Icon } from '@iconify/react'

import { cn } from '@/lib/utils'

import { Button } from './ui/button'

// Constants for timing delays
const FOCUS_OUT_DELAY_MS = 100 // Delay to ensure focus has actually moved

interface ActionCategory {
  icon: string
  label: string
  key: string
}

const actionCategories: ActionCategory[] = [
  {
    icon: 'solar:magnifer-bold',
    label: 'Research',
    key: 'research'
  },
  {
    icon: 'solar:scale-bold',
    label: 'Compare',
    key: 'compare'
  },
  {
    icon: 'solar:newspaper-bold',
    label: 'Latest',
    key: 'latest'
  },
  {
    icon: 'solar:document-text-bold',
    label: 'Summarize',
    key: 'summarize'
  },
  {
    icon: 'solar:info-circle-bold',
    label: 'Explain',
    key: 'explain'
  }
]

const promptSamples: Record<string, string[]> = {
  research: [
    'Find the latest official ESTV VAT/MWST changes',
    'What deductions are available for Zurich taxpayers?',
    'Research withholding tax guidance for cross-border workers',
    'Find official Swiss tax filing updates for this year'
  ],
  compare: [
    'Compare income tax rules in Zurich and Vaud',
    'Compare cantonal corporate tax changes',
    'Compare VAT/MWST rates and exemptions',
    'Compare filing deadlines in Basel-Stadt and Bern'
  ],
  latest: [
    'Latest official Swiss tax news',
    'Latest ESTV updates this month',
    'Latest cantonal tax updates in Zurich',
    'Latest Fedlex changes for Swiss tax law'
  ],
  summarize: [
    'Summarize the latest ESTV VAT guidance',
    'Summarize official Zurich deduction guidance',
    'Summarize Swiss filing deadline changes',
    'Summarize official double taxation guidance'
  ],
  explain: [
    'Explain direct federal tax in Switzerland',
    'Explain VAT/MWST registration thresholds',
    'Explain Swiss withholding tax for employees',
    'Explain double taxation agreements in Switzerland'
  ]
}

interface ActionButtonsProps {
  onSelectPrompt: (prompt: string) => void
  onCategoryClick: (category: string) => void
  inputRef?: React.RefObject<HTMLTextAreaElement>
  className?: string
}

export function ActionButtons({
  onSelectPrompt,
  onCategoryClick,
  inputRef,
  className
}: ActionButtonsProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleCategoryClick = (category: ActionCategory) => {
    setActiveCategory(category.key)
    onCategoryClick(category.label)
  }

  const handlePromptClick = (prompt: string) => {
    setActiveCategory(null)
    onSelectPrompt(prompt)
  }

  const resetToButtons = () => {
    setActiveCategory(null)
  }

  // Handle Escape key and clicks outside (including focus loss)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeCategory) {
        resetToButtons()
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        if (activeCategory) {
          // Check if click is not on the input field
          if (!inputRef?.current?.contains(e.target as Node)) {
            resetToButtons()
          }
        }
      }
    }

    const handleFocusOut = () => {
      // Check if focus is moving outside both the container and input
      setTimeout(() => {
        const activeElement = document.activeElement
        if (
          activeCategory &&
          !containerRef.current?.contains(activeElement) &&
          activeElement !== inputRef?.current
        ) {
          resetToButtons()
        }
      }, FOCUS_OUT_DELAY_MS)
    }

    document.addEventListener('keydown', handleEscape)
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('focusout', handleFocusOut)

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('focusout', handleFocusOut)
    }
  }, [activeCategory, inputRef])

  // Calculate max height needed for samples (4 items * ~40px + padding)
  const containerHeight = 'h-[180px]'

  return (
    <div
      ref={containerRef}
      className={cn('relative', containerHeight, className)}
    >
      <div className="relative h-full">
        {/* Action buttons */}
        <div
          className={cn(
            'absolute inset-0 flex items-start justify-center pt-2 transition-opacity duration-300',
            activeCategory ? 'opacity-0 pointer-events-none' : 'opacity-100'
          )}
        >
          <div className="flex flex-wrap justify-center gap-2 px-2">
            {actionCategories.map(category => (
              <Button
                key={category.key}
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap rounded-full',
                  'text-xs sm:text-sm px-3 sm:px-4'
                )}
                onClick={() => handleCategoryClick(category)}
              >
                <Icon icon={category.icon} className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{category.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Prompt samples */}
        <div
          className={cn(
            'absolute inset-0 py-1 space-y-1 overflow-y-auto transition-opacity duration-300',
            !activeCategory ? 'opacity-0 pointer-events-none' : 'opacity-100'
          )}
        >
          {activeCategory &&
            promptSamples[activeCategory]?.map((prompt, index) => (
              <button
                key={index}
                type="button"
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-sm',
                  'hover:bg-muted transition-colors',
                  'flex items-center gap-2 group'
                )}
                onClick={() => handlePromptClick(prompt)}
              >
                <Icon
                  icon="solar:magnifer-bold"
                  className="h-3 w-3 text-muted-foreground flex-shrink-0 group-hover:text-foreground"
                />
                <span className="line-clamp-1">{prompt}</span>
              </button>
            ))}
        </div>
      </div>
    </div>
  )
}
