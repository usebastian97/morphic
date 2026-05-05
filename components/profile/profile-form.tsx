'use client'

import { useState, useTransition } from 'react'

import { Icon } from '@iconify/react'
import { toast } from 'sonner'

import {
  type ProfileUpdatePayload,
  updateProfileAction} from '@/lib/actions/profile'
import type { ClimateZone, FarmType, UserProfile } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

// ─── Constants ─────────────────────────────────────────────────────────────

type FarmSizeUnit = 'hectares' | 'acres'
const ACRE_TO_HECTARE = 0.404686

function toHectares(value: number, unit: FarmSizeUnit): number {
  return unit === 'acres' ? value * ACRE_TO_HECTARE : value
}

function formatFarmSize(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(3)
}

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

const FARM_TYPE_OPTIONS: { value: FarmType; label: string; icon: string }[] = [
  { value: 'crop_farming', label: 'Crop Farming', icon: 'solar:wheat-bold' },
  { value: 'livestock', label: 'Livestock', icon: 'solar:cow-bold' },
  { value: 'horticulture', label: 'Horticulture', icon: 'solar:leaf-bold' },
  { value: 'aquaculture', label: 'Aquaculture', icon: 'solar:swimming-bold' },
  { value: 'viticulture', label: 'Viticulture', icon: 'solar:bottle-bold' },
  { value: 'agroforestry', label: 'Agroforestry', icon: 'solar:trees-bold' },
  { value: 'beekeeping', label: 'Beekeeping', icon: 'solar:bee-bold' },
  { value: 'mixed', label: 'Mixed', icon: 'solar:layers-bold' }
]

const CLIMATE_ZONES: { value: ClimateZone; label: string }[] = [
  { value: 'tropical', label: 'Tropical' },
  { value: 'subtropical', label: 'Subtropical' },
  { value: 'temperate', label: 'Temperate' },
  { value: 'arid', label: 'Arid' },
  { value: 'semi_arid', label: 'Semi-Arid' },
  { value: 'mediterranean', label: 'Mediterranean' }
]

