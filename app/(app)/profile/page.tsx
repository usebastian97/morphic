import { redirect } from 'next/navigation'

import { getProfileAction } from '@/lib/actions/profile'
import { getCurrentUser } from '@/lib/auth/get-current-user'

import { ProfileForm } from '@/components/profile/profile-form'

export const metadata = {
  title: 'Profile — AgriEvidence'
}

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfileAction()
  if (!profile) redirect('/onboarding')

  return (
    <div className="flex flex-1 justify-center overflow-y-auto px-4 py-6">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Profile</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage your account details and farm preferences.
            </p>
          </div>
        </div>

        <ProfileForm profile={profile} email={user.email} />
      </div>
    </div>
  )
}
