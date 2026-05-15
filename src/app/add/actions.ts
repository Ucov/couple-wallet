'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function addExpense(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('couple_id')
    .eq('id', user.id)
    .single()

  const amount = parseFloat(formData.get('amount') as string)
  const concept = formData.get('concept') as string
  const category_id = formData.get('category_id') as string

  if (!amount || !concept) {
    redirect('/add?message=Faltan campos obligatorios')
  }

  const { error } = await supabase.from('expenses').insert({
    amount,
    concept,
    description: concept,
    category_id: category_id || null,
    paid_by: user.id,
    couple_id: profile?.couple_id ?? null,
    date: new Date().toISOString(),
  })

  if (error) {
    redirect(`/add?message=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/')
  redirect('/')
}
