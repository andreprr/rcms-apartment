'use client'

import { motion } from 'framer-motion'
import { Clock, Bell, ArrowRight, Calendar, CheckCircle2, AlertCircle } from 'lucide-react'

interface ReminderCardProps {
  title: string
  items: Array<{
    id: string
    time: string
    label: string
    description?: string
    priority?: 'high' | 'medium' | 'low'
    status?: 'pending' | 'done'
    action?: {
      label: string
      onClick: () => void
    }
  }>
  emptyText?: string
  className?: string
}

export function ReminderCard({
  title,
  items,
  emptyText = "No upcoming tasks",
  className = ''
}: ReminderCardProps) {
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'text-rose-500 bg-rose-50'
      case 'medium': return 'text-amber-500 bg-amber-50'
      case 'low': return 'text-emerald-500 bg-emerald-50'
      default: return 'text-slate-500 bg-slate-50'
    }
  }

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-500" />
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">{emptyText}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                {/* Time */}
                <div className="flex flex-col items-center min-w-[48px]">
                  <Clock className="w-3.5 h-3.5 text-slate-400 mb-1" />
                  <span className="text-xs font-semibold text-slate-600">{item.time}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-800 truncate">{item.label}</span>
                    {item.priority && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                    )}
                    {item.status === 'done' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>
                  )}

                  {/* Action Button */}
                  {item.action && (
                    <button
                      onClick={item.action.onClick}
                      className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      {item.action.label}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Progress Ring Component
interface ProgressRingProps {
  value: number
  label: string
  subtitle?: string
  size?: number
  strokeWidth?: number
  color?: string
}

export function ProgressRing({
  value,
  label,
  subtitle,
  size = 120,
  strokeWidth = 12,
  color = '#10B981'
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background Ring */}
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        {/* Center Value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-800">{value}%</span>
        </div>
      </div>
      <div className="text-center mt-3">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
    </div>
  )
}

// Donut Chart Card
interface DonutCardProps {
  title: string
  segments: Array<{
    label: string
    value: number
    color: string
  }>
  total: number
  centerLabel?: string
  className?: string
}

export function DonutCard({ title, segments, total, centerLabel, className = '' }: DonutCardProps) {
  const size = 160
  const strokeWidth = 20
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const gap = 4 // Gap between segments
  const segmentGap = gap / circumference * 100

  let offset = 0

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-50">
        <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center justify-center gap-6">
          {/* Donut Chart */}
          <div className="relative" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
              {total > 0 && segments.map((segment, index) => {
                const segmentLength = (segment.value / total) * circumference - gap
                const currentOffset = offset
                offset += (segment.value / total) * circumference

                return (
                  <circle
                    key={index}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={segment.color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${segmentLength} ${circumference}`}
                    strokeDashoffset={-currentOffset}
                    className="transition-all duration-500"
                  />
                )
              })}
            </svg>
            {centerLabel && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-slate-800">{total}</span>
                <span className="text-[10px] text-slate-400">{centerLabel}</span>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="space-y-2">
            {segments.map((segment, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-xs text-slate-600">{segment.label}</span>
                <span className="text-xs font-semibold text-slate-800 ml-auto">({segment.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
