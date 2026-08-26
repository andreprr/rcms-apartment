import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SidebarWrapper from '@/components/ui/SidebarWrapper'
import type { UserRole } from '@/types/database'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get full profile from users table
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-lavender-50 to-purple-100">
      <SidebarWrapper
        user={{
          full_name: profile.full_name,
          division: profile.division,
          avatar_url: profile.avatar_url,
          role: profile.role as UserRole,
        }}
      />
      <div className="ml-64">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
