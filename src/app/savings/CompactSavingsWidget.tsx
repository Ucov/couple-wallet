'use client'

import { useState } from 'react'
import SavingsGoalModal from './SavingsGoalModal'

type Goal = {
  id: string
  name: string
  target_amount: number
  current_amount: number
  emoji: string
}

export default function CompactSavingsWidget({ goals }: { goals: Goal[] }) {
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null)
  
  if (!goals || goals.length === 0) return null

  // We only show the primary (first) goal to keep it very compact
  const goal = goals[0]
  
  const percentage = Math.min(100, Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100)) || 0

  return (
    <>
      <div 
        onClick={() => setActiveGoal(goal)}
        className="w-full bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-3 flex items-center gap-3 cursor-pointer hover:bg-zinc-900/60 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-zinc-800/50 flex items-center justify-center text-lg shadow-inner">
          {goal.emoji}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-end mb-1.5">
            <h4 className="text-sm font-semibold text-zinc-200 truncate pr-2">{goal.name}</h4>
            <span className="text-xs font-medium text-emerald-400 whitespace-nowrap">{percentage}%</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {activeGoal && (
        <SavingsGoalModal 
          goal={activeGoal} 
          isOpen={true} 
          onClose={() => setActiveGoal(null)} 
        />
      )}
    </>
  )
}
