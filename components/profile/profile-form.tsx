'use client'

import { useState, useTransition } from 'react'

import { Icon } from '@iconify/react'
import { toast } from 'sonner'

import {
  type ProfileUpdatePayload,
  updateProfileAction
} from '@/lib/actions/profile'
import type {
  CantonCode,
  PreferredLanguage,
  TaxpayerType,
  UserProfile
} from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const CANTON_OPTIONS: { value: CantonCode; label: string }[] = [
  { value: 'AG', label: 'Aargau' },
  { value: 'AI', label: 'Appenzell Innerrhoden' },
  { value: 'AR', label: 'Appenzell Ausserrhoden' },
  { value: 'BE', label: 'Bern' },
  { value: 'BL', label: 'Basel-Landschaft' },
  { value: 'BS', label: 'Basel-Stadt' },
  { value: 'FR', label: 'Fribourg' },
  { value: 'GE', label: 'Geneva' },
  { value: 'GL', label: 'Glarus' },
  { value: 'GR', label: 'Graubuenden' },
  { value: 'JU', label: 'Jura' },
  { value: 'LU', label: 'Lucerne' },
  { value: 'NE', label: 'Neuchatel' },
  { value: 'NW', label: 'Nidwalden' },
  { value: 'OW', label: 'Obwalden' },
  { value: 'SG', label: 'St. Gallen' },
  { value: 'SH', label: 'Schaffhausen' },
  { value: 'SO', label: 'Solothurn' },
  { value: 'SZ', label: 'Schwyz' },
  { value: 'TG', label: 'Thurgau' },
  { value: 'TI', label: 'Ticino' },
  { value: 'UR', label: 'Uri' },
  { value: 'VD', label: 'Vaud' },
  { value: 'VS', label: 'Valais' },
  { value: 'ZG', label: 'Zug' },
  { value: 'ZH', label: 'Zurich' }
]

const TAXPAYER_TYPE_OPTIONS: {
  value: TaxpayerType
  label: string
  icon: string
}[] = [
  { value: 'individual', label: 'Individual', icon: 'solar:user-rounded-bold' },
  {
    value: 'self_employed',
    label: 'Self-employed',
    icon: 'solar:case-bold'
  },
  { value: 'business', label: 'Business', icon: 'solar:buildings-bold' },
  { value: 'expat', label: 'Expat', icon: 'solar:global-bold' },
  { value: 'advisor', label: 'Advisor', icon: 'solar:documents-bold' },
  { value: 'institution', label: 'Institution', icon: 'solar:banknote-bold' }
]

const LANGUAGE_OPTIONS: { value: PreferredLanguage; label: string }[] = [
  { value: 'de', label: 'German' },
  { value: 'fr', label: 'French' },
  { value: 'it', label: 'Italian' },
  { value: 'en', label: 'English' }
]

function getInitials(name: string | null, email?: string): string {
  if (name) {
    const parts = name.split(' ')
    if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }
  if (email) return email.split('@')[0].substring(0, 2).toUpperCase()
  return 'U'
}

