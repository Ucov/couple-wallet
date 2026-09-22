'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getSavingsGoals() {
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
    .from('savings_goals')
    .select('*')
    .eq('couple_id', profile.couple_id)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { success: true, data }
}

export async function addContribution(goalId: string, amount: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // 1. Insert contribution
  const { error: contribError } = await supabase
    .from('savings_contributions')
    .insert({
      goal_id: goalId,
      user_id: user.id,
      amount
    })

  if (contribError) return { error: contribError.message }

  // 2. Update current_amount in goals
  // Wait, Supabase RPC or just fetch and update. For simplicity: fetch and update.
  const { data: goal } = await supabase
    .from('savings_goals')
    .select('current_amount')
    .eq('id', goalId)
    .single()

  if (goal) {
    const newAmount = Number(goal.current_amount) + amount
    await supabase
      .from('savings_goals')
      .update({ current_amount: newAmount, updated_at: new Date().toISOString() })
      .eq('id', goalId)
  }

  revalidatePath('/')
  return { success: true }
}

export async function createSavingsGoal(name: string, targetAmount: number, emoji: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('couple_id')
    .eq('id', user.id)
    .single()

  if (!profile?.couple_id) return { error: 'No couple found' }

  const { error } = await supabase
    .from('savings_goals')
    .insert({
      couple_id: profile.couple_id,
      name,
      target_amount: targetAmount,
      emoji
    })

  if (error) return { error: error.message }
  revalidatePath('/')
  return { success: true }
}
