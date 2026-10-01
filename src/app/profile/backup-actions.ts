'use server'

import { getServerPB } from '@/lib/pocketbase-server'

const COLLECTIONS = [
  'expenses',
  'chores',
  'shopping_items',
  'calendar_events',
  'recurring_expenses',
  'savings_goals',
  'savings_contributions',
  'weekly_menu',
  'settlements'
]

export async function exportBackupData() {
  const pb = await getServerPB()
  const user = pb.authStore.model
  if (!user) throw new Error('Not authenticated')

  let profile
  try {
    profile = await pb.collection('users').getFirstListItem(`id="${user.id}"`)
  } catch(e) {}
  
  if (!profile?.couple_id) throw new Error('No estas en ninguna pareja')

  const data: Record<string, any[]> = {}
  
  for (const collectionName of COLLECTIONS) {
    try {
      data[collectionName] = await pb.collection(collectionName).getFullList({ 
        filter: `couple_id="${profile.couple_id}"` 
      })
    } catch(e) {
      console.error(`Error exporting ${collectionName}:`, e)
      data[collectionName] = []
    }
  }

  return {
    success: true,
    data
  }
}

export async function importBackupData(jsonData: string) {
  const pb = await getServerPB()
  const user = pb.authStore.model
  if (!user) throw new Error('Not authenticated')

  let profile
  try {
    profile = await pb.collection('users').getFirstListItem(`id="${user.id}"`)
  } catch(e) {}
  
  if (!profile?.couple_id) throw new Error('No estas en ninguna pareja')

  let parsed: any;
  try {
    parsed = JSON.parse(jsonData)
  } catch (e) {
    return { success: false, error: 'El archivo no es un JSON válido' }
  }

  try {
    for (const collectionName of COLLECTIONS) {
      const items = parsed[collectionName]
      if (items && Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          item.couple_id = profile.couple_id
          
          try {
            if (item.id) { 
              await pb.collection(collectionName).update(item.id, item) 
            } else { 
              await pb.collection(collectionName).create(item) 
            }
          } catch(e) {
             try { await pb.collection(collectionName).create(item) } catch(e2) {}
          }
        }
      }
    }
    return { success: true }
  } catch (e: any) {
    console.error('Error importing:', e)
    return { success: false, error: e.message || 'Error al importar datos' }
  }
}
