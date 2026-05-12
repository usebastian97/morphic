import { createElement } from 'react'

import { Icon } from '@iconify/react'

import { SearchMode } from '@/lib/types/search'

function SpeedIcon({ className }: { className?: string }) {
  return createElement(Icon, { icon: 'solar:bolt-bold', className })
}

function QualityIcon({ className }: { className?: string }) {
  return createElement(Icon, { icon: 'solar:stars-bold', className })
}

export interface SearchModeConfig {
  value: SearchMode
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

// Centralized search mode configuration
export const SEARCH_MODE_CONFIGS: SearchModeConfig[] = [
  {
    value: 'quick',
    label: 'Speed',
    description: 'Faster answers for straightforward Swiss tax questions.',
    icon: SpeedIcon,
    color: 'text-amber-700 dark:text-amber-300'
  },
  {
    value: 'adaptive',
    label: 'Quality',
    description:
      'Deeper review for complex Swiss tax questions, comparisons, and source-heavy research.',
    icon: QualityIcon,
    color: 'text-red-700 dark:text-red-300'
  }
]

// Helper function to get a specific mode config
export function getSearchModeConfig(
  mode: SearchMode
): SearchModeConfig | undefined {
  return SEARCH_MODE_CONFIGS.find(config => config.value === mode)
}
