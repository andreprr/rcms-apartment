'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { login } from '@/actions/auth'

export default function LoginPage() {
  const [isLoginMode, setIsLoginMode] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)
    const result = await login(formData)
    if (result?.error) setError(result.error)
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/background.webp')" }}>
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Logo Top Left */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="absolute top-4 left-4 z-10">
        <Image src="/logo.png" alt="RCMS" width={56} height={56} className="w-12 md:w-14" />
      </motion.div>

      {/* Year Top Right */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="absolute top-4 right-4 z-10">
        <span className="text-white/80 text-lg md:text-2xl font-bold">2026</span>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-5xl h-[600px] md:h-[650px] bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
        >
          <div className="h-full flex">
            {/* Left Side */}
            <div className="flex-1 flex flex-col justify-center px-8 md:px-12 lg:px-16">
              <AnimatePresence mode="wait">
                {!isLoginMode ? (
                  <motion.div key="choice"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    className="space-y-4"
                  >
                    <div>
                      <h2 className="text-3xl md:text-4xl font-bold text-white">RCMS</h2>
                      <p className="text-white/60 mt-1">Sistem Informasi Management Pengaduan Warga</p>
                    </div>
                    <div className="pt-4 space-y-3">
                      <button
                        onClick={() => setIsLoginMode(true)}
                        className="w-full p-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl hover:bg-white/30 transition-all text-left flex items-center gap-4"
                      >
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 6v1zm0 0h6v-1a6 6 0 016-5.292M12 12a4 4 0 100-4 4 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-bold text-white">INTERNAL STAFF</p>
                          <p className="text-white/60 text-sm">Login Staff & Teknisi</p>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.form key="login"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleLogin}
                    className="space-y-5"
                  >
                    <div>
                      <h2 className="text-3xl md:text-4xl font-bold text-white">INTERNAL STAFF</h2>
                      <p className="text-white/60 mt-1">Masuk ke Dashboard RCMS</p>
                    </div>
                    {error && (
                      <div className="bg-red-500/20 border border-red-500/40 text-red-200 px-4 py-3 rounded-xl text-sm">
                        {error}
                      </div>
                    )}
                    <div className="space-y-4">
                      <div>
                        <label className="text-white/80 text-sm">Email</label>
                        <input
                          type="email" value={email} onChange={e => setEmail(e.target.value)}
                          placeholder="admin@rcms.com" required
                          className="w-full mt-1 px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-white/80 text-sm">Password</label>
                        <input
                          type="password" value={password} onChange={e => setPassword(e.target.value)}
                          placeholder="••••••••" required
                          className="w-full mt-1 px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
                        />
                      </div>
                      <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all">
                        Masuk
                      </button>
                      <button type="button" onClick={() => setIsLoginMode(false)} className="w-full text-center py-3 text-white/60 hover:text-white transition-colors">
                        ← Kembali
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            {/* Right Side - Logo */}
            <AnimatePresence>
              {!isLoginMode && (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className="hidden lg:flex items-center"
                >
                  <div className="relative z-10 pr-8">
                    <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}>
                      <Image src="/logostampel.png" alt="RCMS" width={180} height={180} className="w-44 h-44 object-contain drop-shadow-2xl" />
                    </motion.div>
                  </div>
                  <div className="w-80 h-full bg-gradient-to-b from-blue-600 to-blue-800 flex items-center shadow-2xl rounded-l-3xl">
                    <div className="text-center px-8">
                      <h3 className="text-2xl font-bold text-white mb-2">RCMS</h3>
                      <p className="text-white/80 text-sm">Sistem Informasi</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-4 left-4 z-10">
        <p className="text-white/50 text-xs md:text-sm tracking-wider">RESIDENT COMPLAINTEMENT SYSTEM</p>
      </motion.div>
    </div>
  )
}
