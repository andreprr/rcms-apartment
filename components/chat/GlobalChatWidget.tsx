'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle,
  X,
  Users,
  Ticket as TicketIcon,
  Send,
  ChevronLeft,
  Loader2,
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { usePresence } from '@/hooks/usePresence'
import type { UserRole } from '@/types/database'

interface ChatUser {
  id: string
  full_name: string
  division: string
  avatar_url?: string | null
  role: UserRole
}

interface DirectMessage {
  id: string
  sender_id: string
  receiver_id: string
  message: string
  read_at: string | null
  created_at: string
}

interface TicketBrief {
  id: string
  ticket_number: string
  unit_code: string
  resident_name: string
  problem: string
  status: string
  created_by: string
  creators?: { full_name: string; id: string; role: UserRole } | null
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  RR: 'RR / Resepsionis',
  ENGINEERING_ADMIN: 'Engineering Admin',
  ENGINEERING: 'Engineering',
  PENGURUS: 'Management / Pengurus',
}

const ROLE_ORDER: UserRole[] = ['ADMIN', 'ENGINEERING_ADMIN', 'RR', 'ENGINEERING', 'PENGURUS']

interface GlobalChatWidgetProps {
  currentUser: {
    id: string
    full_name: string
    division: string
    avatar_url?: string | null
    role: UserRole
  }
}