function SectionLabel({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="mb-3 flex items-center gap-1.5">
      <Icon icon={icon} className="size-3.5 text-red-700" />
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

interface ProfileFormProps {
  profile: UserProfile
  email?: string
}

export function ProfileForm({ profile, email }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition()
  const [fullName, setFullName] = useState(profile.fullName ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [cantonCode, setCantonCode] = useState<CantonCode | ''>(
    profile.cantonCode ?? ''
  )
  const [municipality, setMunicipality] = useState(profile.municipality ?? '')
  const [taxpayerType, setTaxpayerType] = useState<TaxpayerType>(
    profile.taxpayerType
  )
  const [preferredLanguage, setPreferredLanguage] = useState<PreferredLanguage>(
    profile.preferredLanguage
  )

  const handleSave = () => {
    const payload: ProfileUpdatePayload = {
      fullName,
      bio,
      cantonCode,
      municipality,
      taxpayerType,
      preferredLanguage
    }

    startTransition(async () => {
      const result = await updateProfileAction(payload)
      if (result.success) {
        toast.success('Profile saved')
      } else {
        toast.error(result.error ?? 'Failed to save profile')
      }
    })
  }

  const tierColors: Record<string, string> = {
    free: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
    pro: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    plus: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    max: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300'
  }

  return (
    <div className="space-y-0">
      <div className="pb-5">
        <SectionLabel icon="solar:user-rounded-bold" label="Personal" />

        <div className="mb-4 flex items-center gap-3">
          <Avatar className="size-9 shrink-0 rounded-lg">
            <AvatarImage src={profile.avatarUrl ?? undefined} />
            <AvatarFallback className="rounded-lg text-xs font-semibold">
              {getInitials(profile.fullName, email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{email}</p>
            <p className="text-xs text-muted-foreground">
              Member since {profile.createdAt.toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="mb-2 grid gap-2 md:grid-cols-[1fr_160px]">
          <div className="grid gap-1">
            <Label htmlFor="full-name" className="text-xs">
              Full name
            </Label>
            <Input
              id="full-name"
              placeholder="Your full name"
              value={fullName}
              onChange={event => setFullName(event.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="preferred-language" className="text-xs">
              Language
            </Label>
            <select
              id="preferred-language"
              value={preferredLanguage}
              onChange={event =>
                setPreferredLanguage(event.target.value as PreferredLanguage)
              }
              className="flex h-8 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {LANGUAGE_OPTIONS.map(language => (
                <option key={language.value} value={language.value}>
                  {language.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-1">
          <Label htmlFor="bio" className="text-xs">
            Notes
          </Label>
          <Textarea
            id="bio"
            placeholder="Optional context for your Swiss tax research"
            rows={2}
            value={bio}
            onChange={event => setBio(event.target.value)}
            className="resize-none text-sm"
          />
        </div>
      </div>

      <div className="border-t" />

      <div className="py-5">
        <SectionLabel icon="solar:map-point-bold" label="Swiss Tax Context" />

        <div className="mb-3 grid gap-2 md:grid-cols-[180px_1fr]">
          <div className="grid gap-1">
            <Label htmlFor="canton" className="text-xs">
              Canton
            </Label>
            <select
              id="canton"
              value={cantonCode}
              onChange={event =>
                setCantonCode(event.target.value as CantonCode)
              }
              className="flex h-8 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Not specified</option>
              {CANTON_OPTIONS.map(canton => (
                <option key={canton.value} value={canton.value}>
                  {canton.value} - {canton.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1">
            <Label htmlFor="municipality" className="text-xs">
              Municipality
            </Label>
            <Input
              id="municipality"
              placeholder="e.g. Zurich, Lausanne, Lugano"
              value={municipality}
              onChange={event => setMunicipality(event.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>

        <div className="grid gap-1">
          <Label className="text-xs">Taxpayer type</Label>
          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {TAXPAYER_TYPE_OPTIONS.map(option => {
              const selected = taxpayerType === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setTaxpayerType(option.value)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selected
                      ? 'border-red-600 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100'
                      : 'border-border bg-background text-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon icon={option.icon} className="size-3.5 shrink-0" />
                  <span className="truncate">{option.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="border-t" />

      <div className="py-5">
        <SectionLabel icon="solar:chart-2-bold" label="Account" />

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Icon
              icon="solar:crown-bold"
              className="size-3.5 text-muted-foreground"
            />
            <Badge
              className={cn(
                'h-5 text-xs capitalize',
                tierColors[profile.subscriptionTier]
              )}
            >
              {profile.subscriptionTier}
            </Badge>
          </div>
          {profile.cantonCode && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Icon icon="solar:map-point-bold" className="size-3.5" />
              <span className="text-xs">Canton {profile.cantonCode}</span>
            </div>
          )}
          {profile.lastSeenAt && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Icon icon="solar:calendar-bold" className="size-3.5" />
              <span className="text-xs">
                Last active {profile.lastSeenAt.toLocaleDateString()}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Icon icon="solar:clock-circle-bold" className="size-3.5" />
            <span className="text-xs">
              Joined {profile.createdAt.toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t" />

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="h-8 bg-red-700 px-4 text-sm text-white hover:bg-red-800"
        >
          {isPending ? (
            <>
              <Icon
                icon="solar:refresh-bold"
                className="mr-1.5 size-3.5 animate-spin"
              />
              Saving
            </>
          ) : (
            <>
              <Icon
                icon="solar:check-circle-bold"
                className="mr-1.5 size-3.5"
              />
              Save changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
