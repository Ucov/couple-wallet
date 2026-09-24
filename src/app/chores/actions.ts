'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendPushToPartner } from '@/utils/webPush'

export async function addChore(title: string, points: number = 10) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No auth' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('couple_id')
      .eq('id', user.id)
      .single()

    if (!profile?.couple_id) return { error: 'No couple' }
    const coupleId = profile.couple_id

    const { error } = await supabase
      .from('chores')
      .insert([{ couple_id: coupleId, title, points }])

    if (error) {
      console.error(error)
      return { error: 'No se pudo añadir la tarea' }
    }

    // Enviar notificación a la pareja (sin bloquear la ejecución de la UI)
    sendPushToPartner(coupleId, user.id, '🧹 Nueva tarea', `${user.user_metadata?.name || 'Tu pareja'} ha añadido la tarea: ${title}`, '/chores')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || String(err) }
  }
}

export async function toggleChoreStatus(id: string, isDone: boolean) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No auth' }

    const { error } = await supabase
      .from('chores')
      .update({ 
        is_done: isDone,
        completed_at: isDone ? new Date().toISOString() : null,
        completed_by: isDone ? user.id : null
      })
      .eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/chores')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || String(err) }
  }
}

export async function assignChore(id: string, assignedTo: string | null) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No auth' }

    const { error } = await supabase
      .from('chores')
      .update({ assigned_to: assignedTo })
      .eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/chores')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || String(err) }
  }
}

export async function deleteChore(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No auth' }

    const { error } = await supabase
      .from('chores')
      .delete()
      .eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/chores')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || String(err) }
  }
}
