'use client'

import { motion } from 'framer-motion'

interface MainContentLayoutProps {
  leftContent: React.ReactNode
  rightContent?: React.ReactNode
  leftWidth?: string
  rightWidth?: string
}

export default function MainContentLayout({
  leftContent,
  rightContent,
  leftWidth = 'flex-[2_1_0%]',
  rightWidth = 'flex-[1_1_0%]'
}: MainContentLayoutProps) {
  if (!rightContent) {
    return (
      <div className="w-full">
        {leftContent}
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Content - 68% */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`w-full ${leftWidth}`}
      >
        {leftContent}
      </motion.div>

      {/* Right Content - 32% */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`w-full ${rightWidth}`}
      >
        {rightContent}
      </motion.div>
    </div>
  )
}
