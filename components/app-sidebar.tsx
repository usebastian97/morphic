import { Suspense } from 'react'
import Link from 'next/link'

import { Icon } from '@iconify/react'
import { User } from '@supabase/supabase-js'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator
} from '@/components/ui/sidebar'

import { ChatHistorySection } from './sidebar/chat-history-section'
import { ChatHistorySkeleton } from './sidebar/chat-history-skeleton'
import { SidebarUserMenu } from './sidebar/sidebar-user-menu'
import { IconLogo } from './ui/icons'

interface AppSidebarProps {
  user?: User | null
}

export default function AppSidebar({ user }: AppSidebarProps) {
  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/chat">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <IconLogo className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">SwissTaxSearch</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Official tax search
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="flex flex-col px-2 py-4 h-full">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="New Chat">
              <Link href="/chat" className="flex items-center gap-2">
                <Icon icon="solar:add-circle-bold" className="size-4" />
                <span>New</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="flex-1 overflow-y-auto group-data-[collapsible=icon]:hidden">
          <Suspense fallback={<ChatHistorySkeleton />}>
            <ChatHistorySection />
          </Suspense>
        </div>
      </SidebarContent>
      {user && (
        <>
          <SidebarSeparator />
          <SidebarFooter>
            <SidebarUserMenu user={user} />
          </SidebarFooter>
        </>
      )}
    </Sidebar>
  )
}
