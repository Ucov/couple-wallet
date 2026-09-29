'use server'

import { getServerPB } from '@/lib/pocketbase-server'
import { revalidatePath } from 'next/cache'
import { sendPushToPartner } from '@/utils/webPush'

export async function addShoppingItem(formData: FormData) {
  try {
    const pb = await getServerPB()
    const user = pb.authStore.model
    if (!user) return { error: 'Not authenticated' }

    let profile
    try {
      profile = await pb.collection('users').getFirstListItem(`id="${user.id}"`)
    } catch(e) {}

    if (!profile?.couple_id) return { error: 'No couple found' }

    const name = formData.get('name') as string
    if (!name || !name.trim()) return { error: 'Name is empty' }

    let existing
    try {
      const list = await pb.collection('shopping_items').getFullList({ filter: `couple_id="${profile.couple_id}"` })
      existing = list.find((i: any) => i.name.toLowerCase() === name.trim().toLowerCase())
    } catch(e) {}

    if (existing) {
      if (existing.status === 'bought') {
        try {
          await pb.collection('shopping_items').update(existing.id, { status: 'pending' })
        } catch(updateError: any) {
          return { error: updateError.message }
        }
      }
    } else {
      try {
        await pb.collection('shopping_items').create({
          name: name.trim(),
          couple_id: profile.couple_id,
          created_by: user.id,
          status: 'pending'
        })
      } catch (insertError: any) {
        return { error: insertError.message }
      }
    }

    revalidatePath('/shopping')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || String(err) }
  }
}

export async function toggleShoppingItem(id: string, currentStatus: string) {
  try {
    const pb = await getServerPB()
    const user = pb.authStore.model
    if (!user) return { error: 'Not authenticated' }

    const newStatus = currentStatus === 'pending' ? 'bought' : 'pending'
    
    try {
      await pb.collection('shopping_items').update(id, { status: newStatus })
    } catch (error: any) {
      return { error: error.message }
    }

    revalidatePath('/shopping')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || String(err) }
  }
}

export async function deleteShoppingItem(id: string) {
  try {
    const pb = await getServerPB()
    const user = pb.authStore.model
    if (!user) return { error: 'Not authenticated' }

    try {
      await pb.collection('shopping_items').delete(id)
    } catch (error: any) {
      return { error: error.message }
    }

    revalidatePath('/shopping')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || String(err) }
  }
}

export async function finishShopping(formData: FormData) {
  try {
    const pb = await getServerPB()
    const user = pb.authStore.model
    if (!user) return { error: 'Not authenticated' }

    let profile
    try {
      profile = await pb.collection('users').getFirstListItem(`id="${user.id}"`)
    } catch(e) {}

    if (!profile?.couple_id) return { error: 'No couple found' }

    const amount = parseFloat(formData.get('amount') as string)
    if (isNaN(amount) || amount <= 0) return { error: 'Importe inválido' }
    
    const conceptForm = formData.get('concept') as string || 'Compra supermercado'

    let boughtItems: any[] = []
    try {
      boughtItems = await pb.collection('shopping_items').getFullList({
        filter: `couple_id="${profile.couple_id}" && status="bought"`
      })
    } catch(e) {}

    if (!boughtItems || boughtItems.length === 0) {
      return { error: 'No hay artículos comprados' }
    }

    let categoryId = null;
    try {
      const category = await pb.collection('categories').getFirstListItem(`name~"Comida"`)
      if (category) categoryId = category.id
    } catch(e) {}

    const itemsText = boughtItems.map(item => item.name).join(', ')
    const concept = `${conceptForm}: ${itemsText.length > 30 ? itemsText.substring(0, 27) + '...' : itemsText}`

    try {
      await pb.collection('expenses').create({
        amount,
        concept,
        category_id: categoryId,
        paid_by: user.id,
        couple_id: profile.couple_id,
        date: new Date().toISOString()
      })
    } catch (expenseError: any) {
      return { error: expenseError.message }
    }

    sendPushToPartner(profile.couple_id, user.id, '🛒 Nueva compra registrada', `${user.name || 'Tu pareja'} ha pagado ${amount}€ en el supermercado`, '/')

    try {
      for (const item of boughtItems) {
        await pb.collection('shopping_items').delete(item.id)
      }
    } catch(e) {}

    revalidatePath('/shopping')
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || String(err) }
  }
}
