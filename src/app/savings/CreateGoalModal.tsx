'use client'

import { useState, useTransition } from 'react'
import { X, Target, Save, Plane, Home, Car, Smartphone, Gift, Heart, Baby } from 'lucide-react'
import { createSavingsGoal } from './actions'
import { toast } from 'sonner'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const EMOJIS = ['✈️', '🏠', '🚗', '📱', '🎁', '💖', '👶', '🐶', '💍', '💰']

export default function CreateGoalModal({ isOpen, onClose }: Props) {
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJIS[0])
  const [isPending, startTransition] = useTransition()

  if (!isOpen) return null

  const handleSave = () => {
    const amount = parseFloat(targetAmount)
    if (!name.trim() || isNaN(amount) || amount <= 0) return

    startTransition(async () => {
      const res = await createSavingsGoal(name.trim(), amount, selectedEmoji)
      if (res.error) {
        toast.error('Error al crear hucha: ' + res.error)
      } else {
        toast.success('Hucha creada con éxito')
        setName('')
        setTargetAmount('')
        onClose()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
          <div className="flex items-center gap-2">
            <Target className="text-emerald-400" size={20} />
            <h3 className="font-bold text-white text-lg">Nueva Hucha</h3>
          </div>
          <button onClick={onClose} className="p-2 bg-zinc-800/50 text-zinc-400 rounded-full hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-2 ml-1">
              Icono
            </label>
            <div className="flex gap-2 flex-wrap">
              {EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => setSelectedEmoji(e)}
                  className={`w-10 h-10 text-xl rounded-xl flex items-center justify-center transition-all ${
                    selectedEmoji === e ? 'bg-emerald-500/20 border-2 border-emerald-500/50' : 'bg-zinc-800/50 border-2 border-transparent hover:bg-zinc-800'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-2 ml-1">
              Nombre de la hucha
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej. Viaje a Japón"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:border-emerald-500/50 focus:ring-0 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-2 ml-1">
              Objetivo económico
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">€</span>
              <input
                type="number"
                value={targetAmount}
                onChange={e => setTargetAmount(e.target.value)}
                placeholder="3000"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-8 pr-4 text-white focus:border-emerald-500/50 focus:ring-0 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="p-4 bg-zinc-950/50 border-t border-zinc-800/50">
          <button 
            onClick={handleSave}
            disabled={isPending || !name.trim() || !targetAmount}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-zinc-950 font-bold py-3.5 rounded-2xl shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            <Save size={18} strokeWidth={2.5} />
            Crear Hucha
          </button>
        </div>
      </div>
    </div>
  )
}
