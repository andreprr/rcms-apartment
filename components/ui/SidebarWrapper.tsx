'use client'

import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/ui/Sidebar'
import type { UserRole } from '@/types/database'

interface SidebarWrapperProps {
  user: {
    full_name: string
    division: string
    avatar_url?: string
    role: UserRole
  }
}

export default function SidebarWrapper({ user }: SidebarWrapperProps) {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return <Sidebar user={user} onLogout={handleLogout} />
}
