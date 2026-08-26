import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/dashboard/DashboardClient'
import type { UserRole } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function RoleDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get full profile
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, division, avatar_url, role')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Fetch stats for dashboard
  const { data: tickets } = await supabase
    .from('tickets')
    .select('status, created_at')

  const statusCounts = tickets?.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const initialStats = {
    total: tickets?.length || 0,
    newCount: statusCounts['NEW'] || 0,
    onProgress: (statusCounts['ASSIGNED'] || 0) + (statusCounts['ON_PROGRESS'] || 0),
    waitingConfirmation: statusCounts['WAITING_CONFIRMATION'] || 0,
    completed: statusCounts['COMPLETED'] || 0,
    rework: statusCounts['REWORK'] || 0,
    onHold: statusCounts['ON_HOLD'] || 0
  }

  // Generate trend data (last 14 days)
  const trendData = Array.from({ length: 14 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (13 - i))
    const dateStr = date.toISOString().split('T')[0]
    const dayTickets = tickets?.filter(t =>
      t.created_at?.startsWith(dateStr)
    ).length || 0
    return { date: dateStr, total: dayTickets }
  })

  // Status data for pie chart
  const statusData = [
    { name: 'NEW', value: statusCounts['NEW'] || 0 },
    { name: 'ASSIGNED', value: statusCounts['ASSIGNED'] || 0 },
    { name: 'ON_PROGRESS', value: statusCounts['ON_PROGRESS'] || 0 },
    { name: 'WAITING_CONFIRMATION', value: statusCounts['WAITING_CONFIRMATION'] || 0 },
    { name: 'COMPLETED', value: statusCounts['COMPLETED'] || 0 },
  ].filter(s => s.value > 0)

  // Category data
  const categoryData = [
    { category: 'Plumbing', count: 24 },
    { category: 'Electrical', count: 18 },
    { category: 'AC/AC', count: 15 },
    { category: 'Painting', count: 12 },
    { category: 'Structure', count: 8 }
  ]

  // Workload data
  const { data: engineers } = await supabase
    .from('users')
    .select('full_name')
    .eq('role', 'ENGINEERING')

  const workloadData = (engineers || []).map(e => ({
    engineer: e.full_name,
    assigned: Math.floor(Math.random() * 5) + 1,
    completed: Math.floor(Math.random() * 4) + 1
  }))

  const userProfile = {
    full_name: profile.full_name,
    division: profile.division || profile.role,
    avatar_url: profile.avatar_url,
    role: profile.role as UserRole
  }

  return (
    <DashboardClient
      initialStats={initialStats}
      trendData={trendData}
      statusData={statusData}
      categoryData={categoryData}
      workloadData={workloadData}
      userProfile={userProfile}
    />
  )
}
