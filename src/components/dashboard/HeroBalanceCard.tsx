'use client'

import { motion, useSpring, useTransform } from 'framer-motion'
import { useEffect } from 'react'
import { CheckCircle } from 'lucide-react'

interface HeroBalanceCardProps {
  debtAmount: number
  isOwed: boolean
  settlementMessage: string
  settlementSubMessage: string
  showSettleButton: boolean
  myTotal: number
  partnerTotal: number
  partnerName: string
  prevDebtAmount: number
  prevIsOwed: boolean
  currMonthDebtAmount: number
  currMonthIsOwed: boolean
  settleAction?: (payload: FormData) => void
}

export default function HeroBalanceCard({
  debtAmount,
  isOwed,
  settlementMessage,
  settlementSubMessage,
  showSettleButton,
  myTotal,
  partnerTotal,
  partnerName,
  prevDebtAmount,
  prevIsOwed,
  currMonthDebtAmount,
  currMonthIsOwed,
  settleAction,
}: HeroBalanceCardProps) {
  // Animated number
  const springValue = useSpring(0, { bounce: 0, duration: 1500 })
  const displayValue = useTransform(springValue, (current) => `€${current.toFixed(2)}`)

  useEffect(() => {
    springValue.set(debtAmount)
  }, [debtAmount, springValue])

  const bgGradient = debtAmount > 0.01
    ? isOwed 
      ? 'from-emerald-950/40 to-zinc-900 border-emerald-900/50 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
      : 'from-red-950/40 to-zinc-900 border-red-900/50 shadow-[0_0_30px_rgba(239,68,68,0.15)]'
    : 'from-zinc-900 to-zinc-950 border-zinc-800'

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`relative overflow-hidden rounded-3xl p-6 border backdrop-blur-xl bg-gradient-to-br ${bgGradient}`}
    >
      <div className="relative z-10 flex flex-col justify-center items-center text-center">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">
          Balance Mensual
        </h2>
        
        <p className="text-zinc-300 font-medium mb-1">{settlementMessage}</p>
        
        {debtAmount > 0.01 ? (
          <div className="flex flex-col items-center justify-center mt-1 mb-5 w-full">
            <motion.span 
              className={`text-6xl font-black tracking-tighter ${isOwed ? 'text-emerald-400' : 'text-red-400'}`}
            >
              {displayValue}
            </motion.span>
            <span className="text-zinc-500 mt-1 font-medium">{settlementSubMessage}</span>
            
            {prevDebtAmount > 0.01 && (
              <div className="w-full mt-4 bg-zinc-900/60 rounded-xl p-3 border border-zinc-800/80 text-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-zinc-400">Deuda anterior arrastrada:</span>
                  <span className={`font-semibold ${prevIsOwed ? 'text-emerald-400' : 'text-red-400'}`}>
                    {prevIsOwed ? '+' : '-'}€{prevDebtAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                  <span className="text-zinc-400">Generada este mes:</span>
                  <span className={`font-semibold ${currMonthIsOwed ? 'text-emerald-400' : 'text-red-400'}`}>
                    {currMonthIsOwed ? '+' : '-'}€{currMonthDebtAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-zinc-300 font-medium">Total acumulado:</span>
                  <span className={`font-bold ${isOwed ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isOwed ? '+' : '-'}€{debtAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center mt-3 mb-5">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3 text-emerald-400 border border-emerald-500/20"
            >
              <CheckCircle size={32} />
            </motion.div>
          </div>
        )}
        
        {showSettleButton && settleAction && (
          <form action={settleAction} className="w-full">
            <button 
              type="submit" 
              className={`w-full py-3.5 rounded-xl font-bold shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 
                ${isOwed 
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-900/50' 
                  : 'bg-red-500 hover:bg-red-400 text-white shadow-red-900/50'}`}
            >
              <CheckCircle size={20} /> 
              Saldar Mes
            </button>
          </form>
        )}
        
        <div className="flex justify-between w-full mt-6 pt-5 border-t border-zinc-800/50 text-sm">
          <div className="flex flex-col items-start">
            <span className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Tú pagaste</span>
            <span className="text-xl font-semibold text-zinc-200">€{myTotal.toFixed(2)}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-zinc-500 text-xs uppercase tracking-wider mb-1">{partnerName} pagó</span>
            <span className="text-xl font-semibold text-zinc-200">€{partnerTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
