'use client'

import { useState, useEffect, useMemo, useTransition } from 'react'
import { createClient } from '@/utils/supabase/client'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addShoppingItem } from '@/app/shopping/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import AddIngredientsModal from './AddIngredientsModal'
import { MealInput } from './MealInput'
import { format, addDays, parseISO, parse } from 'date-fns'
import { es } from 'date-fns/locale'

type MenuData = {
  date: string
  lunch: string | null
  dinner: string | null
}

export default function WeeklyMenuClient({ initialData, coupleId, currentWeekStart }: { initialData: MenuData[], coupleId: string, currentWeekStart: string }) {
  const [data, setData] = useState(initialData)
  const [weekStart, setWeekStart] = useState(currentWeekStart)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeMealForModal, setActiveMealForModal] = useState('')
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

  const handleOpenIngredientsModal = (meal: string) => {
    setActiveMealForModal(meal)
    setIsModalOpen(true)
  }

  const handleSaveIngredients = (ingredients: string[]) => {
    setIsModalOpen(false)
    startTransition(async () => {
      let successCount = 0
      for (const ing of ingredients) {
        const fd = new FormData()
        fd.append('name', ing)
        const res = await addShoppingItem(fd)
        if (!res?.error) successCount++
      }
      if (successCount > 0) {
        toast.success(`${successCount} ingrediente(s) añadido(s) a la compra`)
      }
    })
  }

  const getDaysOfWeek = (startStr: string) => {
    const days = []
    const base = parseISO(startStr)
    for (let i = 0; i < 7; i++) {
      days.push(format(addDays(base, i), 'yyyy-MM-dd'))
    }
    return days
  }

  const daysStr = getDaysOfWeek(weekStart)
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const goPrevWeek = () => {
    const prev = format(addDays(parseISO(weekStart), -7), 'yyyy-MM-dd')
    router.push(`/menu?start=${prev}`)
    setWeekStart(prev)
  }

  const goNextWeek = () => {
    const next = format(addDays(parseISO(weekStart), 7), 'yyyy-MM-dd')
    router.push(`/menu?start=${next}`)
    setWeekStart(next)
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
            {format(parseISO(daysStr[0]), "d MMM", { locale: es })} - {format(parseISO(daysStr[6]), "d MMM", { locale: es })}
          </span>
        </div>
        <button onClick={goNextWeek} className="p-2 text-zinc-400 hover:text-white transition-colors" disabled={isPending}>
          <ChevronRight />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {daysStr.map(dateStr => {
          const isToday = dateStr === todayStr
          const dayData = data.find(x => (x.date.split(' ')[0] === dateStr || x.date === dateStr)) || { lunch: '', dinner: '' }
          
          const d = parseISO(dateStr)

          return (
            <div 
              key={dateStr} 
              className={`p-4 rounded-3xl border ${isToday ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-zinc-800/50 bg-zinc-900/20'}`}
            >
              <div className="flex items-baseline gap-2 mb-3">
                <h3 className={`text-lg font-bold capitalize ${isToday ? 'text-emerald-400' : 'text-zinc-200'}`}>
                  {format(d, 'EEEE', { locale: es })}
                </h3>
                <span className="text-xs text-zinc-500 font-medium">
                  {format(d, 'd MMM', { locale: es })}
                </span>
                {isToday && <span className="ml-auto text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium tracking-wide uppercase">Hoy</span>}
              </div>

              <div className="flex flex-col gap-3">
                {/* LUNCH */}
                <MealInput 
                  dateStr={dateStr}
                  type="lunch"
                  initialValue={dayData.lunch || ''}
                  onOpenIngredients={handleOpenIngredientsModal}
                  broadcastSync={broadcastSync}
                />

                {/* DINNER */}
                <MealInput 
                  dateStr={dateStr}
                  type="dinner"
                  initialValue={dayData.dinner || ''}
                  onOpenIngredients={handleOpenIngredientsModal}
                  broadcastSync={broadcastSync}
                />
              </div>
            </div>
          )
        })}
      </div>

      <AddIngredientsModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveIngredients}
        mealName={activeMealForModal}
      />
    </div>
  )
}
