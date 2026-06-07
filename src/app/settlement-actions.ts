'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function settleMonth(coupleId: string, month: number, year: number, amount: number, debtorId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  let settleDateStr = new Date().toISOString()
  const settleDateObj = new Date()
  const currentMonthDate = settleDateObj.getMonth()
  const currentYearDate = settleDateObj.getFullYear()

  if (month !== currentMonthDate || year !== currentYearDate) {
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
    const mStr = String(month + 1).padStart(2, '0')
    const dStr = String(lastDay).padStart(2, '0')
    settleDateStr = `${year}-${mStr}-${dStr}T12:00:00.000Z`
  }

  const { error } = await supabase
    .from('expenses')
    .insert({
      amount: amount,
      concept: 'Liquidación (Bizum)',
      date: settleDateStr,
      paid_by: debtorId,
      couple_id: coupleId,
      is_transfer: true,
      category_id: null
    })

  if (error) {
    console.error('Error creating settlement transfer:', error)
    throw new Error(error.message)
  }

  revalidatePath('/')
}
