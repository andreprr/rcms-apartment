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
    // Fetch photos for ticket
    const { data: photos, error } = await supabase
      .from('ticket_attachments')
      .select('id, storage_path, file_name, photo_type')
      .eq('ticket_id', id)
      .eq('photo_type', 'AFTER')
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ photos: photos || [] })
  } catch (error: any) {
    console.error('Error fetching photos:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch photos' }, { status: 500 })
  }
}
