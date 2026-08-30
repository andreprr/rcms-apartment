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
    .select('status, created_at, problem')

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

  // Generate trend data (last 14 days) - deterministic based on date
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

  // Category data - derive from actual ticket data or use defaults
  const problemCounts = tickets?.reduce((acc, t) => {
    // Extract simple categories from problem text
    const problem = (t.problem || '').toLowerCase()
    if (problem.includes('pipa') || problem.includes('air') || problem.includes('wastafel') || problem.includes('keran')) {
      acc['Plumbing'] = (acc['Plumbing'] || 0) + 1
    } else if (problem.includes('listrik') || problem.includes('lampu') || problem.includes('stop kontak')) {
      acc['Electrical'] = (acc['Electrical'] || 0) + 1
    } else if (problem.includes('ac') || problem.includes('pendingin') || problem.includes('kondensor')) {
      acc['AC'] = (acc['AC'] || 0) + 1
    } else if (problem.includes('cat') || problem.includes('dinding') || problem.includes('wall')) {
      acc['Painting'] = (acc['Painting'] || 0) + 1
    } else if (problem.includes('pintu') || problem.includes('jendela') || problem.includes('kusen')) {
      acc['Structure'] = (acc['Structure'] || 0) + 1
    } else {
      acc['Other'] = (acc['Other'] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>) || {}

  const categoryData = Object.entries(problemCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Use actual ticket data for workload instead of random
  const { data: engineerTickets } = await supabase
    .from('tickets')
    .select('current_assignee_id, status')

  const { data: engineers } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('role', 'ENGINEERING')

  // Calculate actual workload for each engineer from ticket data
  const engineerMap = new Map<string, { assigned: number; completed: number }>()
  engineerTickets?.forEach(t => {
    if (t.current_assignee_id) {
      const current = engineerMap.get(t.current_assignee_id) || { assigned: 0, completed: 0 }
      current.assigned += 1
      if (t.status === 'COMPLETED') {
        current.completed += 1
      }
      engineerMap.set(t.current_assignee_id, current)
    }
  })

  const workloadData = (engineers || []).map(e => {
    const workload = engineerMap.get(e.id) || { assigned: 0, completed: 0 }
    return {
      engineer: e.full_name,
      assigned: workload.assigned,
      completed: workload.completed
    }
  })

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
