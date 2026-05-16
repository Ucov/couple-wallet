'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const updateExpenseSchema = z.object({
  amount: z.number().positive('La cantidad debe ser mayor a 0'),
  concept: z.string().min(1, 'El concepto es obligatorio'),
  category_id: z.string().uuid('Categoría no válida').optional().nullable(),
  date: z.string().min(1, 'La fecha es obligatoria'),
})

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
    return
  }

  revalidatePath('/')
}

export async function updateExpense(id: string, formData: FormData): Promise<void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const rawData = {
    amount: parseFloat(formData.get('amount') as string),
    concept: formData.get('concept') as string,
    category_id: formData.get('category_id') as string || null,
    date: formData.get('date') as string,
  }

  const validatedFields = updateExpenseSchema.safeParse(rawData)

  if (!validatedFields.success) {
    const errorMsg = validatedFields.error.issues[0].message
    redirect(`/edit/${id}?message=${encodeURIComponent(errorMsg)}`)
  }

  const { amount, concept, category_id, date } = validatedFields.data

  const { error } = await supabase
    .from('expenses')
    .update({
      amount,
      concept,
      category_id: category_id || null,
      date: new Date(date).toISOString(),
    })
    .eq('id', id)

  if (error) {
    redirect(`/edit/${id}?message=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/')
  redirect('/')
}
