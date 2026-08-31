'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Loader2, TrendingUp, TrendingDown, Ticket, Clock, CheckCircle2 } from 'lucide-react'

const COLORS = ['#D2F377', '#C5B4FC', '#FFC2BD', '#FFEAA5', '#0F0F0F']

export default function RRAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([])
  const [trendData, setTrendData] = useState<{ date: string; complaints: number; completed: number }[]>([])

  useEffect(() => {
    async function fetchData() {
      setLoading(false)
      // Simulate data
      setCategoryData([
        { name: 'Plumbing', value: 35 },
        { name: 'Electrical', value: 28 },
        { name: 'AC', value: 22 },
        { name: 'Painting', value: 12 },
        { name: 'Lainnya', value: 8 },
      ])
      setTrendData([
        { date: 'Sen', complaints: 12, completed: 8 },
        { date: 'Sel', complaints: 15, completed: 10 },
        { date: 'Rab', complaints: 8, completed: 12 },
        { date: 'Kam', complaints: 18, completed: 14 },
        { date: 'Jum', complaints: 20, completed: 16 },
        { date: 'Sab', complaints: 10, completed: 18 },
      ])
    }
    fetchData()
  }, [])

  // Calculate stats
  const totalComplaints = categoryData.reduce((sum, d) => sum + d.value, 0)
  const avgResolution = '2.3 hari'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Analisis tren dan statistik pengaduan warga.</p>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Ticket className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{totalComplaints}</p>
              <p className="text-xs text-slate-500">Total Komplain</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-emerald-600 text-xs">
            <TrendingUp className="w-3 h-3" />
            +12% dari bulan lalu
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">87%</p>
              <p className="text-xs text-slate-500">Tingkat Penyelesaian</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-emerald-600 text-xs">
            <TrendingUp className="w-3 h-3" />
            +5% dari bulan lalu
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{avgResolution}</p>
              <p className="text-xs text-slate-500">Rata-rata Durasi</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-emerald-600 text-xs">
            <TrendingDown className="w-3 h-3" />
            -0.5 hari dari bulan lalu
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm"
        >
          <h3 className="text-base font-semibold text-slate-800 mb-4">Tren Komplain Mingguan</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} />
              <YAxis stroke="#94A3B8" fontSize={12} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="complaints" stroke="#C5B4FC" strokeWidth={2} name="Komplain" />
              <Line type="monotone" dataKey="completed" stroke="#D2F377" strokeWidth={2} name="Selesai" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm"
        >
          <h3 className="text-base font-semibold text-slate-800 mb-4">Distribusi Kategori</h3>
          <div className="flex items-center">
            <ResponsiveContainer width="50%" height={280}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {categoryData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                    <span className="text-slate-600">{item.name}</span>
                  </div>
                  <span className="font-semibold text-slate-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Bar Chart - Perbandingan Tower */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm"
        >
          <h3 className="text-base font-semibold text-slate-800 mb-4">Komplain per Tower/Lantai</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={[
              { tower: 'Tower A', complaints: 45 },
              { tower: 'Tower B', complaints: 38 },
              { tower: 'Tower C', complaints: 52 },
              { tower: 'Tower D', complaints: 29 },
              { tower: 'Tower E', complaints: 41 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="tower" stroke="#94A3B8" fontSize={12} />
              <YAxis stroke="#94A3B8" fontSize={12} />
              <Tooltip />
              <Bar dataKey="complaints" fill="#C5B4FC" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Durasi Penanganan */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm"
        >
          <h3 className="text-base font-semibold text-slate-800 mb-4">Rata-rata Durasi Penanganan</h3>
          <div className="space-y-4">
            {[
              { category: 'Plumbing', days: 1.8 },
              { category: 'Electrical', days: 2.1 },
              { category: 'AC', days: 3.2 },
              { category: 'Painting', days: 4.5 },
              { category: 'Lainnya', days: 2.0 },
            ].map(item => (
              <div key={item.category}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-600">{item.category}</span>
                  <span className="font-semibold text-slate-800">{item.days} hari</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.days / 5) * 100}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
