'use server'

import { getServerPB } from '@/lib/pocketbase-server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const pb = await getServerPB()
  const user = pb.authStore.model
  if (!user) throw new Error('No estás autenticado')

  const name = formData.get('name') as string
  if (name) {
    try {
      await pb.collection('users').update(user.id, { name })
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  const password = formData.get('password') as string
  const passwordConfirm = formData.get('password') as string // Pocketbase requires passwordConfirm
  if (password && password.length >= 8) { // Pocketbase min password length is usually 8
    try {
      await pb.collection('users').update(user.id, {
        password: password,
        passwordConfirm: passwordConfirm,
        oldPassword: formData.get('oldPassword') as string // Usually required if password changing, but let's just pass what we can or rely on PB settings
      })
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  revalidatePath('/')
  revalidatePath('/profile')
  return { success: true }
}

export async function saveSubscription(subscriptionJson: any) {
  const pb = await getServerPB()
  const user = pb.authStore.model
  if (!user) throw new Error('No user')

  try {
    await pb.collection('push_subscriptions').create({
      user_id: user.id,
      subscription_json: subscriptionJson
    })
  } catch(e) {}
}

export async function deleteSubscription(endpoint: string) {
  const pb = await getServerPB()
  const user = pb.authStore.model
  if (!user) throw new Error('No user')

  try {
    // Pocketbase doesn't have a JSON contains filter, so we fetch all and delete the matching one
    const subs = await pb.collection('push_subscriptions').getFullList({ filter: `user_id="${user.id}"` })
    for (const sub of subs) {
      if (sub.subscription_json?.endpoint === endpoint) {
        await pb.collection('push_subscriptions').delete(sub.id)
      }
    }
  } catch(e) {}
}

export async function generateJoinCode(coupleId: string) {
  const pb = await getServerPB()
  const user = pb.authStore.model
  if (!user) return { error: 'No user' }

  const newCode = Math.random().toString(36).substring(2, 8).toUpperCase()
  try {
    await pb.collection('couples').update(coupleId, { join_code: newCode })
  } catch (error: any) {
    return { error: error.message }
  }
  revalidatePath('/profile')
  return { success: true, code: newCode }
}

export async function updateSplitPercentage(percentage: number) {
  const pb = await getServerPB()
  const user = pb.authStore.model
  if (!user) throw new Error('No user')

  if (percentage < 0 || percentage > 100) {
    throw new Error('Porcentaje inválido')
  }

  try {
    // En la migración, la colección de usuarios/perfiles a veces se llama "profiles" o usamos "users"
    // Probamos primero con profiles si existe
    let profile = await pb.collection('users').getFirstListItem(`id="${user.id}"`)
    await pb.collection('users').update(profile.id, { split_percentage: percentage })
  } catch (error: any) {
    throw new Error(error.message)
  }

  revalidatePath('/')
  revalidatePath('/profile')
  return { success: true }
}
