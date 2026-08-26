'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'

export default function EngineeringAdminCalendarPage() {
  const [current, setCurrent] = useState(new Date())

  const year = current.getFullYear()
  const month = current.getMonth()
  const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
  const dayNames = ['Min','Sen','Sel','Rab','Kam','Jum','Sab']
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const today = new Date()

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center"><CalendarDays className="w-5 h-5 text-purple-600" /></div>
            <h1 className="text-xl font-bold text-slate-800">Kalender Teknisi</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrent(new Date(year, month - 1, 1))} className="p-2 hover:bg-purple-50 rounded-xl transition-colors"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
            <span className="text-sm font-semibold text-slate-700 min-w-[140px] text-center">{monthNames[month]} {year}</span>
            <button onClick={() => setCurrent(new Date(year, month + 1, 1))} className="p-2 hover:bg-purple-50 rounded-xl transition-colors"><ChevronRight className="w-5 h-5 text-slate-600" /></button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-purple-50">
          {dayNames.map(d => <div key={d} className="py-3 text-center text-xs font-bold text-slate-400 uppercase">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
            return (
              <motion.div
                key={i}
                whileHover={{ scale: day ? 0.95 : 1 }}
                className={`min-h-[80px] p-2 border-b border-r border-purple-50 ${!day ? 'bg-slate-50' : 'hover:bg-purple-50/30 cursor-pointer'}`}
              >
                {day && (
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium ${isToday ? 'bg-purple-600 text-white' : 'text-slate-700'}`}>{day}</div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
