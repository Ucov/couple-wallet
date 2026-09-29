'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerPB } from '@/lib/pocketbase-server'
import { cookies } from 'next/headers'

export async function login(formData: FormData) {
  const pb = await getServerPB()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  try {
    await pb.collection('users').authWithPassword(email, password)
    
    // Save to cookies
    const isProd = process.env.NODE_ENV === 'production'
    const cookieStore = await cookies()
    const cookieStr = pb.authStore.exportToCookie({ secure: isProd, httpOnly: true })
    const cookieVal = decodeURIComponent(cookieStr.split(';')[0].replace('pb_auth=', ''))
    cookieStore.set('pb_auth', cookieVal, {
      httpOnly: true,
      secure: isProd,
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    })
    
  } catch (error) {
    console.error('LOGIN ERROR:', error); redirect('/login?message=' + encodeURIComponent((error as any).message))
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const pb = await getServerPB()

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
    const cookieStr = pb.authStore.exportToCookie({ secure: isProd, httpOnly: true })
    const cookieVal = decodeURIComponent(cookieStr.split(';')[0].replace('pb_auth=', ''))
    cookieStore.set('pb_auth', cookieVal, {
      httpOnly: true,
      secure: isProd,
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    })

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
