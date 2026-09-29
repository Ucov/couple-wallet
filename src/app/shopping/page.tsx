import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Plus } from 'lucide-react'
import ShoppingListClient from './ShoppingListClient'
import AddShoppingFormClient from '@/components/AddShoppingFormClient'

export const dynamic = 'force-dynamic'

export default async function ShoppingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('couple_id')
    .eq('id', user.id)
    .single()

  if (!profile?.couple_id) redirect('/setup-couple')

  const { data: items } = await supabase
    .from('shopping_items')
    .select('*')
    .eq('couple_id', profile.couple_id)
    .order('status', { ascending: false })
    

  // Sacamos los nombres únicos para el autocompletado
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
