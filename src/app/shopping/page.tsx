import { getServerPB } from '@/lib/pocketbase-server'
import { redirect } from 'next/navigation'
import { Plus } from 'lucide-react'
import ShoppingListClient from './ShoppingListClient'
import AddShoppingFormClient from '@/components/AddShoppingFormClient'

export const dynamic = 'force-dynamic'

export default async function ShoppingPage() {
  const pb = await getServerPB()
  const user = pb.authStore.model
  if (!user) redirect('/login')

  let profile
  try {
    profile = await pb.collection('users').getFirstListItem(`id="${user.id}"`)
  } catch(e) {}

  if (!profile?.couple_id) redirect('/setup-couple')

  let items: any[] = []
  try {
    items = await pb.collection('shopping_items').getFullList({
      filter: `couple_id="${profile.couple_id}"`,
      sort: '-status,-created'
    })
  } catch(e) {}

  const uniqueNames = Array.from(new Set(items?.map((i: any) => i.name) || []))

  return (
    <main className="w-full max-w-md mx-auto p-4 flex flex-col min-h-screen pb-32">
      <header className="flex justify-between items-center py-6 mb-2">
        <h1 className="text-2xl font-bold">Lista de Compra</h1>
      </header>

      {/* Formulario rápido para añadir con Autocompletado */}
      <AddShoppingFormClient uniqueNames={uniqueNames as any} coupleId={profile.couple_id} />

      {/* Listas renderizadas en cliente con Real-time */}
      <ShoppingListClient initialItems={items || []} coupleId={profile.couple_id} />
    </main>
  )
}
