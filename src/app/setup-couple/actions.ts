'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createCouple(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const name = formData.get('name') as string
  const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase()

  const { data: couple, error: coupleError } = await supabase
    .from('couples')
    .insert({ name, join_code: joinCode })
    .select()
    .single()

  if (coupleError) {
    redirect(`/setup-couple?message=${encodeURIComponent(coupleError.message)}`)
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ couple_id: couple.id })
    .eq('id', user.id)

  if (profileError) {
    redirect(`/setup-couple?message=${encodeURIComponent(profileError.message)}`)
  }

  revalidatePath('/')
  redirect('/')
}

export async function joinCouple(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const joinCode = (formData.get('join_code') as string).toUpperCase()

  const { data: couple, error: coupleError } = await supabase
    .from('couples')
    .select('id')
    .eq('join_code', joinCode)
    .single()

  if (coupleError || !couple) {
    redirect(`/setup-couple?message=Código no válido`)
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ couple_id: couple.id })
    .eq('id', user.id)

  if (profileError) {
    redirect(`/setup-couple?message=${encodeURIComponent(profileError.message)}`)
  }

  revalidatePath('/')
  redirect('/')
}

export async function leaveCouple() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ couple_id: null })
    .eq('id', user.id)

  if (profileError) {
    throw new Error(profileError.message)
  }

  revalidatePath('/')
  redirect('/')
}
