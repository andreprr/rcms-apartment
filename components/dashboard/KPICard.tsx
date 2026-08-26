'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface KPICardProps {
  title: string
  value: number | string
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  icon?: React.ReactNode
  variant?: 'primary' | 'default'
  className?: string
}

export default function KPICard({
  title,
  value,
  subtitle,
  trend,
  icon,
  variant = 'default',
  className = ''
}: KPICardProps) {
  const isPrimary = variant === 'primary'

  if (isPrimary) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 p-5 text-white shadow-lg shadow-blue-500/20 ${className}`}
      >
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-blue-100 text-sm font-medium">{title}</span>
            {icon && (
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                {icon}
              </div>
            )}
          </div>

          {/* Value */}
          <p className="text-3xl font-bold mb-1">{value}</p>

          {/* Trend */}
          {trend && (
            <div className="flex items-center gap-1.5">
              {trend.isPositive ? (
                <ArrowUpRight className="w-4 h-4 text-emerald-300" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-rose-300" />
              )}
              <span className={`text-sm font-medium ${trend.isPositive ? 'text-emerald-300' : 'text-rose-300'}`}>
                {trend.value}%
              </span>
              <span className="text-blue-200 text-sm">from last month</span>
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-500 text-sm font-medium">{title}</span>
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <p className="text-2xl font-bold text-slate-800 mb-1">{value}</p>

      {/* Subtitle / Trend */}
      <div className="flex items-center justify-between">
        {subtitle && (
          <span className="text-slate-400 text-xs">{subtitle}</span>
        )}
        {trend && (
          <div className={`flex items-center gap-1 ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="text-xs font-medium">{trend.value}%</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Quick Stats Row Component
interface StatsRowProps {
  cards: KPICardProps[]
}

export function StatsRow({ cards }: StatsRowProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <KPICard
          key={index}
          {...card}
          className={card.className}
        />
      ))}
    </div>
  )
}
