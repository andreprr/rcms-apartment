export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import PrintTicketClient from '@/components/tickets/PrintTicketClient'

interface PrintPageProps {
  params: Promise<{ id: string }> | { id: string }
}

// Regex untuk mendeteksi apakah parameter berupa UUID (ID tiket) atau bukan (ticket_number)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// CATATAN SKEMA:
// Tabel `tickets` pada proyek ini TIDAK memiliki relasi `units`, `complaint_categories`,
// atau kolom `created_by_user`. Kolom yang tersedia: unit_code, resident_name, problem,
// description, status, priority, scheduled_at, created_at, dan FK `created_by` -> users.
// Query menggunakan relasi yang benar agar tidak memutus (blank) saat fetch.
async function fetchTicketWithRetry(supabase: any, ticketId: string, maxAttempts = 10): Promise<any> {
  const isUuid = UUID_REGEX.test(ticketId)

  let previousAttempt: any = null
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let query = supabase
      .from('tickets')
      .select(`
        id,
        ticket_number,
        unit_code,
        resident_name,
        problem,
        description,
        status,
        priority,
        scheduled_at,
        created_at,
        users:created_by(full_name)
      `)

    // Jika ID valid UUID → query by id. Jika bukan (ticket_number) → query hanya by ticket_number.
    // Memisahkan query menghindari error "invalid input syntax for type uuid"
    if (isUuid) {
      query = query
        .or(`id.eq.${ticketId},ticket_number.eq.${ticketId}`)
    } else {
      query = query.eq('ticket_number', ticketId)
    }

    // use maybeSingle() agar tidak melempar error saat 0 baris (replication lag)
    const { data, error } = await query.maybeSingle()
    previousAttempt = error || null

    if (data) {
      return data
    }

    // backoff agar tiket yang baru dibuat sempat tersedia sebelum dicetak ulang
    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 400 * attempt))
    }
  }
  console.error('Print ticket not found after retries:', ticketId, previousAttempt)
  return null
}

export default async function PrintTicketPage({ params }: PrintPageProps) {
  const resolvedParams = await params
  const ticketId = resolvedParams.id

  if (!ticketId) notFound()

  const supabase = await createClient()

  // Halaman print dilindungi - hanya user terautentikasi (RR khus. RR) yang boleh print ulang
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ticket = await fetchTicketWithRetry(supabase, ticketId)

  if (!ticket) {
    console.error('Fetch ticket print error: ticket not found')
    notFound()
  }

  return <PrintTicketClient ticket={ticket} />
}
