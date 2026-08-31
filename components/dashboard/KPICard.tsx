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
        className={`relative overflow-hidden rounded-2xl bg-[#192A56] text-[#FCFBFB] p-5 shadow-lg shadow-[#192A56]/20 ${className}`}
      >
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F7D794]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#F7D794]/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#F7D794] text-sm font-medium">{title}</span>
            {icon && (
              <div className="w-10 h-10 rounded-xl bg-[#F7D794]/10 backdrop-blur-sm flex items-center justify-center">
                {icon}
              </div>
            )}
          </div>

          {/* Value */}
          <p className="text-3xl font-bold mb-1 text-[#FCFBFB]">{value}</p>

          {/* Trend */}
          {trend && (
            <div className="flex items-center gap-1.5">
              {trend.isPositive ? (
                <ArrowUpRight className="w-4 h-4 text-[#F7D794]" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-[#EDA6A3]" />
              )}
              <span className={`text-sm font-medium ${trend.isPositive ? 'text-[#F7D794]' : 'text-[#EDA6A3]'}`}>
                {trend.value}%
              </span>
              <span className="text-[#FCFBFB]/60 text-sm">from last month</span>
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
      className={`relative rounded-2xl bg-[#FCFBFB] border border-[#F7D794]/20 p-5 shadow-sm hover:shadow-md hover:border-[#F7D794]/40 transition-all ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[#192A56]/70 text-sm font-medium">{title}</span>
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-[#F7D794]/20 flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <p className="text-2xl font-bold text-[#192A56] mb-1">{value}</p>

      {/* Subtitle / Trend */}
      <div className="flex items-center justify-between">
        {subtitle && (
          <span className="text-[#192A56]/50 text-xs">{subtitle}</span>
        )}
        {trend && (
          <div className={`flex items-center gap-1 ${trend.isPositive ? 'text-[#192A56]' : 'text-[#EDA6A3]'}`}>
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
