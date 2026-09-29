'use server'

import { getServerPB } from '@/lib/pocketbase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createCouple(formData: FormData) {
  const pb = await getServerPB()
  const user = pb.authStore.model || pb.authStore.record
  if (!user) throw new Error('Not authenticated')

  const name = formData.get('name') as string
  const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase()

  let couple
  try {
    couple = await pb.collection('couples').create({ name, join_code: joinCode })
  } catch (coupleError: any) {
    redirect(`/setup-couple?message=${encodeURIComponent(coupleError.message)}`)
  }

  try {
    await pb.collection('users').update(user.id, { couple_id: couple.id })
  } catch (profileError: any) {
    redirect(`/setup-couple?message=${encodeURIComponent(profileError.message)}`)
  }

  revalidatePath('/')
  redirect('/')
}

export async function joinCouple(formData: FormData) {
  const pb = await getServerPB()
  const user = pb.authStore.model || pb.authStore.record
  if (!user) throw new Error('Not authenticated')

  const joinCode = (formData.get('join_code') as string).toUpperCase()

  let couple
  try {
    couple = await pb.collection('couples').getFirstListItem(`join_code="${joinCode}"`)
  } catch (coupleError: any) {
    redirect(`/setup-couple?message=Código no válido`)
  }

  if (!couple) {
    redirect(`/setup-couple?message=Código no válido`)
  }

  try {
    await pb.collection('users').update(user.id, { couple_id: couple.id })
  } catch (profileError: any) {
    redirect(`/setup-couple?message=${encodeURIComponent(profileError.message)}`)
  }

  revalidatePath('/')
  redirect('/')
}

export async function leaveCouple() {
  const pb = await getServerPB()
  const user = pb.authStore.model || pb.authStore.record
  if (!user) throw new Error('Not authenticated')

  try {
    await pb.collection('users').update(user.id, { couple_id: null })
  } catch (profileError: any) {
    throw new Error(profileError.message)
  }

  revalidatePath('/')
  redirect('/')
}
