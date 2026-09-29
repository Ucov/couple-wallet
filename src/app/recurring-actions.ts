'use server'

import { getServerPB } from '@/lib/pocketbase-server'
import { revalidatePath } from 'next/cache'

export async function addRecurringExpense(formData: FormData) {
  const pb = await getServerPB()

  const user = pb.authStore.model
  if (!user) return

  let profile = null
  try {
    profile = await pb.collection('users').getFirstListItem(`id="${user.id}"`)
  } catch (e) {
    return
  }

  if (!profile || !profile.couple_id) {
    return
  }

  const amount = parseFloat(formData.get('amount') as string)
  const concept = formData.get('concept') as string
  const category_id = formData.get('category_id') as string
  const day_of_month = parseInt(formData.get('day_of_month') as string, 10)
  const paid_by_me = formData.get('paid_by_me') as string

  if (!amount || !concept || !day_of_month) {
    return
  }

  let finalPaidBy = user.id

  if (paid_by_me === 'false') {
    try {
      const partnerProfile = await pb.collection('users').getFirstListItem(`couple_id="${profile.couple_id}" && id!="${user.id}"`)
      if (partnerProfile) {
        finalPaidBy = partnerProfile.id
      }
    } catch(e) {}
  }

  try {
    await pb.collection('recurring_expenses').create({
      amount,
      concept,
      category_id: category_id || null,
      paid_by: finalPaidBy,
      couple_id: profile.couple_id,
      day_of_month
    })
  } catch (error: any) {
    console.error('Error adding recurring expense:', error)
    return
  }

  revalidatePath('/recurring')
}

export async function deleteRecurringExpense(id: string) {
  const pb = await getServerPB()

  const user = pb.authStore.model
  if (!user) throw new Error('Not authenticated')
  
  try {
    await pb.collection('recurring_expenses').delete(id)
  } catch (error: any) {
    console.error('Error deleting recurring expense:', error)
    throw new Error(error.message)
  }

  revalidatePath('/recurring')
}

export async function applyRecurringExpenses(coupleId: string, month: number, year: number, shouldRevalidate = true) {
  const pb = await getServerPB()

  // 1. Check if already applied
  let application = null
  try {
    application = await pb.collection('recurring_applications').getFirstListItem(`couple_id="${coupleId}" && month=${month} && year=${year}`)
  } catch(e) {}

  if (application) {
    // Already applied for this month
    return { success: true, appliedCount: 0 }
  }

  // 2. Fetch recurring expenses for this couple
  let recurring: any[] = []
  try {
    recurring = await pb.collection('recurring_expenses').getFullList({ filter: `couple_id="${coupleId}"` })
  } catch(e) {}

  if (!recurring || recurring.length === 0) {
    // No expenses to apply, just mark as applied to avoid checking again
    try {
      await pb.collection('recurring_applications').create({
        couple_id: coupleId,
        month,
        year
      })
    } catch(e) {}
    return { success: true, appliedCount: 0 }
  }

  // 3. Attempt to mark as applied FIRST (Race condition prevention)
  let appId = null
  try {
    const recApp = await pb.collection('recurring_applications').create({
      couple_id: coupleId,
      month,
      year
    })
    appId = recApp.id
  } catch(markError) {
    // Already applied or concurrent request won
    return { success: true, appliedCount: 0 }
  }

  let successCount = 0
  for (const exp of recurring) {
    // Create a date for this specific month/year and the recurring day
    const date = new Date(year, month, exp.day_of_month)
    if (date.getMonth() !== month) {
        // If it rolled over to next month (e.g. Feb 30 -> Mar 2), clamp to last day of month
        date.setDate(0)
    }

    try {
      await pb.collection('expenses').create({
        amount: exp.amount,
        concept: exp.concept,
        category_id: exp.category_id,
        paid_by: exp.paid_by,
        couple_id: exp.couple_id,
        date: date.toISOString(),
      })
      successCount++
    } catch(insertError: any) {
      console.error('Error applying recurring expenses:', insertError)
      // Rollback the application mark if we failed
      if (appId) {
        try { await pb.collection('recurring_applications').delete(appId) } catch(e) {}
      }
      throw new Error(insertError.message)
    }
  }

  if (shouldRevalidate) {
    revalidatePath('/')
  }
  return { success: true, appliedCount: successCount }
}
