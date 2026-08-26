'use client'

import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface AnalyticsCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}

export function AnalyticsCard({ title, subtitle, children, className = '' }: AnalyticsCardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-800">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="p-5">
        {children}
      </div>
    </div>
  )
}

// Weekly Bar Chart Component
interface WeeklyBarChartProps {
  data: Array<{
    day: string
    value: number
  }>
  height?: number
}

export function WeeklyBarChart({ data, height = 280 }: WeeklyBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#94A3B8', fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#94A3B8', fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{
            borderRadius: '12px',
            border: 'none',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            padding: '8px 12px'
          }}
        />
        <Bar
          dataKey="value"
          fill="url(#barGradient)"
          radius={[6, 6, 0, 0]}
          maxBarSize={40}
        />
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  )
}

// Legend Component
interface ChartLegendProps {
  items: Array<{
    color: string
    label: string
  }>
}

export function ChartLegend({ items }: ChartLegendProps) {
  return (
    <div className="flex items-center gap-4">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: item.color }} />
          <span className="text-xs text-slate-500">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
