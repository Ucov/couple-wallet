'use server'

import { getServerPB } from '@/lib/pocketbase-server'
import { revalidatePath } from 'next/cache'

export async function getWeeklyMenu(startDate: string, endDate: string) {
  const pb = await getServerPB()
  const user = pb.authStore.model
  if (!user) return { error: 'Not authenticated' }

  let profile
  try {
    profile = await pb.collection('users').getFirstListItem(`id="${user.id}"`)
  } catch(e) {}

  if (!profile?.couple_id) return { error: 'No couple found' }

  try {
    const data = await pb.collection('weekly_menu').getFullList({
      filter: `couple_id="${profile.couple_id}" && date>="${startDate}" && date<="${endDate}"`,
      sort: 'date'
    })
    return { success: true, data, coupleId: profile.couple_id }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function upsertMenuMeal(date: string, type: 'lunch' | 'dinner', text: string) {
  const pb = await getServerPB()
  const user = pb.authStore.model
  if (!user) return { error: 'Not authenticated' }

  let profile
  try {
    profile = await pb.collection('users').getFirstListItem(`id="${user.id}"`)
  } catch(e) {}

  if (!profile?.couple_id) return { error: 'No couple found' }

  // Check if exists
  let existing
  try {
    existing = await pb.collection('weekly_menu').getFirstListItem(`couple_id="${profile.couple_id}" && date="${date}"`)
  } catch(e) {}

  try {
    if (existing) {
      await pb.collection('weekly_menu').update(existing.id, { [type]: text })
    } else {
      await pb.collection('weekly_menu').create({
        couple_id: profile.couple_id,
        date,
        [type]: text
      })
    }
  } catch (error: any) {
    return { error: error.message }
  }

  revalidatePath('/menu')
  return { success: true }
}
