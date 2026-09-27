'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerPB } from '@/lib/pocketbase'
import { cookies } from 'next/headers'

export async function login(formData: FormData) {
  const pb = getServerPB()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  try {
    await pb.collection('users').authWithPassword(email, password)
    
    // Save to cookies
    const isProd = process.env.NODE_ENV === 'production'
    const cookieStore = await cookies()
    cookieStore.set('pb_auth', pb.authStore.exportToCookie({ secure: isProd, httpOnly: true }))
    
  } catch (error) {
    redirect('/login?message=Could not authenticate user')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const pb = getServerPB()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  try {
    // PocketBase standard signup fields usually require passwordConfirm
    await pb.collection('users').create({
      email,
      password,
      passwordConfirm: password, 
    })
    
    // Auto login after signup
    await pb.collection('users').authWithPassword(email, password)
    
    // Save to cookies
    const isProd = process.env.NODE_ENV === 'production'
    const cookieStore = await cookies()
    cookieStore.set('pb_auth', pb.authStore.exportToCookie({ secure: isProd, httpOnly: true }))

  } catch (error: any) {
    redirect(`/login?message=${encodeURIComponent(error.message || 'Error signing up')}`)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('pb_auth')
  redirect('/login')
}
