'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Image as ImageIcon,
  Loader2,
  X,
  Camera,
  Timer,
  Wrench,
} from 'lucide-react'
import { forceCompleteTicket } from '@/actions/engineering'

interface DailyLog {
  id: string
  ticket_id: string
  ticket_number: string
  problem: string
  status: string
  submitted_at: string | null
  engineering_name: string
  day_number: number
  work_description: string
  action_type: string
  duration_minutes: number
  created_at: string
  attachments: { id: string; storage_path: string; photo_type: string; file_name: string }[]
}

export default function StatusKerjaPage() {
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<DailyLog | null>(null)
  const [showPhotos, setShowPhotos] = useState(false)
  const [forceCompleting, setForceCompleting] = useState<string | null>(null)
  const [confirmForce, setConfirmForce] = useState<DailyLog | null>(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/engineering-admin/daily-logs')
      const d = await r.json()
      if (d.logs) setLogs(d.logs)
    } catch (e) {
      console.error('Failed to fetch logs:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  function isOver72Hours(submittedAt: string | null): boolean {
    if (!submittedAt) return false
    const submitted = new Date(submittedAt).getTime()
    const now = Date.now()
    const hoursDiff = (now - submitted) / (1000 * 60 * 60)
    return hoursDiff > 72
  }

  function getTimeRemaining(submittedAt: string | null): string {
    if (!submittedAt) return ''
    const submitted = new Date(submittedAt).getTime()
    const now = Date.now()
    const remaining = (72 * 60 * 60 * 1000) - (now - submitted)
    if (remaining <= 0) return 'Bisa di-force finish'
    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}j ${minutes}m lagi`
  }

  async function handleForceComplete(log: DailyLog) {
    setForceCompleting(log.ticket_id)
    const formData = new FormData()
    formData.append('ticket_id', log.ticket_id)
    formData.append('description', 'Force finish: Waktu konfirmasi melebihi 72 jam')
    const result = await forceCompleteTicket(formData)
    if (!result?.error) {
      await fetchLogs()
    }
    setForceCompleting(null)
    setConfirmForce(null)
  }

  const waitingLogs = logs.filter(l => l.status === 'WAITING_CONFIRMATION')
  const otherLogs = logs.filter(l => l.status !== 'WAITING_CONFIRMATION')

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Status Kerja</h1>
              <p className="text-sm text-slate-500">Log pengerjaan harian teknisi</p>
            </div>
          </div>
          <button
            onClick={fetchLogs}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-purple-100 p-12 text-center">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Belum ada log pengerjaan</p>
          <p className="text-sm text-slate-400 mt-1">Log akan muncul ketika teknisi mulai bekerja</p>
        </div>
      ) : (
        <>
          {/* Waiting Confirmation Section with Force Finish */}
          {waitingLogs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Timer className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider">
                  Menunggu Konfirmasi ({waitingLogs.length})
                </h2>
              </div>
              {waitingLogs.map((log, i) => {
                const over72h = isOver72Hours(log.submitted_at)
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`bg-white rounded-2xl border p-4 shadow-sm hover:shadow-md transition-shadow ${
                      over72h ? 'border-amber-200 bg-amber-50/30' : 'border-purple-100'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                        <Timer className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-800">{log.ticket_number}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            WAITING
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-1">{log.problem}</p>
                        <p className="text-xs text-slate-500 mb-2">
                          oleh {log.engineering_name} &bull; {new Date(log.created_at).toLocaleString('id-ID')}
                        </p>
                        {log.submitted_at && (
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-slate-400">
                              Submit: {new Date(log.submitted_at).toLocaleString('id-ID')}
                            </span>
                            <span className={`font-semibold ${over72h ? 'text-amber-600' : 'text-slate-500'}`}>
                              {getTimeRemaining(log.submitted_at)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {log.attachments?.length > 0 && (
                          <button
                            onClick={() => { setSelectedLog(log); setShowPhotos(true) }}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            {log.attachments.length} foto
                          </button>
                        )}
                        {over72h && (
                          <button
                            onClick={() => setConfirmForce(log)}
                            disabled={forceCompleting === log.ticket_id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                          >
                            {forceCompleting === log.ticket_id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            Force Finish
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Other Logs */}
          {otherLogs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Wrench className="w-4 h-4 text-purple-500" />
                <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider">
                  Log Pengerjaan ({otherLogs.length})
                </h2>
              </div>
              {otherLogs.map((log, i) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-white rounded-2xl border border-purple-100 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => { setSelectedLog(log); setShowPhotos(true) }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm">
                      D{log.day_number}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-800">{log.ticket_number}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          log.action_type === 'SUBMIT_FINISH'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {log.action_type === 'SUBMIT_FINISH' ? 'SELESAI' : 'EXTEND'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-1">{log.work_description}</p>
                      <p className="text-xs text-slate-500">
                        {log.engineering_name} &bull; Hari ke-{log.day_number}
                        {log.duration_minutes ? ` • ${log.duration_minutes} menit` : ''}
                        &bull; {new Date(log.created_at).toLocaleString('id-ID')}
                      </p>
                    </div>
                    {log.attachments?.length > 0 && (
                      <div className="flex items-center gap-1 text-purple-500">
                        <Camera className="w-4 h-4" />
                        <span className="text-xs font-medium">{log.attachments.length}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Photo Viewer Modal */}
      <AnimatePresence>
        {showPhotos && selectedLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowPhotos(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
            >
              <div className="px-6 py-4 border-b border-purple-100 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="font-bold text-slate-800">{selectedLog.ticket_number}</h3>
                  <p className="text-sm text-slate-500">{selectedLog.work_description}</p>
                </div>
                <button onClick={() => setShowPhotos(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {selectedLog.attachments?.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Tidak ada foto lampiran</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Group by photo_type */}
                    {(['BEFORE', 'PROGRESS', 'AFTER', 'OTHER'] as const).map(type => {
                      const items = selectedLog.attachments?.filter(a => a.photo_type === type) || []
                      if (items.length === 0) return null
                      return (
                        <div key={type}>
                          <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">{type}</h4>
                          <div className="grid grid-cols-2 gap-3">
                            {items.map(a => (
                              <div key={a.id} className="aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                                <img
                                  src={a.storage_path}
                                  alt={`${type} - ${a.file_name}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Force Complete Confirmation Modal */}
      <AnimatePresence>
        {confirmForce && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setConfirmForce(null)} />
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            >
              <div className="text-center">
                <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-7 h-7 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Force Finish?</h3>
                <p className="text-sm text-slate-500 mb-1">Tiket <strong>{confirmForce.ticket_number}</strong></p>
                <p className="text-sm text-slate-500 mb-6">
                  Waktu konfirmasi sudah melebihi 72 jam. Tiket akan ditandai selesai secara otomatis.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmForce(null)}
                    className="flex-1 px-4 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => handleForceComplete(confirmForce)}
                    disabled={forceCompleting === confirmForce.ticket_id}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {forceCompleting === confirmForce.ticket_id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Ya, Selesaikan
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
