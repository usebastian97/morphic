'use client'

import { Icon } from '@iconify/react'

import { useCurrentUserImage } from '@/hooks/use-current-user-image'
import { useCurrentUserName } from '@/hooks/use-current-user-name'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export const CurrentUserAvatar = () => {
  const profileImage = useCurrentUserImage()
  const name = useCurrentUserName()
  const initials = name
    ?.split(' ')
    ?.map(word => word[0])
    ?.join('')
    ?.toUpperCase()

  return (
    <Avatar className="size-6">
      {profileImage && <AvatarImage src={profileImage} alt={initials} />}
      <AvatarFallback>
        {initials === '?' ? (
          <Icon icon="solar:user-rounded-bold" className="size-4 text-muted-foreground" />
        ) : (
          initials
        )}
      </AvatarFallback>
    </Avatar>
  )
}
