'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { assignTechnicians } from '@/actions/engineering'
import { useTransition } from 'react'
import { Loader2, X, UserCheck, Wrench, AlertCircle, Check } from 'lucide-react'

async function safeJson(res: Response) {
  const type = res.headers.get('content-type') || ''
  if (!type.includes('application/json')) return {}
  const text = await res.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}

interface Technician {
  id: string
  full_name: string
  email: string
  is_active: boolean
}

interface AssignTechniciansModalProps {
  isOpen: boolean
  onClose: () => void
  ticketId: string
  ticketNumber: string
  currentAssignments?: string[]
  onSuccess?: () => void
}

export default function AssignTechniciansModal({
  isOpen,
  onClose,
  ticketId,
  ticketNumber,
  currentAssignments = [],
  onSuccess
}: AssignTechniciansModalProps) {
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>(currentAssignments)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Track if modal is open using ref
  const isOpenRef = useRef(false)

  // Sync selectedIds with currentAssignments when currentAssignments changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIds(currentAssignments)
  }, [currentAssignments])

  // Fetch available technicians and reset state
  useEffect(() => {
    if (isOpen) {
      isOpenRef.current = true
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(null)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuccess(false)

      async function fetchTechnicians() {
        try {
          const response = await fetch('/api/engineers')
          const data = await safeJson(response)
          if (data.engineers && isOpenRef.current) {
            setTechnicians(data.engineers)
            // Only reset selected IDs if modal is still open
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedIds(currentAssignments)
          }
        } catch (err) {
          console.error('Failed to fetch technicians:', err)
        }
      }
      fetchTechnicians()
    } else {
      isOpenRef.current = false
    }
  }, [isOpen, currentAssignments])

  const toggleTechnician = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(t => t !== id)
        : [...prev, id]
    )
  }

  const handleSubmit = () => {
    if (selectedIds.length === 0) {
      setError('Pilih minimal 1 teknisi.')
      return
    }

    setError(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.append('ticket_id', ticketId)
      selectedIds.forEach(id => formData.append('technician_ids', id))

      const result = await assignTechnicians(formData)

      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => {
          onSuccess?.()
          onClose()
        }, 1000)
      }
    })
  }

  const activeTechnicians = technicians.filter(t => t.is_active)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/60 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100/80 bg-gradient-to-r from-slate-50/50 to-white/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Tugaskan Teknisi</h3>
                  <p className="text-sm text-slate-500">Tiket #{ticketNumber}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {success ? (
                <div className="flex flex-col items-center justify-center h-full py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4"
                  >
                    <Check className="w-8 h-8 text-emerald-600" />
                  </motion.div>
                  <h3 className="text-lg font-bold text-slate-800">Berhasil!</h3>
                  <p className="text-sm text-slate-500 mt-1">Teknisi berhasil ditugaskan</p>
                </div>
              ) : (
                <>
                  {/* Error */}
                  {error && (
                    <div className="flex items-start gap-3 bg-red-50/80 border border-red-200/60 text-red-700 px-4 py-3 rounded-xl text-sm mb-5">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <p>{error}</p>
                    </div>
                  )}

                  {/* Instructions */}
                  <p className="text-sm text-slate-500 mb-4">
                    Pilih teknisi yang akan ditugaskan untuk menangani tiket ini.
                  </p>

                  {/* Technician List */}
                  <div className="space-y-2">
                    {activeTechnicians.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <UserCheck className="w-7 h-7 text-slate-400" />
                        </div>
                        <p className="text-slate-600 font-medium">Tidak ada teknisi aktif</p>
                        <p className="text-sm text-slate-400 mt-1">Hubungi admin untuk menambahkan teknisi</p>
                      </div>
                    ) : (
                      activeTechnicians.map(tech => {
                        const isSelected = selectedIds.includes(tech.id)
                        return (
                          <button
                            key={tech.id}
                            onClick={() => toggleTechnician(tech.id)}
                            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                              isSelected
                                ? 'border-blue-300 bg-blue-50/50'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? 'border-blue-600 bg-blue-600'
                                : 'border-slate-300'
                            }`}>
                              {isSelected && (
                                <Check className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-semibold text-slate-800">{tech.full_name}</p>
                              <p className="text-sm text-slate-500">{tech.email}</p>
                            </div>
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-lg">
                              ENGINEERING
                            </span>
                          </button>
                        )
                      })
                    )}
                  </div>

                  {/* Selected count */}
                  {selectedIds.length > 0 && (
                    <p className="text-sm text-slate-500 mt-4 text-center">
                      {selectedIds.length} teknisi dipilih
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {!success && (
              <div className="px-6 py-5 border-t border-slate-100/80 bg-slate-50/30 flex gap-3 shrink-0">
                <button
                  onClick={onClose}
                  disabled={isPending}
                  className="flex-1 px-4 py-3 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 font-semibold rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isPending || selectedIds.length === 0}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      Tugaskan
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
