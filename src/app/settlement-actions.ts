'use server'

import { getServerPB } from '@/lib/pocketbase-server'
import { revalidatePath } from 'next/cache'

export async function settleMonth(coupleId: string, month: number, year: number, amount: number, debtorId: string) {
  const pb = await getServerPB()

  const user = pb.authStore.model
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

  try {
    await pb.collection('expenses').create({
      amount: amount,
      concept: 'Liquidación (Bizum)',
      date: settleDateStr,
      paid_by: debtorId,
      couple_id: coupleId,
      is_transfer: true,
      category_id: null
    })
  } catch (error: any) {
    console.error('Error creating settlement transfer:', error)
    throw new Error(error.message)
  }

  revalidatePath('/')
}
