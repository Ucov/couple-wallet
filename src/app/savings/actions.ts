'use server'

import { getServerPB } from '@/lib/pocketbase-server'
import { revalidatePath } from 'next/cache'

export async function getSavingsGoals() {
  const pb = await getServerPB()
  const user = pb.authStore.model
  if (!user) return { error: 'Not authenticated' }

  let profile
  try {
    profile = await pb.collection('users').getFirstListItem(`id="${user.id}"`)
  } catch(e) {}

  if (!profile?.couple_id) return { error: 'No couple found' }

  try {
    const data = await pb.collection('savings_goals').getFullList({
      filter: `couple_id="${profile.couple_id}"`,
      sort: '-created'
    })
    return { success: true, data }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function addContribution(goalId: string, amount: number) {
  const pb = await getServerPB()
  const user = pb.authStore.model
  if (!user) return { error: 'Not authenticated' }

  // 1. Insert contribution
  try {
    await pb.collection('savings_contributions').create({
      goal_id: goalId,
      user_id: user.id,
      amount
    })
  } catch (contribError: any) {
    return { error: contribError.message }
  }

  // 2. Update current_amount in goals
  try {
    const goal = await pb.collection('savings_goals').getOne(goalId)
    if (goal) {
      const newAmount = Number(goal.current_amount) + amount
      await pb.collection('savings_goals').update(goalId, { 
        current_amount: newAmount, 
      })
    }
  } catch(e) {}

  revalidatePath('/')
  return { success: true }
}

export async function createSavingsGoal(name: string, targetAmount: number, emoji: string) {
  const pb = await getServerPB()
  const user = pb.authStore.model
  if (!user) return { error: 'Not authenticated' }

  let profile
  try {
    profile = await pb.collection('users').getFirstListItem(`id="${user.id}"`)
  } catch(e) {}

  if (!profile?.couple_id) return { error: 'No couple found' }

  try {
    await pb.collection('savings_goals').create({
      couple_id: profile.couple_id,
      name,
      target_amount: targetAmount,
      emoji
    })
  } catch (error: any) {
    return { error: error.message }
  }
  revalidatePath('/')
  return { success: true }
}

export async function deleteSavingsGoal(goalId: string) {
  const pb = await getServerPB()
  const user = pb.authStore.model
  if (!user) return { error: 'Not authenticated' }

  try {
    await pb.collection('savings_goals').delete(goalId)
  } catch (error: any) {
    return { error: error.message }
  }
  
  revalidatePath('/')
  return { success: true }
}
