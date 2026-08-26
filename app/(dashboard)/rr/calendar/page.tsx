'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

interface Ticket {
  id: string
  ticket_number: string
  status: string
  created_at: string
  unit_code: string
  resident_name: string
}

export default function RRCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedDateTickets, setSelectedDateTickets] = useState<Ticket[]>([])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Fetch tickets
  useEffect(() => {
    async function fetchTickets() {
      setLoading(true)
      try {
        const response = await fetch('/api/rr/tickets')
        const result = await response.json()
        if (result.tickets) {
          setTickets(result.tickets)
        }
      } catch (error) {
        console.error('Failed to fetch:', error)
      }
      setLoading(false)
    }
    fetchTickets()
  }, [])

  // Get days in month
  const getDaysInMonth = () => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days: (number | null)[] = []

    // Add empty slots for days before first day
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }

    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    return days
  }

  const days = getDaysInMonth()

  // Get tickets for a specific date
  const getTicketsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return tickets.filter(t => t.created_at.startsWith(dateStr))
  }

  // Count tickets by status for a specific date
  const getTicketStats = (day: number) => {
    const dayTickets = getTicketsForDate(day)
    return {
      total: dayTickets.length,
      new: dayTickets.filter(t => t.status === 'NEW').length,
      onProgress: dayTickets.filter(t => ['ASSIGNED', 'ON_PROGRESS'].includes(t.status)).length,
      completed: dayTickets.filter(t => t.status === 'COMPLETED').length,
    }
  }

  // Navigate months
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToToday = () => setCurrentDate(new Date())

  // Open date modal
  const openDateModal = (day: number) => {
    const date = new Date(year, month, day)
    setSelectedDate(date)
    setSelectedDateTickets(getTicketsForDate(day))
  }

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]

  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

  const isToday = (day: number) => {
    const today = new Date()
    return today.getDate() === day &&
           today.getMonth() === month &&
           today.getFullYear() === year
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Calendar</h1>
            <p className="text-sm text-slate-500 mt-0.5">Kalender tiket pengaduan warga.</p>
          </div>
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
          >
            Hari Ini
          </button>
        </div>
      </motion.div>

      {/* Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden"
      >
        {/* Month Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-50">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-purple-50 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h2 className="text-lg font-bold text-slate-800">
            {monthNames[month]} {year}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-purple-50 rounded-xl transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 border-b border-purple-50">
          {dayNames.map(day => (
            <div key={day} className="px-2 py-3 text-center text-xs font-semibold text-slate-500 uppercase">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={index} className="p-2 min-h-[100px]" />
              }

              const stats = getTicketStats(day)
              const hasTickets = stats.total > 0
              const today = isToday(day)

              return (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  className={`p-2 min-h-[100px] border-b border-r border-purple-50 cursor-pointer transition-colors ${
                    hasTickets ? 'bg-purple-50/30' : 'hover:bg-slate-50'
                  }`}
                  onClick={() => openDateModal(day)}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    today
                      ? 'w-7 h-7 bg-purple-600 text-white rounded-full flex items-center justify-center'
                      : 'text-slate-700'
                  }`}>
                    {day}
                  </div>
                  {hasTickets && (
                    <div className="space-y-0.5">
                      {stats.new > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-blue-600">
                          <AlertCircle className="w-3 h-3" />
                          {stats.new} baru
                        </div>
                      )}
                      {stats.onProgress > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-amber-600">
                          <Clock className="w-3 h-3" />
                          {stats.onProgress} proses
                        </div>
                      )}
                      {stats.completed > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-600">
                          <CheckCircle2 className="w-3 h-3" />
                          {stats.completed} selesai
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-slate-600">Baru</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-slate-600">Diproses</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-slate-600">Selesai</span>
        </div>
      </div>

      {/* Date Modal */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedDate(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </h3>
                  <p className="text-sm text-slate-500">{selectedDateTickets.length} tiket</p>
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto max-h-[60vh]">
                {selectedDateTickets.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">Tidak ada tiket pada tanggal ini</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDateTickets.map(ticket => (
                      <Link
                        key={ticket.id}
                        href={`/tickets/${ticket.id}`}
                        className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl hover:bg-purple-50 transition-colors"
                      >
                        <Ticket className="w-5 h-5 text-purple-500" />
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800">{ticket.ticket_number}</p>
                          <p className="text-sm text-slate-500">{ticket.unit_code} - {ticket.resident_name}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          ticket.status === 'NEW' ? 'bg-blue-50 text-blue-700' :
                          ticket.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
