'use server'

import { getServerPB } from '@/lib/pocketbase-server'
import { z } from 'zod'

export async function exportBackupData() {
  const pb = await getServerPB()
  const user = pb.authStore.model
  if (!user) throw new Error('Not authenticated')

  let profile
  try {
    profile = await pb.collection('users').getFirstListItem(`id="${user.id}"`)
  } catch(e) {}
  
  if (!profile?.couple_id) throw new Error('No estás en ninguna pareja')

  let expenses: any[] = [], chores: any[] = [], shoppingItems: any[] = []
  try {
    expenses = await pb.collection('expenses').getFullList({ filter: `couple_id="${profile.couple_id}"` })
    chores = await pb.collection('chores').getFullList({ filter: `couple_id="${profile.couple_id}"` })
    shoppingItems = await pb.collection('shopping_items').getFullList({ filter: `couple_id="${profile.couple_id}"` })
  } catch(e) {
    console.error(e)
  }

  return {
    success: true,
    data: {
      expenses: expenses || [],
      chores: chores || [],
      shopping_items: shoppingItems || []
    }
  }
}

// Un esquema básico para validar que el archivo importado tiene sentido
const backupSchema = z.object({
  expenses: z.array(z.any()).optional(),
  chores: z.array(z.any()).optional(),
  shopping_items: z.array(z.any()).optional(),
})

export async function importBackupData(jsonData: string) {
  const pb = await getServerPB()
  const user = pb.authStore.model
  if (!user) throw new Error('Not authenticated')

  let profile
  try {
    profile = await pb.collection('users').getFirstListItem(`id="${user.id}"`)
  } catch(e) {}
  
  if (!profile?.couple_id) throw new Error('No estás en ninguna pareja')

  let parsed: any;
  try {
    parsed = JSON.parse(jsonData)
  } catch (e) {
    return { success: false, error: 'El archivo no es un JSON válido' }
  }

  const validation = backupSchema.safeParse(parsed)
  if (!validation.success) {
    return { success: false, error: 'El formato del archivo de backup es incorrecto' }
  }

  const { expenses, chores, shopping_items } = validation.data

  // Hacemos upserts básicos asegurando que el couple_id sea el correcto
  try {
    if (expenses && expenses.length > 0) {
      for (const item of expenses) {
        item.couple_id = profile.couple_id
        // Remove id if it exists so Pocketbase generates a new one, or try to update if id exists
        try {
           if(item.id) { await pb.collection('expenses').update(item.id, item) }
           else { await pb.collection('expenses').create(item) }
        } catch(e) {
           try { await pb.collection('expenses').create(item) } catch(e2) {}
        }
      }
    }
    
    if (chores && chores.length > 0) {
      for (const item of chores) {
        item.couple_id = profile.couple_id
        try {
           if(item.id) { await pb.collection('chores').update(item.id, item) }
           else { await pb.collection('chores').create(item) }
        } catch(e) {
           try { await pb.collection('chores').create(item) } catch(e2) {}
        }
      }
    }

    if (shopping_items && shopping_items.length > 0) {
      for (const item of shopping_items) {
        item.couple_id = profile.couple_id
        try {
           if(item.id) { await pb.collection('shopping_items').update(item.id, item) }
           else { await pb.collection('shopping_items').create(item) }
        } catch(e) {
           try { await pb.collection('shopping_items').create(item) } catch(e2) {}
        }
      }
    }

    return { success: true }
  } catch (e: any) {
    console.error('Error importing:', e)
    return { success: false, error: e.message || 'Error al importar datos' }
  }
}
