'use client'

import { useState, useTransition, useEffect, useMemo } from 'react'
import { PlusCircle, Trash2, X, Star, Trophy } from 'lucide-react'
import { addChore, toggleChoreStatus, deleteChore } from './actions'
import { createClient } from '@/utils/supabase/client'
import { getChoreIcon } from '@/utils/choreIcons'
import confetti from 'canvas-confetti'

interface Chore {
  id: string
  title: string
  is_done: boolean
  assigned_to: string | null
  points: number
  completed_by: string | null
  completed_at: string | null
}

interface Props {
  initialChores: Chore[]
  coupleId: string
  currentUserId: string
  currentUserName: string
  partnerId: string | null
  partnerName: string
}

import { useRouter } from 'next/navigation'

export default function ChoresClient({ initialChores, coupleId, currentUserId, currentUserName, partnerId, partnerName }: Props) {
  const [chores, setChores] = useState<Chore[]>(initialChores)
  const [newTitle, setNewTitle] = useState('')
  const [selectedPoints, setSelectedPoints] = useState<number>(10)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    setChores(initialChores)
  }, [initialChores])

  useEffect(() => {
    const channel = supabase.channel(`sync_${coupleId}`)
      .on('broadcast', { event: 'update_chores' }, () => {
        router.refresh()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [coupleId, supabase, router])

  const broadcastSync = () => {
    supabase.channel(`sync_${coupleId}`).send({
      type: 'broadcast',
      event: 'update_chores',
      payload: {}
    })
  }

  // Cálculos del Score (Solo del mes actual)
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  let myScore = 0
  let partnerScore = 0

  chores.forEach(chore => {
    if (chore.is_done && chore.completed_at) {
      const choreDate = new Date(chore.completed_at)
      if (choreDate.getMonth() === currentMonth && choreDate.getFullYear() === currentYear) {
        if (chore.completed_by === currentUserId) {
          myScore += chore.points || 0
        } else if (chore.completed_by === partnerId) {
          partnerScore += chore.points || 0
        }
      }
    }
  })

  const pendingChores = chores.filter(c => !c.is_done)
  const doneChores = chores.filter(c => c.is_done)

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    const tempTitle = newTitle
    const tempPoints = selectedPoints
    
    // Optimistic: add immediately
    const tempId = crypto.randomUUID()
    setChores(prev => [{ id: tempId, title: tempTitle, is_done: false, assigned_to: null, points: tempPoints, completed_by: null, completed_at: null }, ...prev])
    setNewTitle('')
    setSelectedPoints(10)
    
    startTransition(async () => { 
      await addChore(tempTitle, tempPoints) 
      broadcastSync()
    })
  }

  const handleToggle = (id: string, currentStatus: boolean, chorePoints: number = 0) => {
    setChores(prev => prev.map(c => c.id === id ? { 
      ...c, 
      is_done: !currentStatus,
      completed_by: !currentStatus ? currentUserId : null,
      completed_at: !currentStatus ? new Date().toISOString() : null
    } : c))
    
    // Animación chula si se completa
    if (!currentStatus) {
      confetti({
        particleCount: chorePoints,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#10b981', '#f59e0b', '#fbbf24']
      })
    }

    startTransition(async () => { 
      const res = await toggleChoreStatus(id, !currentStatus)
      if (res?.error) alert('Error: ' + res.error)
      else broadcastSync()
    })
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setChores(prev => prev.filter(c => c.id !== id))
    startTransition(async () => { 
      const res = await deleteChore(id)
      if (res?.error) alert('Error: ' + res.error)
      else broadcastSync()
    })
  }

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6">
      
      {/* Scoreboard */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-4 flex items-center justify-between shadow-xl backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-indigo-500 opacity-50" />
        <div className="flex flex-col items-center flex-1">
          <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-1">{currentUserName}</span>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-black text-emerald-400">{myScore}</span>
            <span className="text-xs font-semibold text-emerald-500/50 mb-1.5">pts</span>
          </div>
        </div>
        <div className="w-12 h-12 bg-zinc-950 rounded-full flex items-center justify-center shadow-inner border border-zinc-800/80 z-10">
          <Trophy className="text-amber-400" size={24} />
        </div>
        <div className="flex flex-col items-center flex-1">
          <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-1">{partnerName}</span>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-black text-indigo-400">{partnerScore}</span>
            <span className="text-xs font-semibold text-indigo-500/50 mb-1.5">pts</span>
          </div>
        </div>
      </div>

      {/* Añadir Tarea con Gamificación */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-4 shadow-lg">
        <form onSubmit={handleAdd} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Ej: Limpiar los cristales..."
              className="flex-1 bg-zinc-950 border border-zinc-800/80 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-zinc-600"
            />
            <button type="submit" disabled={!newTitle.trim()} className="bg-emerald-500 text-zinc-950 p-3 rounded-2xl disabled:opacity-50 active:scale-95 transition-transform flex items-center justify-center font-bold">
              <PlusCircle size={24} />
            </button>
          </div>
          
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Dificultad (Puntos)</span>
            <div className="flex gap-1 bg-zinc-950 rounded-full p-1 border border-zinc-800/50">
              <button
                type="button"
                onClick={() => setSelectedPoints(10)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${selectedPoints === 10 ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <span>10</span>
                <Star size={10} className={selectedPoints === 10 ? 'fill-emerald-400' : ''} />
              </button>
              <button
                type="button"
                onClick={() => setSelectedPoints(30)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${selectedPoints === 30 ? 'bg-amber-500/20 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <span>30</span>
                <Star size={10} className={selectedPoints === 30 ? 'fill-amber-400' : ''} />
              </button>
              <button
                type="button"
                onClick={() => setSelectedPoints(50)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${selectedPoints === 50 ? 'bg-rose-500/20 text-rose-400' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <span>50</span>
                <Star size={10} className={selectedPoints === 50 ? 'fill-rose-400' : ''} />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Tareas Pendientes */}
      <section>
        <h2 className="text-sm text-zinc-400 font-semibold uppercase tracking-wider mb-4 flex items-center justify-between">
          <span>Para Hacer</span>
          <span className="bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full text-xs">{pendingChores.length}</span>
        </h2>

        {pendingChores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-zinc-900/20 border-2 border-dashed border-zinc-800/50 rounded-3xl">
            <div className="w-14 h-14 bg-emerald-950/30 text-emerald-500 rounded-full flex items-center justify-center mb-3">
              <Trophy size={28} />
            </div>
            <p className="text-zinc-400 font-medium">¡Todo limpio!</p>
            <p className="text-sm text-zinc-600 mt-1">Disfruta de tus puntos.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {pendingChores.map(chore => {
              const Icon = getChoreIcon(chore.title)
              return (
                <div
                  key={chore.id}
                  onClick={() => handleToggle(chore.id, chore.is_done, chore.points)}
                  className="relative group flex flex-col items-center justify-center p-4 min-w-[100px] max-w-[110px] rounded-2xl transition-all duration-200 shadow-sm cursor-pointer active:scale-95 select-none bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 shadow-emerald-900/20"
                >
                  <div className="absolute top-1.5 left-1.5 bg-emerald-950/50 text-emerald-200 text-[10px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 backdrop-blur-sm">
                    {chore.points || 10} <Star size={8} className="fill-emerald-200" />
                  </div>
                  <div className="mb-2 mt-3 drop-shadow-md">
                    <Icon size={26} className="text-white" />
                  </div>
                  <span className="text-[12px] font-semibold text-center leading-tight text-white line-clamp-2">
                    {chore.title}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Tareas Completadas */}
      {doneChores.length > 0 && (
        <section>
          <h2 className="text-sm text-zinc-600 font-semibold uppercase tracking-wider mb-4">Completadas este mes</h2>
          <div className="flex flex-wrap gap-2">
            {doneChores.map(chore => {
              const Icon = getChoreIcon(chore.title)
              const isMine = chore.completed_by === currentUserId
              return (
                <div
                  key={chore.id}
                  onClick={() => handleToggle(chore.id, chore.is_done, chore.points)}
                  className="relative group flex flex-col items-center justify-center p-4 min-w-[90px] max-w-[110px] rounded-2xl transition-all duration-200 shadow-sm cursor-pointer active:scale-95 select-none bg-zinc-900 border border-zinc-800/80 opacity-70"
                >
                  <div className={`absolute top-1.5 left-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${isMine ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                    +{chore.points || 10}
                  </div>
                  <div className="mb-2 mt-3 scale-90 opacity-50">
                    <Icon size={28} className="text-zinc-500" />
                  </div>
                  <span className="text-[12px] font-semibold text-center leading-tight text-zinc-500 line-clamp-2 line-through">
                    {chore.title}
                  </span>
                  {/* Botón borrar */}
                  <button
                    onClick={(e) => handleDelete(e, chore.id)}
                    className="absolute -top-2 -right-2 bg-zinc-800 text-zinc-400 hover:bg-red-950/80 hover:text-red-400 p-1.5 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all border border-zinc-700/50"
                  >
                    <X size={12} strokeWidth={3} />
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