const LANGUAGES: { value: string; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' },
  { value: 'sw', label: 'Swahili' },
  { value: 'ro', label: 'Romanian' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' }
]

// ─── Section label ──────────────────────────────────────────────────────────

function SectionLabel({
  icon,
  label
}: {
  icon: string
  label: string
}) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      <Icon icon={icon} className="size-3.5 text-emerald-700" />
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

// ─── Component ──────────────────────────────────────────────────────────────

interface ProfileFormProps {
  profile: UserProfile
  email?: string
}

export function ProfileForm({ profile, email }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition()

  const [fullName, setFullName] = useState(profile.fullName ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')

  const [farmTypes, setFarmTypes] = useState<FarmType[]>(profile.farmTypes)
  const [cropInput, setCropInput] = useState('')
  const [primaryCrops, setPrimaryCrops] = useState<string[]>(profile.primaryCrops)
  const [farmSizeUnit, setFarmSizeUnit] = useState<FarmSizeUnit>('hectares')
  const [farmSizeInput, setFarmSizeInput] = useState(
    profile.farmSizeHa != null ? String(profile.farmSizeHa) : ''
  )
  const [farmSizeHa, setFarmSizeHa] = useState<number | null>(profile.farmSizeHa)

  const [countryCode, setCountryCode] = useState(profile.countryCode ?? '')
  const [region, setRegion] = useState(profile.region ?? '')
  const [climateZone, setClimateZone] = useState<ClimateZone | ''>(profile.climateZone ?? '')
  const [preferredLanguage, setPreferredLanguage] = useState(profile.preferredLanguage)

  const toggleFarmType = (type: FarmType) => {
    setFarmTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const addCrop = () => {
    const trimmed = cropInput.trim()
    if (!trimmed || primaryCrops.includes(trimmed)) return
    setPrimaryCrops(prev => [...prev, trimmed])
    setCropInput('')
  }

  const removeCrop = (crop: string) => {
    setPrimaryCrops(prev => prev.filter(c => c !== crop))
  }

  const updateFarmSizeValue = (value: string, unit: FarmSizeUnit = farmSizeUnit) => {
    const parsed = Number(value)
    setFarmSizeInput(value)
    setFarmSizeHa(
      value.trim() === '' || Number.isNaN(parsed) ? null : toHectares(parsed, unit)
    )
  }

  const updateFarmSizeUnit = (next: FarmSizeUnit) => {
    if (next === farmSizeUnit) return
    const parsed = Number(farmSizeInput)
    const nextInput =
      farmSizeInput.trim() === '' || Number.isNaN(parsed)
        ? farmSizeInput
        : next === 'acres'
          ? formatFarmSize(parsed / ACRE_TO_HECTARE)
          : formatFarmSize(parsed * ACRE_TO_HECTARE)
    setFarmSizeUnit(next)
    setFarmSizeInput(nextInput)
    setFarmSizeHa(
      nextInput.trim() === '' || Number.isNaN(Number(nextInput))
        ? null
        : toHectares(Number(nextInput), next)
    )
  }

  const handleSave = () => {
    const payload: ProfileUpdatePayload = {
      fullName,
      bio,
      farmTypes,
      primaryCrops,
      farmSizeHa,
      countryCode,
      region,
      climateZone,
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
    pro: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    enterprise: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300'
  }

  return (
    <div className="space-y-0">

      {/* ── Personal info ─────────────────────────────────────────────── */}
      <div className="pb-5">
        <SectionLabel icon="solar:user-rounded-bold" label="Personal" />

        {/* Identity row */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="size-9 rounded-lg shrink-0">
            <AvatarImage src={profile.avatarUrl ?? undefined} />
            <AvatarFallback className="rounded-lg text-xs font-semibold">
              {getInitials(profile.fullName, email)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{email}</p>
            <p className="text-xs text-muted-foreground">
              Member since {profile.createdAt.toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Name + Language row */}
        <div className="grid grid-cols-[1fr_160px] gap-2 mb-2">
          <div className="grid gap-1">
            <Label htmlFor="full-name" className="text-xs">Full Name</Label>
            <Input
              id="full-name"
              placeholder="Your full name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="preferred-language" className="text-xs">Language</Label>
            <select
              id="preferred-language"
              value={preferredLanguage}
              onChange={e => setPreferredLanguage(e.target.value)}
              className="flex h-8 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {LANGUAGES.map(l => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bio */}
        <div className="grid gap-1">
          <Label htmlFor="bio" className="text-xs">Bio</Label>
          <Textarea
            id="bio"
            placeholder="Tell us about yourself and your farming operation…"
            rows={2}
            value={bio}
            onChange={e => setBio(e.target.value)}
            className="text-sm resize-none"
          />
        </div>
      </div>

      <div className="border-t" />

      {/* ── Farm details ──────────────────────────────────────────────── */}
      <div className="py-5">
        <SectionLabel icon="solar:wheat-bold" label="Farm Details" />

        {/* Farm types — 4 col compact grid */}
        <div className="mb-3">
          <Label className="text-xs mb-1.5 block">Farm Types</Label>
          <div className="grid grid-cols-4 gap-1.5">
            {FARM_TYPE_OPTIONS.map(opt => {
              const selected = farmTypes.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleFarmType(opt.value)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selected
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100'
                      : 'border-border bg-background hover:bg-muted/50 text-foreground'
                  )}
                >
                  <Icon icon={opt.icon} className="size-3.5 shrink-0" />
                  <span className="truncate">{opt.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Crops + Farm size on same row */}
        <div className="grid grid-cols-[1fr_auto] gap-3 items-start">
          {/* Primary crops */}
          <div className="grid gap-1">
            <Label className="text-xs">Primary Crops</Label>
            <div className="flex gap-1.5">
              <Input
                placeholder="Add a crop and press Enter"
                value={cropInput}
                onChange={e => setCropInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCrop()
                  }
                }}
                className="h-8 text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addCrop}
                className="size-8 shrink-0"
              >
                <Icon icon="solar:add-circle-bold" className="size-3.5" />
              </Button>
            </div>
            {primaryCrops.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-0.5">
                {primaryCrops.map(crop => (
                  <Badge
                    key={crop}
                    variant="secondary"
                    className="gap-0.5 pr-1 text-xs h-5 cursor-pointer"
                    onClick={() => removeCrop(crop)}
                  >
                    {crop}
                    <Icon icon="solar:close-circle-bold" className="size-3" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Farm size */}
          <div className="grid gap-1 w-[164px]">
            <Label className="text-xs">Farm Size</Label>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min="0"
                step="any"
                placeholder="50"
                value={farmSizeInput}
                onChange={e => updateFarmSizeValue(e.target.value)}
                className="h-8 text-sm w-20"
              />
              <div className="flex rounded-full border border-input bg-background p-0.5">
                {(['hectares', 'acres'] as FarmSizeUnit[]).map(unit => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => updateFarmSizeUnit(unit)}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                      farmSizeUnit === unit
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {unit === 'hectares' ? 'ha' : 'ac'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t" />

      {/* ── Location ──────────────────────────────────────────────────── */}
      <div className="py-5">
        <SectionLabel icon="solar:map-point-bold" label="Location" />

        <div className="grid grid-cols-[120px_1fr] gap-2 mb-3">
          <div className="grid gap-1">
            <Label htmlFor="country-code" className="text-xs">Country</Label>
            <Input
              id="country-code"
              placeholder="US"
              maxLength={2}
              value={countryCode}
              onChange={e => setCountryCode(e.target.value.toUpperCase())}
              className="h-8 text-sm font-mono uppercase"
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="region" className="text-xs">Region / State</Label>
            <Input
              id="region"
              placeholder="e.g. Iowa, Transylvania"
              value={region}
              onChange={e => setRegion(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>

        <div className="grid gap-1">
          <Label className="text-xs">Climate Zone</Label>
          <div className="flex flex-wrap gap-1.5">
            {CLIMATE_ZONES.map(zone => {
              const selected = climateZone === zone.value
              return (
                <button
                  key={zone.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setClimateZone(selected ? '' : zone.value)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selected
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-border bg-background hover:bg-muted/50'
                  )}
                >
                  {zone.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="border-t" />

      {/* ── Account (read-only) ───────────────────────────────────────── */}
      <div className="py-5">
        <SectionLabel icon="solar:chart-2-bold" label="Account" />

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Icon icon="solar:crown-bold" className="size-3.5 text-muted-foreground" />
            <Badge className={cn('capitalize text-xs h-5', tierColors[profile.subscriptionTier])}>
              {profile.subscriptionTier}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Icon icon="solar:magnifer-bold" className="size-3.5" />
            <span className="text-xs">
              <span className="font-medium text-foreground">{profile.searchesThisMonth}</span>
              {' / '}{profile.monthlySearchLimit} searches
            </span>
          </div>
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

      {/* ── Save ─────────────────────────────────────────────────────── */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="h-8 px-4 text-sm bg-emerald-700 hover:bg-emerald-800 text-white"
        >
          {isPending ? (
            <>
              <Icon icon="solar:refresh-bold" className="mr-1.5 size-3.5 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Icon icon="solar:check-circle-bold" className="mr-1.5 size-3.5" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

