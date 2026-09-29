'use server'

import { getServerPB } from '@/lib/pocketbase-server'
import { revalidatePath } from 'next/cache'
import { sendPushToPartner } from '@/utils/webPush'

export async function addCalendarEvent(coupleId: string, title: string, dateIso: string) {
  try {
    const pb = await getServerPB()
    const user = pb.authStore.model
    if (!user) return { error: 'No autorizado' }

    await pb.collection('calendar_events').create({ 
        couple_id: coupleId, 
        title, 
        date: dateIso, 
        created_by: user.id 
    })
    
    sendPushToPartner(coupleId, user.id, '📅 Nuevo evento en agenda', `${user.name || 'Tu pareja'} ha añadido: ${title}`, '/calendar')

    revalidatePath('/calendar')
    return { success: true }
  } catch (err: any) {
    console.error('Error addCalendarEvent:', err)
    return { error: err.message || String(err) }
  }
}

export async function deleteCalendarEvent(id: string) {
  try {
    const pb = await getServerPB()
    const user = pb.authStore.model
    if (!user) return { error: 'No autorizado' }

    await pb.collection('calendar_events').delete(id)
    
    revalidatePath('/calendar')
    return { success: true }
  } catch (err: any) {
    console.error('Error deleteCalendarEvent:', err)
    return { error: err.message || String(err) }
  }
}
