'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calculator, Check, AlertCircle, Save } from 'lucide-react'
import { toast } from 'sonner'
import { updateSplitPercentage } from './actions'

interface Props {
  initialPercentage: number
}

export default function SplitPercentageManager({ initialPercentage }: Props) {
  const [percentage, setPercentage] = useState(initialPercentage)
  const [isPending, startTransition] = useTransition()
  const [showCalculator, setShowCalculator] = useState(false)
  const [mySalary, setMySalary] = useState('')
  const [partnerSalary, setPartnerSalary] = useState('')

  const handleSave = (newPercentage: number) => {
    startTransition(async () => {
      try {
        await updateSplitPercentage(newPercentage)
        toast.success('Reparto de gastos actualizado')
      } catch (error: any) {
        toast.error(error.message || 'Error al actualizar el reparto')
        setPercentage(initialPercentage) // revert on error
      }
    })
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPercentage(Number(e.target.value))
  }

  const handleSliderCommit = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleSave(Number(e.target.value))
  }

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault()
    const mine = parseFloat(mySalary)
    const theirs = parseFloat(partnerSalary)
    
    if (isNaN(mine) || isNaN(theirs) || mine <= 0 || theirs <= 0) {
      toast.error('Por favor, introduce salarios válidos')
      return
    }

    const total = mine + theirs
    // Si mi salario es el doble que el suyo, yo asumo el doble de gastos
    const newMyPercentage = Math.round((mine / total) * 100)
    
    setPercentage(newMyPercentage)
    setShowCalculator(false)
    setMySalary('')
    setPartnerSalary('')
    handleSave(newMyPercentage)
  }

  return (
    <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-medium">Equidad de Gastos</h3>
          <p className="text-zinc-500 text-xs">Por defecto es 50% / 50%</p>
        </div>
        <button
          onClick={() => setShowCalculator(!showCalculator)}
          className="bg-emerald-500/10 text-emerald-400 p-2 rounded-lg hover:bg-emerald-500/20 transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <Calculator className="w-4 h-4" />
          <span className="hidden sm:inline">Calculadora</span>
        </button>
      </div>

      <AnimatePresence>
        {showCalculator && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <form onSubmit={handleCalculate} className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 flex flex-col gap-3">
              <p className="text-xs text-zinc-400 mb-1">
                <AlertCircle className="w-3 h-3 inline mr-1 -mt-0.5" />
                No guardaremos tus sueldos, solo calcularemos la proporción exacta.
              </p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-zinc-500 mb-1 block">Tu sueldo neto</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      value={mySalary}
                      onChange={(e) => setMySalary(e.target.value)}
                      placeholder="Ej. 1500"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors pl-7"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">€</span>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-zinc-500 mb-1 block">Sueldo de tu pareja</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      value={partnerSalary}
                      onChange={(e) => setPartnerSalary(e.target.value)}
                      placeholder="Ej. 1200"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors pl-7"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">€</span>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="mt-1 w-full bg-emerald-500 text-zinc-950 font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-emerald-400 transition-colors"
              >
                <Check className="w-4 h-4" />
                Calcular y Aplicar
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4">
        <div className="flex justify-between text-sm mb-3">
          <div className="flex flex-col">
            <span className="text-emerald-400 font-bold text-lg">{percentage}%</span>
            <span className="text-zinc-500 text-xs">Tú aportas</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-blue-400 font-bold text-lg">{100 - percentage}%</span>
            <span className="text-zinc-500 text-xs">Tu pareja aporta</span>
          </div>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={percentage}
          onChange={handleSliderChange}
          onMouseUp={handleSliderCommit}
          onTouchEnd={handleSliderCommit}
          disabled={isPending}
          className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer disabled:opacity-50
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 
            [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-grab
            [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:active:scale-110 [&::-webkit-slider-thumb]:transition-transform"
          style={{
            background: `linear-gradient(to right, #34d399 ${percentage}%, #27272a ${percentage}%)`
          }}
        />
        {isPending && <p className="text-center text-xs text-emerald-500 mt-2 animate-pulse">Guardando ajuste...</p>}
      </div>
    </div>
  )
}
