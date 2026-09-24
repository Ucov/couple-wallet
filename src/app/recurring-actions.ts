'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addRecurringExpense(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Get user profile to get couple_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('couple_id')
    .eq('id', user.id)
    .single()

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
    const { data: partnerProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('couple_id', profile.couple_id)
      .neq('id', user.id)
      .maybeSingle()
      
    if (partnerProfile) {
      finalPaidBy = partnerProfile.id
    }
  }

  const { error } = await supabase
    .from('recurring_expenses')
    .insert({
      amount,
      concept,
      category_id: category_id || null,
      paid_by: finalPaidBy,
      couple_id: profile.couple_id,
      day_of_month
    })

  if (error) {
    console.error('Error adding recurring expense:', error)
    return
  }

  revalidatePath('/recurring')
}

export async function deleteRecurringExpense(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  const { error } = await supabase
    .from('recurring_expenses')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting recurring expense:', error)
    throw new Error(error.message)
  }

  revalidatePath('/recurring')
}

export async function applyRecurringExpenses(coupleId: string, month: number, year: number, shouldRevalidate = true) {
  const supabase = await createClient()

  // 1. Check if already applied
  const { data: application } = await supabase
    .from('recurring_applications')
    .select('id')
    .eq('couple_id', coupleId)
    .eq('month', month)
    .eq('year', year)
    .maybeSingle()

  if (application) {
    // Already applied for this month
    return { success: true, appliedCount: 0 }
  }

  // 2. Fetch recurring expenses for this couple
  const { data: recurring } = await supabase
    .from('recurring_expenses')
    .select('*')
    .eq('couple_id', coupleId)

  if (!recurring || recurring.length === 0) {
    // No expenses to apply, just mark as applied to avoid checking again
    await supabase.from('recurring_applications').insert({
      couple_id: coupleId,
      month,
      year
    })
    return { success: true, appliedCount: 0 }
  }

  // 3. Attempt to mark as applied FIRST (Race condition prevention)
  // We assume there's a unique constraint on (couple_id, month, year) in the DB.
  // If two requests come at the same time, the second one will fail here.
  const { error: markError } = await supabase
    .from('recurring_applications')
    .insert({
      couple_id: coupleId,
      month,
      year
    })

  if (markError) {
    // Already applied or concurrent request won
    return { success: true, appliedCount: 0 }
  }

  const expensesToInsert = recurring.map(exp => {
    // Create a date for this specific month/year and the recurring day
    const date = new Date(year, month, exp.day_of_month)
    if (date.getMonth() !== month) {
        // If it rolled over to next month (e.g. Feb 30 -> Mar 2), clamp to last day of month
        date.setDate(0)
    }

    return {
      amount: exp.amount,
      concept: exp.concept,
      category_id: exp.category_id,
      paid_by: exp.paid_by,
      couple_id: exp.couple_id,
      date: date.toISOString(),
    }
  })

  // 4. Insert expenses for this month
  const { error: insertError } = await supabase
    .from('expenses')
    .insert(expensesToInsert)

  if (insertError) {
    console.error('Error applying recurring expenses:', insertError)
    // Rollback the application mark if we failed to insert expenses
    await supabase.from('recurring_applications').delete().match({ couple_id: coupleId, month, year })
    throw new Error(insertError.message)
  }


  if (shouldRevalidate) {
    revalidatePath('/')
  }
  return { success: true, appliedCount: expensesToInsert.length }
}
