import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

// POST - Handle work actions (start, update, extend, finish)
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check user auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('id, role, full_name')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile || (profile.role !== 'ENGINEERING' && profile.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const ticketId = formData.get('ticket_id') as string
    const stage = formData.get('stage') as string
    const workDescription = formData.get('work_description') as string
    const actionType = formData.get('action_type') as string
    const dayNumber = parseInt(formData.get('day_number') as string) || 1

    if (!ticketId) {
      return NextResponse.json({ error: 'ticket_id is required' }, { status: 400 })
    }

    // Check if this is a new work (ASSIGNED -> ON_PROGRESS)
    const { data: ticket } = await supabase
      .from('tickets')
      .select('status, started_at')
      .eq('id', ticketId)
      .single()

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const isNewWork = ticket.status === 'ASSIGNED' && !ticket.started_at
    const isFinishAction = actionType === 'FINISH'

    // Handle file uploads
    const fileKeys = Array.from(formData.keys()).filter(k => k.startsWith('file_'))
    for (const key of fileKeys) {
      const file = formData.get(key) as File
      const typeKey = key.replace('file_', 'file_type_')
      const photoType = formData.get(typeKey) as string || 'PROGRESS'

      if (file && file.size > 0) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${ticketId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('ticket-attachments')
          .upload(fileName, file)

        if (!uploadError) {
          await supabase.from('ticket_attachments').insert({
            ticket_id: ticketId,
            uploaded_by: profile.id,
            photo_type: photoType,
            storage_path: fileName,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
          })
        }
      }
    }

    // Create daily log
    await supabase.from('ticket_daily_logs').insert({
      ticket_id: ticketId,
      engineering_id: profile.id,
      day_number: dayNumber,
      work_description: workDescription || '',
      action_type: actionType,
    })

    // Update ticket status and stage
    const updates: Record<string, any> = {
      current_stage: stage,
    }

    if (isNewWork) {
      updates.status = 'ON_PROGRESS'
      updates.started_at = new Date().toISOString()
    }

    if (isFinishAction) {
      updates.status = 'WAITING_CONFIRMATION'
      updates.submitted_at = new Date().toISOString()
    }

    await supabase
      .from('tickets')
      .update(updates)
      .eq('id', ticketId)

    // Add history
    await supabase.from('ticket_history').insert({
      ticket_id: ticketId,
      user_id: profile.id,
      action: isFinishAction ? 'SUBMITTED_COMPLETION' : `DAY_${dayNumber}_LOG`,
      description: isFinishAction
        ? `Pekerjaan selesai dan menunggu konfirmasi resident oleh ${profile.full_name}`
        : `Progress Day ${dayNumber}: ${workDescription || 'No description'}`,
    })

    revalidatePath('/engineering')
    revalidatePath('/engineering/task')
    revalidatePath(`/tickets/${ticketId}`)

    return NextResponse.json({ success: true, message: 'Work action saved' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('Error processing work action:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
