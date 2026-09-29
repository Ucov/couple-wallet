'use server'

import { getServerPB } from '@/lib/pocketbase-server'
import { revalidatePath } from 'next/cache'
import { sendPushToPartner } from '@/utils/webPush'

export async function addChore(title: string, points: number = 10) {
  try {
    const pb = await getServerPB()
    const user = pb.authStore.model
    if (!user) return { error: 'No auth' }

    let profile
    try {
      profile = await pb.collection('users').getFirstListItem(`id="${user.id}"`)
    } catch(e) {}

    if (!profile?.couple_id) return { error: 'No couple' }
    const coupleId = profile.couple_id

    try {
      await pb.collection('chores').create({ couple_id: coupleId, title, points })
    } catch (error: any) {
      console.error(error)
      return { error: 'No se pudo añadir la tarea' }
    }

    sendPushToPartner(coupleId, user.id, '🧹 Nueva tarea', `${user.name || 'Tu pareja'} ha añadido la tarea: ${title}`, '/chores')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || String(err) }
  }
}

export async function toggleChoreStatus(id: string, isDone: boolean) {
  try {
    const pb = await getServerPB()
    const user = pb.authStore.model
    if (!user) return { error: 'No auth' }

    try {
      await pb.collection('chores').update(id, { 
        is_done: isDone,
        completed_at: isDone ? new Date().toISOString() : null,
        completed_by: isDone ? user.id : null
      })
    } catch (error: any) {
      return { error: error.message }
    }
    revalidatePath('/chores')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || String(err) }
  }
}

export async function assignChore(id: string, assignedTo: string | null) {
  try {
    const pb = await getServerPB()
    const user = pb.authStore.model
    if (!user) return { error: 'No auth' }

    try {
      await pb.collection('chores').update(id, { assigned_to: assignedTo })
    } catch (error: any) {
      return { error: error.message }
    }
    revalidatePath('/chores')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || String(err) }
  }
}

export async function deleteChore(id: string) {
  try {
    const pb = await getServerPB()
    const user = pb.authStore.model
    if (!user) return { error: 'No auth' }

    try {
      await pb.collection('chores').delete(id)
    } catch (error: any) {
      return { error: error.message }
    }
    revalidatePath('/chores')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || String(err) }
  }
}
