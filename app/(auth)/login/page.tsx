'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { Eye, EyeOff, ShieldCheck, Building2, Users, BarChart3 } from 'lucide-react'
import { login } from '@/actions/auth'

export default function LoginPage() {
  // State Preloader Loading Screen
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)

  // State Form Login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Timer & Progress Animation untuk Loading Screen (2.5 Detik)
  useEffect(() => {
    const duration = 2500
    const intervalTime = 30
    const step = 100 / (duration / intervalTime)

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          setTimeout(() => setIsLoading(false), 200)
          return 100
        }
        return prev + step
      })
    }, intervalTime)

    return () => clearInterval(timer)
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)

    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setIsSubmitting(false)
    }
  }

  const marqueeText = "Resident Complaint Management System | Apartement Gateway Ahmad Yani"

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col justify-between select-none bg-[#070d09] font-sans text-white">

      {/* Background Utama Apartemen dengan Dark Emerald Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30 transition-transform duration-1000 scale-105"
        style={{ backgroundImage: "url('/background.webp')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#070d09] via-[#070d09]/80 to-[#070d09]" />
      </div>

      {/* Efek Garis Neon Kurva di Background (Sama dengan Loading Screen) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-35"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M -100 200 C 300 100, 200 700, -100 900"
          fill="none"
          stroke="#22c55e"
          strokeWidth="1.5"
        />
        <path
          d="M -120 180 C 350 80, 250 750, -120 950"
          fill="none"
          stroke="#4ade80"
          strokeWidth="0.5"
          strokeDasharray="4,4"
        />
        <path
          d="M 1600 100 C 1100 300, 1300 800, 1600 1000"
          fill="none"
          stroke="#22c55e"
          strokeWidth="1.5"
        />
        <path
          d="M 1620 80 C 1050 280, 1250 850, 1620 1050"
          fill="none"
          stroke="#4ade80"
          strokeWidth="0.5"
          strokeDasharray="4,4"
        />
      </svg>

      {/* ========================================================================= */}
      {/* 1. INITIAL LOADING SCREEN (PRELOADER DARK EMERALD LUXURY) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="preloader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="fixed inset-0 z-50 flex flex-col justify-between items-center bg-[#070d09] text-white p-6 overflow-hidden"
          >
            {/* Background Image Loading */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-25"
              style={{ backgroundImage: "url('/background.webp')" }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#070d09] via-[#070d09]/80 to-[#070d09]" />
            </div>

            <div className="w-full h-8" />

            {/* CENTER CONTENT: LOGO & PROGRESS BAR */}
            <div className="relative z-10 flex flex-col items-center text-center max-w-lg w-full px-4">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-4"
              >
                <Image
                  src="/logo.png"
                  alt="GATEWAY APARTMENT @ BANDUNG"
                  width={180}
                  height={80}
                  className="h-20 w-auto object-contain drop-shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-1 mb-8"
              >
                <h1 className="text-xl md:text-2xl font-bold tracking-wider text-white uppercase">
                  RESIDENT COMPLAINT
                </h1>
                <p className="text-xs md:text-sm font-semibold tracking-[0.25em] text-[#4ade80] uppercase">
                  MANAGEMENT SYSTEM
                </p>
              </motion.div>

              {/* Neon Progress Bar */}
              <div className="w-full max-w-md bg-white/10 h-1.5 rounded-full relative overflow-hidden mb-4 p-[1px] border border-emerald-500/20">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-green-300 rounded-full relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_12px_#4ade80]" />
                </motion.div>
              </div>

              <div className="text-center space-y-0.5">
                <p className="text-xs font-bold tracking-widest text-[#4ade80]">
                  LOADING...
                </p>
                <p className="text-[11px] text-slate-400 font-medium">
                  Please wait
                </p>
              </div>
            </div>

            {/* BOTTOM SECTION: 4 VALUES */}
            <div className="relative z-10 w-full max-w-5xl">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-t border-emerald-500/20">
                <div className="flex items-start gap-3 text-left">
                  <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-[#4ade80] shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white tracking-wide uppercase">
                      BETTER SERVICE
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Kami hadir untuk pelayanan terbaik
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-left">
                  <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-[#4ade80] shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white tracking-wide uppercase">
                      BETTER LIVING
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Menciptakan hunian yang nyaman
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-left">
                  <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-[#4ade80] shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white tracking-wide uppercase">
                      BETTER COMMUNICATION
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Keluhan mudah, respon lebih cepat
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-left">
                  <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-[#4ade80] shrink-0">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white tracking-wide uppercase">
                      BETTER MANAGEMENT
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Sistem terintegrasi dan efisien
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center pt-2">
                <p className="text-[11px] text-slate-500">
                  © 2026{' '}
                  <span className="text-[#4ade80] font-medium">
                    Gateway Apartment Bandung
                  </span>
                  . All rights reserved.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 2. MAIN LOGIN PAGE (MATCHING DARK LUXURY EMERALD THEME) */}
      {/* ========================================================================= */}

      {/* Header Top Left - Year 2026 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 p-6 md:p-8"
      >
        <span className="text-[#4ade80] text-xl md:text-2xl font-bold tracking-wider drop-shadow-[0_0_10px_rgba(74,222,128,0.3)]">
          2026
        </span>
      </motion.div>

      {/* Main Content - Card Center (Dark Emerald Glassmorphism) */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-4xl bg-[#0b1710]/85 backdrop-blur-xl p-4 md:p-6 rounded-[32px] shadow-[0_0_40px_rgba(34,197,94,0.15)] border border-emerald-500/30 overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Kiri: Gambar Apartemen Lengkung Unik */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="lg:col-span-6 relative h-[260px] sm:h-[340px] lg:h-[400px] w-full overflow-hidden rounded-[24px] rounded-tl-[100px] border border-emerald-500/20 shadow-xl"
            >
              <Image
                src="/background.webp"
                alt="Gateway Apartment"
                fill
                priority
                className="object-cover hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070d09]/70 via-transparent to-transparent" />
            </motion.div>

            {/* Kanan: Form Login & Logo Gateway */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="lg:col-span-6 flex flex-col justify-between h-full px-2 md:px-6 py-2"
            >
              {/* Logo Gateway Top Right */}
              <div className="flex justify-end mb-2">
                <Image
                  src="/logo.png"
                  alt="Gateway Logo"
                  width={140}
                  height={60}
                  className="h-12 md:h-14 w-auto object-contain drop-shadow-[0_0_12px_rgba(74,222,128,0.3)]"
                />
              </div>

              {/* Form Input */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white tracking-wide">
                    LOGIN
                  </h1>
                  <p className="text-xs text-[#4ade80] font-medium tracking-widest uppercase mt-1">
                    Resident Complaint Management System
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/20 text-red-300 text-xs px-4 py-2.5 rounded-xl border border-red-500/30 shadow-sm font-medium"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Input EMAIL */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 tracking-wider uppercase">
                    EMAIL
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Masukkan email..."
                    required
                    className="w-full px-4 py-3 bg-emerald-950/40 text-white placeholder-slate-500 font-medium rounded-xl border border-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-[#4ade80] focus:border-transparent transition-all text-sm md:text-base"
                  />
                </div>

                {/* Input PASSWORD + Fitur Mata (Toggle Show Password) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 tracking-wider uppercase">
                    PASSWORD
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-3 bg-emerald-950/40 text-white placeholder-slate-500 font-medium rounded-xl border border-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-[#4ade80] focus:border-transparent transition-all text-sm md:text-base pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#4ade80] transition-colors p-1"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Tombol MASUK (Mewah Green Emerald Accent) */}
                <div className="pt-3 flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-12 py-3 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-slate-950 font-extrabold text-sm tracking-widest uppercase rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.4)] border border-emerald-300 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'MEMPROSES...' : 'MASUK'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Footer Bottom Bar dengan Running Text (Infinite Seamless Loop) */}
      <div className="relative z-10 bg-[#070d09]/95 backdrop-blur-md py-3 border-t border-emerald-500/20 overflow-hidden">
        <div className="flex w-full overflow-hidden">
          <motion.div
            animate={{ x: ['0%', '-50%'] }}
            transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
            className="flex whitespace-nowrap text-white font-extrabold text-xs md:text-sm tracking-widest uppercase italic opacity-90 shrink-0"
          >
            <span className="flex items-center gap-6 pr-6">
              <span className="text-[#4ade80]">{marqueeText}</span>
              <span className="text-slate-600">//</span>
              <span className="text-white">{marqueeText}</span>
              <span className="text-slate-600">//</span>
            </span>
            <span className="flex items-center gap-6 pr-6">
              <span className="text-[#4ade80]">{marqueeText}</span>
              <span className="text-slate-600">//</span>
              <span className="text-white">{marqueeText}</span>
              <span className="text-slate-600">//</span>
            </span>
          </motion.div>
        </div>
      </div>
    </div>
  )
}