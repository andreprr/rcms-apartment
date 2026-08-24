'use client';

import React, { useState } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Calendar, Ticket, CheckCircle2, Clock, AlertTriangle, 
  FileText, RefreshCw, Layers, Wrench, XCircle
} from 'lucide-react';

// Color Palette Modern
const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#6366F1',
  purple: '#8B5CF6',
  gray: '#6B7280',
};

const STATUS_COLORS = {
  NEW: '#3B82F6',
  ACKNOWLEDGED: '#6366F1',
  ASSIGNED: '#8B5CF6',
  ON_PROGRESS: '#F59E0B',
  WAITING_CONFIRMATION: '#EC4899',
  COMPLETED: '#10B981',
  REWORK: '#EF4444',
  ON_HOLD: '#6B7280',
  CANCELLED: '#9CA3AF',
};

interface DashboardProps {
  initialStats: {
    total: number;
    newCount: number;
    onProgress: number;
    waitingConfirmation: number;
    completed: number;
    rework: number;
    onHold: number;
  };
  trendData: Array<{ date: string; total: number }>;
  statusData: Array<{ name: string; value: number }>;
  categoryData: Array<{ category: string; count: number }>;
  workloadData: Array<{ engineer: string; assigned: number; completed: number }>;
}

export default function DashboardClient({
  initialStats,
  trendData,
  statusData,
  categoryData,
  workloadData,
}: DashboardProps) {
  const [filterType, setFilterType] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      {/* Header & Filter Tanggal Custom */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard Analyst & Monitoring</h1>
          <p className="text-sm text-slate-500">Ringkasan statistik pengaduan warga dan performa lapangan</p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-sm font-medium text-slate-600">
            {(['today', 'week', 'month', 'year'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  filterType === type 
                    ? 'bg-white text-blue-600 shadow-sm font-semibold' 
                    : 'hover:text-slate-900'
                }`}
              >
                {type === 'today' ? 'Hari Ini' : type === 'week' ? 'Minggu Ini' : type === 'month' ? 'Bulan Ini' : 'Tahun Ini'}
              </button>
            ))}
            <button
              onClick={() => setFilterType('custom')}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                filterType === 'custom' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'hover:text-slate-900'
              }`}
            >
              Custom
            </button>
          </div>

          {filterType === 'custom' && (
            <div className="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-xl text-sm">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 text-slate-700 outline-none rounded-md"
              />
              <span className="text-slate-400">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 text-slate-700 outline-none rounded-md"
              />
            </div>
          )}
        </div>
      </div>

      {/* Grid Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <StatCard title="Total Aduan" value={initialStats.total} icon={<Ticket className="w-5 h-5 text-blue-600" />} bgColor="bg-blue-50" />
        <StatCard title="Baru (New)" value={initialStats.newCount} icon={<FileText className="w-5 h-5 text-indigo-600" />} bgColor="bg-indigo-50" />
        <StatCard title="On Progress" value={initialStats.onProgress} icon={<Clock className="w-5 h-5 text-amber-600" />} bgColor="bg-amber-50" />
        <StatCard title="Menunggu Konfirmasi" value={initialStats.waitingConfirmation} icon={<Layers className="w-5 h-5 text-pink-600" />} bgColor="bg-pink-50" />
        <StatCard title="Selesai" value={initialStats.completed} icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />} bgColor="bg-emerald-50" />
        <StatCard title="Rework (Revisi)" value={initialStats.rework} icon={<RefreshCw className="w-5 h-5 text-rose-600" />} bgColor="bg-rose-50" />
        <StatCard title="On Hold" value={initialStats.onHold} icon={<AlertTriangle className="w-5 h-5 text-slate-600" />} bgColor="bg-slate-100" />
      </div>

      {/* Grid Grafik Baris Pertama */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tren Aduan Over Time */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-800">Tren Pengaduan Warga</h3>
            <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">Akumulasi Realtime</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribusi Status (Pie/Donut Chart) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Proporsi Status Tiket</h3>
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || COLORS.gray} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid Grafik Baris Kedua */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kategori Komplain Terbanyak */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Kategori Keluhan Terbanyak</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" stroke="#94A3B8" fontSize={12} hide />
                <YAxis dataKey="category" type="category" stroke="#64748B" fontSize={12} width={100} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366F1" radius={[0, 8, 8, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Beban Kerja Teknisi (Engineering Workload) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Beban Kerja Teknisi (Workload)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="engineer" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="assigned" name="Ditugaskan" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Selesai" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, bgColor }: { title: string; value: number; icon: React.ReactNode; bgColor: string }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500 line-clamp-1">{title}</span>
        <div className={`p-2 rounded-xl ${bgColor}`}>{icon}</div>
      </div>
      <span className="text-2xl font-bold text-slate-800">{value}</span>
    </div>
  );
}