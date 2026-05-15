'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function addExpense(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const amount = parseFloat(formData.get('amount') as string)
  const concept = formData.get('concept') as string
  const category_id = formData.get('category_id') as string

  if (!amount || !concept || !category_id) {
    redirect('/add?message=Faltan campos obligatorios')
  }

  const { error } = await supabase.from('expenses').insert({
    amount,
    concept,
    category_id,
    paid_by: user.id, // Asumimos que quien añade el gasto, lo pagó (para el MVP).
    date: new Date().toISOString(),
  })

  if (error) {
    redirect(`/add?message=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/')
  redirect('/')
}
