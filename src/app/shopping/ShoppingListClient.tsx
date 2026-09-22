'use client'

import { useEffect, useState, useMemo, useCallback, useTransition } from 'react'
import { createClient } from '@/utils/supabase/client'
import ShoppingItem from '@/components/ShoppingItem'
import { PartyPopper } from 'lucide-react'
import FinishShoppingButton from '@/components/FinishShoppingModal'
import { toggleShoppingItem, deleteShoppingItem } from '@/app/shopping/actions'

import { useRouter } from 'next/navigation'

export default function ShoppingListClient({ initialItems, coupleId }: { initialItems: any[], coupleId: string }) {
  const [items, setItems] = useState(initialItems)
  const [isPending, startTransition] = useTransition()
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  // Sincronizar con props del servidor
  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  // Realtime robusto mediante Broadcast + Refresh
  useEffect(() => {
    const channel = supabase.channel(`sync_shop_${coupleId}`)
      .on('broadcast', { event: 'update_shopping' }, () => {
        router.refresh()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [coupleId, supabase, router])

  const broadcastSync = () => {
    supabase.channel(`sync_shop_${coupleId}`).send({
      type: 'broadcast',
      event: 'update_shopping',
      payload: {}
    })
  }

  const handleToggle = (id: string, currentStatus: 'pending' | 'bought') => {
    const nextStatus = currentStatus === 'pending' ? 'bought' : 'pending'
    setItems(prev => prev.map(item => item.id === id ? { ...item, status: nextStatus } : item))
    startTransition(async () => {
      const res = await toggleShoppingItem(id, currentStatus)
      if (res?.error) alert('Error: ' + res.error)
      else broadcastSync()
    })
  }

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
    startTransition(async () => {
      const res = await deleteShoppingItem(id)
      if (res?.error) alert('Error: ' + res.error)
      else broadcastSync()
    })
  }

  const pendingItems = items.filter(item => item.status === 'pending')
  const boughtItems = items.filter(item => item.status === 'bought').sort((a, b) => 
    a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
  )

  return (
    <>
      <FinishShoppingButton boughtItemsCount={boughtItems.length} coupleId={coupleId} />

      {/* Lista Pendiente */}
      <section className="mb-8 relative z-10">
        <h2 className="text-sm text-zinc-400 font-semibold uppercase tracking-wider mb-4 flex items-center justify-between">
          <span>Por comprar</span>
          <span className="bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full text-xs">
            {pendingItems.length}
          </span>
        </h2>
        
        {pendingItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-zinc-900/20 border-2 border-dashed border-zinc-800/50 rounded-3xl animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-emerald-950/30 text-emerald-500 rounded-full flex items-center justify-center mb-4">
              <PartyPopper size={32} />
            </div>
            <p className="text-lg font-medium text-zinc-300">¡Nevera llena!</p>
            <p className="text-sm text-zinc-500 mt-1">No hay nada que comprar por ahora.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {pendingItems.map(item => (
              <ShoppingItem 
                key={item.id} 
                id={item.id} 
                name={item.name} 
                status={item.status as 'pending'} 
                onUpdate={broadcastSync}
                onToggle={(id, status) => handleToggle(id, status)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>

      {/* Historial / Comprados */}
      {boughtItems.length > 0 && (
        <section className="relative z-10 pb-32">
          <h2 className="text-sm text-zinc-600 font-semibold uppercase tracking-wider mb-4">
            Comprados recientemente
          </h2>
          <div className="flex flex-wrap gap-2">
            {boughtItems.map(item => (
              <ShoppingItem 
                key={item.id} 
                id={item.id} 
                name={item.name} 
                status={item.status as 'bought'} 
                onUpdate={broadcastSync}
                onToggle={(id, status) => handleToggle(id, status)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
