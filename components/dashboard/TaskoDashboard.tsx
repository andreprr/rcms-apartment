'use client'

import Link from 'next/link'
import KPICard, { StatsRow } from './KPICard'
import { Plus, Filter, Loader2 } from 'lucide-react'
import type { UserRole } from '@/types/database'

interface TaskoDashboardProps {
  pageTitle: string
  pageSubtitle?: string
  actions?: {
    primary?: {
      label: string
      icon?: React.ReactNode
      href?: string
      onClick?: () => void
    }
    secondary?: {
      label: string
      icon?: React.ReactNode
      onClick?: () => void
    }[]
  }
  stats: Array<{
    title: string
    value: number | string
    subtitle?: string
    icon?: React.ReactNode
    variant?: 'primary' | 'default'
    trend?: { value: number; isPositive: boolean }
  }>
  leftContent?: React.ReactNode
  rightContent?: React.ReactNode
  children?: React.ReactNode
  isLoading?: boolean
}

export default function TaskoDashboard({
  pageTitle,
  pageSubtitle,
  actions,
  stats,
  leftContent,
  rightContent,
  children,
  isLoading = false
}: TaskoDashboardProps) {

  // Build action buttons
  const actionButtons = actions?.secondary?.map((action, i) => (
    <button
      key={i}
      onClick={action.onClick}
      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#192A56] bg-[#FCFBFB] border border-[#F7D794]/40 hover:bg-[#F7D794]/10 hover:border-[#F7D794] rounded-xl transition-all"
    >
      {action.icon || <Filter className="w-4 h-4" />}
      {action.label}
    </button>
  ))

  if (actions?.primary) {
    const PrimaryButton = actions.primary.href ? (
      <Link
        key="primary"
        href={actions.primary.href}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F7D794] hover:bg-[#EDA6A3] text-[#192A56] text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
      >
        {actions.primary.icon || <Plus className="w-4 h-4" />}
        {actions.primary.label}
      </Link>
    ) : (
      <button
        key="primary"
        onClick={actions.primary.onClick}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F7D794] hover:bg-[#EDA6A3] text-[#192A56] text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
      >
        {actions.primary.icon || <Plus className="w-4 h-4" />}
        {actions.primary.label}
      </button>
    )
    actionButtons?.unshift(PrimaryButton)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#F7D794] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-[#192A56] rounded-2xl border border-[#F7D794]/30 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#FCFBFB] tracking-tight">{pageTitle}</h1>
            {pageSubtitle && <p className="text-sm text-[#F7D794]/80 mt-0.5">{pageSubtitle}</p>}
          </div>
          {actionButtons && actionButtons.length > 0 && (
            <div className="flex items-center gap-3">
              {actionButtons}
            </div>
          )}
        </div>
      </div>

      {/* KPI Stats Row */}
      <StatsRow cards={stats} />

      {/* Main 2-Column Layout */}
      {(leftContent || rightContent || children) && (
        <div className="flex flex-col lg:flex-row gap-6">
          {leftContent && (
            <div className="flex-[2_1_0%]">
              {leftContent}
            </div>
          )}
          {rightContent && (
            <div className="flex-[1_1_0%]">
              {rightContent}
            </div>
          )}
          {children && <div className="w-full">{children}</div>}
        </div>
      )}
    </div>
  )
}

// Re-export all components for easier imports
export { default as KPICard } from './KPICard'
export { StatsRow } from './KPICard'
export { default as MainContentLayout } from './MainContentLayout'
export { AnalyticsCard, WeeklyBarChart, ChartLegend } from './AnalyticsWidgets'
export { ReminderCard, DonutCard, ProgressRing } from './RightWidgets'
export { default as DashboardHeader } from './DashboardHeader'
