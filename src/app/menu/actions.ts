'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getWeeklyMenu(startDate: string, endDate: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('couple_id')
    .eq('id', user.id)
    .single()

  if (!profile?.couple_id) return { error: 'No couple found' }

  const { data, error } = await supabase
    .from('weekly_menu')
    .select('*')
    .eq('couple_id', profile.couple_id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  if (error) return { error: error.message }
  return { success: true, data, coupleId: profile.couple_id }
}

export async function upsertMenuMeal(date: string, type: 'lunch' | 'dinner', text: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('couple_id')
    .eq('id', user.id)
    .single()

  if (!profile?.couple_id) return { error: 'No couple found' }

  // Check if exists
  const { data: existing } = await supabase
    .from('weekly_menu')
    .select('id')
    .eq('couple_id', profile.couple_id)
    .eq('date', date)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('weekly_menu')
      .update({ [type]: text, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('weekly_menu')
      .insert({
        couple_id: profile.couple_id,
        date,
        [type]: text
      })
    if (error) return { error: error.message }
  }

  revalidatePath('/menu')
  return { success: true }
}
