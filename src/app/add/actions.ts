'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const expenseSchema = z.object({
  amount: z.number().positive('La cantidad debe ser mayor a 0'),
  concept: z.string().min(1, 'El concepto es obligatorio'),
  category_id: z.string().uuid('Categoría no válida').optional().nullable(),
  date: z.string().min(1, 'La fecha es obligatoria'),
  paid_by_me: z.enum(['true', 'false']),
})

export async function addExpense(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Validar con Zod
  const rawData = {
    amount: parseFloat(formData.get('amount') as string),
    concept: formData.get('concept') as string,
    category_id: formData.get('category_id') as string || null,
    date: formData.get('date') as string,
    paid_by_me: formData.get('paid_by_me') as 'true' | 'false',
  }

  const validatedFields = expenseSchema.safeParse(rawData)

  if (!validatedFields.success) {
    const errorMsg = validatedFields.error.issues[0].message
    redirect(`/add?message=${encodeURIComponent(errorMsg)}`)
  }

  const { amount, concept, category_id, date, paid_by_me } = validatedFields.data

  const { data: profile } = await supabase
    .from('profiles')
    .select('couple_id')
    .eq('id', user.id)
    .single()

  let finalPaidBy = user.id

  // Si pagó la pareja, buscar su ID
  if (paid_by_me === 'false' && profile?.couple_id) {
    const { data: partnerProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('couple_id', profile.couple_id)
      .neq('id', user.id)
      .maybeSingle()
      
    if (partnerProfile) {
      finalPaidBy = partnerProfile.id
    } else {
      redirect(`/add?message=${encodeURIComponent('No se encontró a tu pareja')}`)
    }
  }

  const { error } = await supabase.from('expenses').insert({
    amount,
    concept,
    category_id: category_id || null,
    paid_by: finalPaidBy,
    couple_id: profile?.couple_id || null,
    date: new Date(date).toISOString(),
  })

  if (error) {
    redirect(`/add?message=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/')
  redirect('/')
}
