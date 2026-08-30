import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch semua foto tiket (BEFORE / PROGRESS / AFTER / dll) agar bisa dikelompokkan
    const { data: photos, error } = await supabase
      .from('ticket_attachments')
      .select('id, storage_path, file_name, photo_type')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true })

    if (error) throw error

    const resolved = (photos || []).map((p: any) => ({
      id: p.id,
      storage_path: supabase.storage.from('ticket-attachments').getPublicUrl(p.storage_path).data.publicUrl,
      file_name: p.file_name,
      photo_type: p.photo_type,
    }))

    return NextResponse.json({ photos: resolved })
  } catch (error: any) {
    console.error('Error fetching photos:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch photos' }, { status: 500 })
  }
}
