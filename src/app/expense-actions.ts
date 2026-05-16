'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function deleteExpense(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting expense:', error)
    throw new Error(error.message)
  }

  revalidatePath('/')
}

export async function updateExpense(id: string, formData: FormData): Promise<void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const amount = parseFloat(formData.get('amount') as string)
  const concept = formData.get('concept') as string
  const category_id = formData.get('category_id') as string
  const date = formData.get('date') as string

  if (!amount || !concept) {
    throw new Error('Faltan campos obligatorios')
  }

  const { error } = await supabase
    .from('expenses')
    .update({
      amount,
      concept,
      category_id: category_id || null,
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating expense:', error)
    throw new Error(error.message)
  }

  revalidatePath('/')
  redirect('/')
}
