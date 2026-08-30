'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

interface PresenceUser {
  user_id: string
  full_name: string
  role: string
  avatar_url?: string | null
}

/**
 * Realtime Online Presence via Supabase Realtime Presence.
 *
 * Setiap user yang login & membuka dashboard akan "hadir" di channel
 * `global-presence-room`. Channel otomatis di-subscribe dan di-unsubscribe
 * saat komponen di-unmount sehingga status online-nya akurat.
 */
export function usePresence(currentUser: {
  id: string
  full_name: string
  role: string
  avatar_url?: string | null
}) {
  const supabaseRef = useRef(createSupabaseBrowserClient())

  const [onlineUsers, setOnlineUsers] = useState<Record<string, PresenceUser>>({})

  useEffect(() => {
    const supabase = supabaseRef.current
    // Solo presence channel keyed per user id: memastikan hanya 1 kehadiran per user.
    const channel = supabase
      .channel('global-presence-room', { config: { presence: { key: currentUser.id } } })
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState<PresenceUser>()
        const newState: Record<string, PresenceUser> = {}
        for (const key of Object.keys(presenceState)) {
          const members = presenceState[key]
          if (members && members[0]) {
            newState[members[0].user_id] = members[0]
          }
        }
        setOnlineUsers(newState)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.track({
            user_id: currentUser.id,
            full_name: currentUser.full_name,
            role: currentUser.role,
            avatar_url: currentUser.avatar_url || null,
          })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser.id, currentUser.full_name, currentUser.role, currentUser.avatar_url])

  const isOnline = useCallback((userId: string): boolean => {
    return !!onlineUsers[userId]
  }, [onlineUsers])

  return { onlineUsers, isOnline }
}
