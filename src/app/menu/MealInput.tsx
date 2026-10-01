import { useState, useTransition, useEffect } from 'react'
import { Sun, Moon, ShoppingCart } from 'lucide-react'
import { upsertMenuMeal } from './actions'
import { toast } from 'sonner'

export function MealInput({ 
  dateStr, 
  type, 
  initialValue, 
  onOpenIngredients, 
  broadcastSync 
}: { 
  dateStr: string, 
  type: 'lunch' | 'dinner', 
  initialValue: string, 
  onOpenIngredients: (val: string) => void,
  broadcastSync: () => void
}) {
  const [value, setValue] = useState(initialValue)
  const [isPending, startTransition] = useTransition()

  // Only update local state if the user is NOT typing (not focused)
  // Actually, standard controlled inputs in server components just sync with initialValue
  // BUT we must prevent initialValue from overwriting what the user is typing!
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (!isFocused) {
      setValue(initialValue)
    }
  }, [initialValue, isFocused])

  const handleBlur = () => {
    setIsFocused(false)
    if (value === initialValue) return // no changes

    startTransition(async () => {
      const res = await upsertMenuMeal(dateStr, type, value)
      if (res.error) toast.error(res.error)
      else broadcastSync()
    })
  }

  const isLunch = type === 'lunch'

  return (
    <div className={`group relative flex items-center bg-zinc-950/30 rounded-2xl border border-zinc-800/30 transition-colors overflow-hidden ${isLunch ? 'focus-within:border-amber-500/30' : 'focus-within:border-indigo-500/30'}`}>
      <div className={`pl-4 pr-3 py-3 ${isLunch ? 'text-amber-500/70' : 'text-indigo-400/70'}`}>
        {isLunch ? <Sun size={18} /> : <Moon size={18} />}
      </div>
      <input 
        type="text"
        placeholder={isLunch ? "Comida..." : "Cena..."}
        className="flex-1 bg-transparent border-none text-sm text-zinc-300 focus:ring-0 px-0 py-3 placeholder:text-zinc-700"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
      />
      {value.trim().length > 0 && (
        <button 
          onClick={() => onOpenIngredients(value)}
          className="px-4 py-3 text-zinc-500 hover:text-emerald-400 transition-colors"
          title="Añadir a lista de la compra"
        >
          <ShoppingCart size={16} />
        </button>
      )}
    </div>
  )
}
