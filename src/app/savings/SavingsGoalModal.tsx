'use client'

import { useState, useTransition } from 'react'
import { X, Plus, PiggyBank, Target } from 'lucide-react'
import { addContribution } from './actions'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'

type Goal = {
  id: string
  name: string
  target_amount: number
  current_amount: number
  emoji: string
}

interface Props {
  goal: Goal
  isOpen: boolean
  onClose: () => void
}

export default function SavingsGoalModal({ goal, isOpen, onClose }: Props) {
  const [amountStr, setAmountStr] = useState('')
  const [isPending, startTransition] = useTransition()

  if (!isOpen) return null

  const percentage = Math.min(100, Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100)) || 0

  const handleAdd = () => {
    const amount = parseFloat(amountStr)
    if (isNaN(amount) || amount <= 0) return

    startTransition(async () => {
      const res = await addContribution(goal.id, amount)
      if (res.error) {
        toast.error('Error al añadir: ' + res.error)
      } else {
        toast.success('¡Aportación añadida con éxito!')
        setAmountStr('')
        
        // Comprobar si hemos llegado al 100% con esta aportación
        const newTotal = Number(goal.current_amount) + amount
        if (newTotal >= Number(goal.target_amount)) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10b981', '#34d399', '#fcd34d']
          })
        }
        onClose()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-end p-4 pb-0">
          <button onClick={onClose} className="p-2 bg-zinc-800/50 text-zinc-400 rounded-full hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-6 pt-2 flex flex-col items-center">
          <div className="text-5xl mb-4 bg-zinc-800/50 w-24 h-24 rounded-full flex items-center justify-center border-4 border-zinc-800/80 shadow-inner">
            {goal.emoji}
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-1">{goal.name}</h2>
          
          <div className="flex items-center gap-2 text-zinc-400 mb-8 font-medium">
            <Target size={16} />
            <span>Objetivo: {Number(goal.target_amount).toLocaleString('es-ES')}€</span>
          </div>

          {/* Progress Circular o Linear Grande */}
          <div className="w-full mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-xl font-bold text-emerald-400">{Number(goal.current_amount).toLocaleString('es-ES')}€</span>
              <span className="text-xl font-bold text-zinc-500">{percentage}%</span>
            </div>
            <div className="h-3 w-full bg-zinc-950 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <div className="w-full bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50">
            <label className="block text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-2 ml-1">
              Hacer aportación
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">€</span>
                <input
                  type="number"
                  value={amountStr}
                  onChange={e => setAmountStr(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-8 pr-4 text-white focus:border-emerald-500/50 focus:ring-0 transition-colors"
                />
              </div>
              <button 
                onClick={handleAdd}
                disabled={isPending || !amountStr}
                className="bg-emerald-500 text-zinc-950 px-4 rounded-xl font-bold disabled:opacity-50 hover:bg-emerald-400 transition-colors flex items-center gap-2"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
