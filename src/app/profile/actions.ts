'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No estás autenticado')

  const name = formData.get('name') as string
  if (name) {
    const { error } = await supabase
      .from('profiles')
      .update({ name })
      .eq('id', user.id)
    if (error) throw new Error(error.message)
  }

  const password = formData.get('password') as string
  if (password && password.length >= 6) {
    const { error } = await supabase.auth.updateUser({
      password: password
    })
    if (error) throw new Error(error.message)
  }

  revalidatePath('/')
  revalidatePath('/profile')
  return { success: true }
}

export async function saveSubscription(subscriptionJson: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No user')

  await supabase
    .from('push_subscriptions')
    .insert({
      user_id: user.id,
      subscription_json: subscriptionJson
    })
}

export async function deleteSubscription(endpoint: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No user')

  await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .contains('subscription_json', { endpoint })
}

export async function generateJoinCode(coupleId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No user' }

  const newCode = Math.random().toString(36).substring(2, 8).toUpperCase()
  const { error } = await supabase
    .from('couples')
    .update({ join_code: newCode })
    .eq('id', coupleId)

  if (error) return { error: error.message }
  revalidatePath('/profile')
  return { success: true, code: newCode }
}

export async function updateSplitPercentage(percentage: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No user')

  if (percentage < 0 || percentage > 100) {
    throw new Error('Porcentaje inválido')
  }

  const { error } = await supabase
    .from('profiles')
    .update({ split_percentage: percentage })
    .eq('id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/')
  revalidatePath('/profile')
  return { success: true }
}