export default function GlobalChatWidget({ currentUser }: GlobalChatWidgetProps) {
  const supabaseRef = useRef(createSupabaseBrowserClient())
  const { onlineUsers, isOnline } = usePresence(currentUser)

  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'users' | 'tickets'>('users')

  // Conversation context: null => directory
  const [peer, setPeer] = useState<ChatUser | null>(null)
  const [ticketContext, setTicketContext] = useState<TicketBrief | null>(null)

  const [directories, setDirectories] = useState<ChatUser[]>([])
  const [tickets, setTickets] = useState<TicketBrief[]>([])
  const [loading, setLoading] = useState(false)

  // Conversation state
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [unread, setUnread] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Ref yang merefleksikan peer aktif, agar subscription realtime tidak
  // perlu di-subscribe ulang setiap kali peer berubah (hanya subscribe sekali).
  const peerRef = useRef<ChatUser | null>(null)
  peerRef.current = peer

  // Mark pesan sebagai dibaca
  const markRead = useCallback((senderId: string, messageId: string) => {
    supabaseRef.current
      .from('direct_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('sender_id', senderId)
      .then(() => {})
  }, [])

  // ------------------------------------------------------------------
  // Fetch semua user (directory)
  // ------------------------------------------------------------------
  const loadUsers = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabaseRef.current
      .from('users')
      .select('id, full_name, division, avatar_url, role')
      .eq('is_active', true)
      .order('full_name')
    if (!error && data) {
      setDirectories(data as ChatUser[])
    }
    setLoading(false)
  }, [])

  // ------------------------------------------------------------------
  // Fetch tiket aktif (tab Tickets)
  // ------------------------------------------------------------------
  const loadTickets = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabaseRef.current
      .from('tickets')
      .select(`
        id,
        ticket_number,
        unit_code,
        resident_name,
        problem,
        status,
        created_by,
        creators:created_by(full_name, id, role)
      `)
      .in('status', [
        'NEW',
        'ASSIGNED',
        'WAITING_ANALYSIS',
        'ON_PROGRESS',
        'WAITING_CONFIRMATION',
        'REWORK',
        'ON_HOLD',
      ])
      .order('created_at', { ascending: false })
      .limit(20)
    if (!error && data) {
      setTickets(data as unknown as TicketBrief[])
    }
    setLoading(false)
  }, [])

  // ------------------------------------------------------------------
  // Realtime inbox: listen semua pesan masuk untuk user ini.
  // Subscribe sekali saat mount & cleanup saat unmount. Callback membaca
  // peer aktif dari ref supaya tidak re-subscribe pada setiap state update.
  // ------------------------------------------------------------------
  useEffect(() => {
    const supabase = supabaseRef.current
    const channel = supabase
      .channel(`dm-inbox-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${currentUser.id}`,
        },
        (payload) => {
          const msg = payload.new as DirectMessage
          const activePeer = peerRef.current
          // Hanya tampilkan pesan milik percakapan yang sedang aktif.
          if (activePeer && msg.sender_id === activePeer.id) {
            // Dedup: jangan tambah bila id sudah ada (hindari render ganda).
            setMessages((prev) =>
              prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
            )
            markRead(msg.sender_id, msg.id)
          } else {
            setUnread((u) => u + 1)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser.id, markRead])

  // ------------------------------------------------------------------
  // Load conversation saat peer berubah
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!peer) return
    let active = true
    const myId = currentUser.id
    const peerId = peer.id
    supabaseRef.current
      .from('direct_messages')
      .select('*')
      .or(
        `and(sender_id.eq.${myId},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${myId})`
      )
      .order('created_at', { ascending: true })
      .limit(200)
      .then(({ data }) => {
        if (!active) return
        const rows = (data as DirectMessage[]) || []
        // Merge by id: jangan timpa pesan optimistic (tmp-) yang sedang dikirim,
        // dan jangan duplikasi pesan yang sudah ada di state.
        setMessages((prev) => {
          const map = new Map<string, DirectMessage>()
          for (const row of rows) map.set(row.id, row)
          for (const p of prev) {
            if (p.id.startsWith('tmp-') && !map.has(p.id)) {
              map.set(p.id, p)
            }
          }
          return Array.from(map.values()).sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        })
        rows
          .filter((m) => m.sender_id === peerId && !m.read_at)
          .forEach((m) => markRead(peerId, m.id))
      })
    return () => {
      active = false
    }
  }, [supabaseRef, currentUser.id, peer, markRead])

  // Auto-scroll ke pesan terakhir
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ------------------------------------------------------------------
  // Buka percakapan 1-on-1 dengan user lain
  // ------------------------------------------------------------------
  const openConversation = useCallback((user: ChatUser) => {
    setPeer(user)
    setTicketContext(null)
    setActiveTab('users')
    setUnread(0)
  }, [])

  // ------------------------------------------------------------------
  // Buka chat berbasis tiket (DM dengan pembuat/pic tiket)
  // ------------------------------------------------------------------
  const openTicketChat = useCallback((ticket: TicketBrief) => {
    const creator = ticket.creators
    if (creator) {
      setPeer({
        id: creator.id,
        full_name: creator.full_name,
        division: '',
        avatar_url: null,
        role: creator.role,
      })
    }
    setTicketContext(ticket)
    setUnread(0)
  }, [])

  // ------------------------------------------------------------------
  // Kirim pesan
  // ------------------------------------------------------------------
  const handleSend = useCallback(
    async (e?: { preventDefault(): void }) => {
      // Cegah refresh halaman & server revalidation saat submit form.
      e?.preventDefault()
      const text = input.trim()
      if (!text || !peer || sending) return
      setSending(true)

      // 1. OPTIMISTIC UPDATE: tampilkan pesan sementara segera sebelum insert.
      const tempId = `tmp-${Date.now()}`
      const optimistic: DirectMessage = {
        id: tempId,
        sender_id: currentUser.id,
        receiver_id: peerRef.current!.id,
        message: text,
        read_at: null,
        created_at: new Date().toISOString(),
      }
      // Append tanpa menghapus pesan yang sudah ada (hanya tambahan terakhir).
      setMessages((prev) =>
        prev.some((m) => m.id === optimistic.id) ? prev : [...prev, optimistic]
      )
      // Hanya kosongkan kolom input, jangan reset state messages.
      setInput('')

      // 2. INSERT ke DB, minta record asli balik (.select().single()).
      const { data, error } = await supabaseRef.current
        .from('direct_messages')
        .insert({
          sender_id: currentUser.id,
          receiver_id: peerRef.current!.id,
          message: text,
        })
        .select()
        .single()

      // 3. Sukses: ganti pesan sementara dengan record asli (id DB).
      //    Gagal: rollback / hapus pesan sementara dari state.
      setMessages((prev) =>
        error
          ? prev.filter((m) => m.id !== tempId)
          : prev.map((m) => (m.id === tempId ? (data as DirectMessage) : m))
      )
      setSending(false)
    },
    [input, sending, currentUser.id]
  )

  const groupedUsers = useMemo(() => {
    const groups: Record<string, ChatUser[]> = {}
    for (const role of ROLE_ORDER) {
      const members = directories
        .filter((u) => u.role === role)
        .filter((u) => u.id !== currentUser.id)
      if (members.length) groups[role] = members
    }
    return groups
  }, [directories, currentUser.id])

  // ------------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------------
  return (
    <>
      {/* Floating Bubble */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {!open && (
            <motion.button
              key="bubble"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={() => {
                setOpen(true)
                setUnread(0)
                if (directories.length === 0) loadUsers()
              }}
              className="relative w-16 h-16 rounded-full bg-[#F7D794] hover:bg-[#EDA6A3] text-[#192A56] flex items-center justify-center shadow-xl hover:shadow-2xl transition-all cursor-pointer"
            >
              <MessageCircle className="w-7 h-7" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[24px] h-6 px-1.5 rounded-full bg-[#EDA6A3] border-2 border-[#FCFBFB] text-xs font-bold flex items-center justify-center text-[#192A56]">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Messenger Window */}
        <AnimatePresence>
          {open && (
            <motion.div
              key="window"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="fixed bottom-24 right-6 z-50 w-[94vw] max-w-[400px] h-[560px] max-h-[80vh] bg-[#FCFBFB] rounded-2xl shadow-2xl border border-[#F7D794]/40 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-[#192A56] text-[#FCFBFB] px-4 py-3 flex items-center justify-between border-b border-[#F7D794]/30">
                <div className="flex items-center gap-2 min-w-0">
                  {peer && (
                    <button
                      onClick={() => {
                        setPeer(null)
                        setTicketContext(null)
                      }}
                      className="p-1 shrink-0 hover:bg-[#F7D794]/20 rounded-lg transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-sm leading-tight truncate text-[#F7D794]">
                      {peer
                        ? ticketContext
                          ? `Tiket ${ticketContext.ticket_number}`
                          : peer.full_name
                        : 'Pesan'}
                    </p>
                    {peer && (
                      <p className="text-xs text-[#FCFBFB]/80 leading-tight truncate">
                        {ticketContext ? ticketContext.problem : `${ROLE_LABELS[peer.role] || peer.role} • ${peer.division || '-'}`}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 shrink-0 hover:bg-[#F7D794]/20 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {peer ? (
                  /* CHAT PANEL */
                  <>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#FCFBFB]">
                      {messages.length === 0 && (
                        <p className="text-center text-xs text-[#192A56]/50 mt-8">
                          Belum ada pesan. Mulai percakapan!
                        </p>
                      )}
                      {messages.map((m) => {
                        const mine = m.sender_id === currentUser.id
                        return (
                          <div
                            key={m.id}
                            className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-snug break-words ${
                              mine
                                ? 'bg-[#F7D794] text-[#192A56] ml-auto rounded-br-sm'
                                : 'bg-[#EDA6A3] text-[#192A56] mr-auto rounded-bl-sm'
                            }`}
                          >
                            <p>{m.message}</p>
                            <p className={`text-[10px] mt-0.5 ${mine ? 'text-[#192A56]/70' : 'text-[#192A56]/70'}`}>
                              {new Date(m.created_at).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                    <form
                      onSubmit={(e) => handleSend(e)}
                      className="p-3 border-t border-[#F7D794]/30 bg-[#FCFBFB] flex items-center gap-2"
                    >
                      <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Tulis pesan..."
                        className="flex-1 px-3 py-2 bg-[#FCFBFB] text-[#192A56] placeholder:text-[#192A56]/40 rounded-xl text-sm border border-[#F7D794]/40 focus:outline-none focus:ring-2 focus:ring-[#F7D794]"
                      />
                      <button
                        type="submit"
                        disabled={sending || !input.trim()}
                        className="p-2.5 rounded-xl bg-[#F7D794] hover:bg-[#EDA6A3] text-[#192A56] disabled:opacity-40 cursor-pointer transition-colors"
                      >
                        {sending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </form>
                  </>
                ) : (
                  /* DIRECTORY + TABS */
                  <>
                    {/* Tabs */}
                    <div className="flex border-b border-[#F7D794]/30">
                      <TabButton
                        active={activeTab === 'users'}
                        onClick={() => {
                          setActiveTab('users')
                          if (directories.length === 0) loadUsers()
                        }}
                        icon={<Users className="w-4 h-4" />}
                        label="Users"
                      />
                      <TabButton
                        active={activeTab === 'tickets'}
                        onClick={() => {
                          setActiveTab('tickets')
                          if (tickets.length === 0) loadTickets()
                        }}
                        icon={<TicketIcon className="w-4 h-4" />}
                        label="Tickets"
                      />
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      {activeTab === 'users' ? (
                        <UsersDirectory
                          groupedUsers={groupedUsers}
                          onlineUsers={onlineUsers}
                          isOnline={isOnline}
                          loading={loading}
                          onSelect={openConversation}
                        />
                      ) : (
                        <TicketsList tickets={tickets} onSelect={openTicketChat} />
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

// ------------------------------------------------------------------
// Tab button
// ------------------------------------------------------------------
function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors cursor-pointer ${
        active
          ? 'text-[#F7D794] border-b-2 border-[#F7D794] bg-[#192A56]/5'
          : 'text-[#192A56]/50 hover:text-[#192A56]'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

// ------------------------------------------------------------------
// Users directory grouped by role
// ------------------------------------------------------------------
function UsersDirectory({
  groupedUsers,
  onlineUsers,
  isOnline,
  loading,
  onSelect,
}: {
  groupedUsers: Record<string, ChatUser[]>
  onlineUsers: Record<string, { user_id: string }>
  isOnline: (id: string) => boolean
  loading: boolean
  onSelect: (u: ChatUser) => void
}) {
  const onlineCount = Object.keys(onlineUsers).filter((id) => id).length
  return (
    <div className="p-2 space-y-3">
      <div className="px-2 py-1 text-xs text-[#192A56]/50 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#D2F377]" />
        {loading ? 'Memuat...' : `${onlineCount} online sekarang`}
      </div>
      {Object.keys(groupedUsers).length === 0 && !loading && (
        <p className="text-center text-xs text-[#192A56]/40 py-8">Tidak ada pengguna lain.</p>
      )}
      {Object.entries(groupedUsers).map(([role, users]) => (
        <div key={role}>
          <p className="px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-[#F7D794]">
            {ROLE_LABELS[role] || role}
          </p>
          <div className="space-y-0.5">
            {users.map((u) => {
              const online = isOnline(u.id)
              return (
                <button
                  key={u.id}
                  onClick={() => onSelect(u)}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-[#F7D794]/10 transition-colors cursor-pointer text-left"
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-[#F7D794] flex items-center justify-center text-[#192A56] font-bold text-sm">
                      {u.full_name.charAt(0).toUpperCase()}
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#FCFBFB] ${
                        online ? 'bg-[#D2F377]' : 'bg-[#EDA6A3]'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#192A56] truncate">{u.full_name}</p>
                    <p className="text-xs text-[#192A56]/50 truncate">{u.division}</p>
                  </div>
                  <span
                    className={`text-xs font-medium ${online ? 'text-[#192A56]' : 'text-[#192A56]/40'}`}
                  >
                    {online ? 'Online' : 'Offline'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ------------------------------------------------------------------
// Tickets list
// ------------------------------------------------------------------
function TicketsList({
  tickets,
  onSelect,
}: {
  tickets: TicketBrief[]
  onSelect: (t: TicketBrief) => void
}) {
  return (
    <div className="p-2 space-y-1">
      {tickets.length === 0 && (
        <p className="text-center text-xs text-[#192A56]/40 py-8">Tidak ada tiket aktif.</p>
      )}
      {tickets.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t)}
          className="w-full flex items-start gap-3 px-2 py-2.5 rounded-xl hover:bg-[#F7D794]/10 transition-colors cursor-pointer text-left"
        >
          <div className="w-9 h-9 rounded-lg bg-[#F7D794]/20 flex items-center justify-center shrink-0">
            <TicketIcon className="w-4 h-4 text-[#F7D794]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#192A56] truncate">{t.ticket_number}</p>
            <p className="text-xs text-[#192A56]/60 truncate">{t.problem}</p>
            <p className="text-[11px] text-[#192A56]/40">
              {t.unit_code} • {t.resident_name}
            </p>
          </div>
          {t.creators && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EDA6A3]/20 text-[#192A56]/70 shrink-0">
              {t.creators.full_name}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
