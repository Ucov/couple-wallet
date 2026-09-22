'use client'

import { useState, useEffect, useMemo, useTransition } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Sun, Moon, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react'
import { upsertMenuMeal } from './actions'
import { addShoppingItem } from '@/app/shopping/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type MenuData = {
  date: string
  lunch: string | null
  dinner: string | null
}

export default function WeeklyMenuClient({ initialData, coupleId, currentWeekStart }: { initialData: MenuData[], coupleId: string, currentWeekStart: Date }) {
  const [data, setData] = useState(initialData)
  const [weekStart, setWeekStart] = useState(currentWeekStart)
  const [isPending, startTransition] = useTransition()
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  useEffect(() => {
    setData(initialData)
  }, [initialData])

  useEffect(() => {
    const channel = supabase.channel(`sync_menu_${coupleId}`)
      .on('broadcast', { event: 'update_menu' }, () => {
        router.refresh()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [coupleId, supabase, router])

  const broadcastSync = () => {
    supabase.channel(`sync_menu_${coupleId}`).send({
      type: 'broadcast',
      event: 'update_menu',
      payload: {}
    })
  }

  const handleUpdate = (dateStr: string, type: 'lunch' | 'dinner', value: string) => {
    // Optimistic update
    setData(prev => {
      const existing = prev.find(d => d.date === dateStr)
      if (existing) {
        return prev.map(d => d.date === dateStr ? { ...d, [type]: value } : d)
      } else {
        return [...prev, { date: dateStr, lunch: null, dinner: null, [type]: value }]
      }
    })

    startTransition(async () => {
      const res = await upsertMenuMeal(dateStr, type, value)
      if (res.error) toast.error(res.error)
      else broadcastSync()
    })
  }

  const handleAddIngredient = async (meal: string) => {
    const ingredient = window.prompt(`¿Qué ingrediente te falta para "${meal || 'esta comida'}"?`)
    if (!ingredient || !ingredient.trim()) return

    const fd = new FormData()
    fd.append('name', ingredient.trim())
    
    startTransition(async () => {
      const res = await addShoppingItem(fd)
      if (res?.error) {
        toast.error('Error: ' + res.error)
      } else {
        toast.success(`"${ingredient}" añadido a la lista`)
        // Trigger shopping list sync too if we want, but it will sync on load.
      }
    })
  }

  const getDaysOfWeek = (start: Date) => {
    const days = []
    const base = new Date(start)
    for (let i = 0; i < 7; i++) {
      const d = new Date(base)
      d.setDate(base.getDate() + i)
      days.push(d)
    }
    return days
  }

  const days = getDaysOfWeek(weekStart)
  const todayStr = new Date().toISOString().split('T')[0]

  const goPrevWeek = () => {
    const newStart = new Date(weekStart)
    newStart.setDate(weekStart.getDate() - 7)
    // Update URL to trigger server fetch
    router.push(`/menu?start=${newStart.toISOString().split('T')[0]}`)
    setWeekStart(newStart)
  }

  const goNextWeek = () => {
    const newStart = new Date(weekStart)
    newStart.setDate(weekStart.getDate() + 7)
    router.push(`/menu?start=${newStart.toISOString().split('T')[0]}`)
    setWeekStart(newStart)
  }

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  return (
    <div className="pb-32">
      <div className="flex items-center justify-between mb-6 bg-zinc-900/50 p-2 rounded-2xl border border-zinc-800/50">
        <button onClick={goPrevWeek} className="p-2 text-zinc-400 hover:text-white transition-colors" disabled={isPending}>
          <ChevronLeft />
        </button>
        <div className="text-center">
          <span className="block text-sm font-medium text-zinc-300">
            {weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - {days[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
          </span>
        </div>
        <button onClick={goNextWeek} className="p-2 text-zinc-400 hover:text-white transition-colors" disabled={isPending}>
          <ChevronRight />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {days.map(d => {
          const dateStr = d.toISOString().split('T')[0]
          const isToday = dateStr === todayStr
          const dayData = data.find(x => x.date === dateStr) || { lunch: '', dinner: '' }

          return (
            <div 
              key={dateStr} 
              className={`p-4 rounded-3xl border ${isToday ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-zinc-800/50 bg-zinc-900/20'}`}
            >
              <div className="flex items-baseline gap-2 mb-3">
                <h3 className={`text-lg font-bold ${isToday ? 'text-emerald-400' : 'text-zinc-200'}`}>
                  {dayNames[d.getDay()]}
                </h3>
                <span className="text-xs text-zinc-500 font-medium">
                  {d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </span>
                {isToday && <span className="ml-auto text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium tracking-wide uppercase">Hoy</span>}
              </div>

              <div className="flex flex-col gap-3">
                {/* LUNCH */}
                <div className="group relative flex items-center bg-zinc-950/30 rounded-2xl border border-zinc-800/30 focus-within:border-amber-500/30 transition-colors overflow-hidden">
                  <div className="pl-4 pr-3 py-3 text-amber-500/70">
                    <Sun size={18} />
                  </div>
                  <input 
                    type="text"
                    placeholder="Comida..."
                    className="flex-1 bg-transparent border-none text-sm text-zinc-300 focus:ring-0 px-0 py-3 placeholder:text-zinc-700"
                    value={dayData.lunch || ''}
                    onChange={(e) => handleUpdate(dateStr, 'lunch', e.target.value)}
                  />
                  {(dayData.lunch || '').trim().length > 0 && (
                    <button 
                      onClick={() => handleAddIngredient(dayData.lunch || '')}
                      className="px-4 py-3 text-zinc-500 hover:text-emerald-400 transition-colors"
                      title="Añadir a lista de la compra"
                    >
                      <ShoppingCart size={16} />
                    </button>
                  )}
                </div>

                {/* DINNER */}
                <div className="group relative flex items-center bg-zinc-950/30 rounded-2xl border border-zinc-800/30 focus-within:border-indigo-500/30 transition-colors overflow-hidden">
                  <div className="pl-4 pr-3 py-3 text-indigo-400/70">
                    <Moon size={18} />
                  </div>
                  <input 
                    type="text"
                    placeholder="Cena..."
                    className="flex-1 bg-transparent border-none text-sm text-zinc-300 focus:ring-0 px-0 py-3 placeholder:text-zinc-700"
                    value={dayData.dinner || ''}
                    onChange={(e) => handleUpdate(dateStr, 'dinner', e.target.value)}
                  />
                  {(dayData.dinner || '').trim().length > 0 && (
                    <button 
                      onClick={() => handleAddIngredient(dayData.dinner || '')}
                      className="px-4 py-3 text-zinc-500 hover:text-emerald-400 transition-colors"
                      title="Añadir a lista de la compra"
                    >
                      <ShoppingCart size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
