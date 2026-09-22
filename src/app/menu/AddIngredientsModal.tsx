'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Plus, ShoppingCart } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (ingredients: string[]) => void
  mealName: string
}

export default function AddIngredientsModal({ isOpen, onClose, onSave, mealName }: Props) {
  const [inputValue, setInputValue] = useState('')
  const [ingredients, setIngredients] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setIngredients([])
      setInputValue('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleAdd = () => {
    const val = inputValue.trim()
    if (!val) return

    // Add comma separated items
    const newItems = val.split(',').map(s => s.trim()).filter(s => s.length > 0)
    
    // Filter duplicates locally
    const unique = newItems.filter(item => !ingredients.some(i => i.toLowerCase() === item.toLowerCase()))
    
    if (unique.length > 0) {
      setIngredients(prev => [...prev, ...unique])
    }
    setInputValue('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  const removeIngredient = (indexToRemove: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== indexToRemove))
  }

  const handleSave = () => {
    // If there is pending text in input, add it first
    const finalItems = [...ingredients]
    if (inputValue.trim()) {
       const newItems = inputValue.trim().split(',').map(s => s.trim()).filter(s => s.length > 0)
       const unique = newItems.filter(item => !finalItems.some(i => i.toLowerCase() === item.toLowerCase()))
       finalItems.push(...unique)
    }
    
    if (finalItems.length > 0) {
      onSave(finalItems)
    } else {
      onClose() // nothing to save
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
          <div>
            <h3 className="font-bold text-white text-lg">Añadir ingredientes</h3>
            <p className="text-xs text-emerald-400 font-medium mt-0.5 truncate max-w-[200px]">
              {mealName || 'Para esta comida'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 bg-zinc-800/50 text-zinc-400 rounded-full hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <div className="relative flex items-center bg-zinc-950 rounded-2xl border border-zinc-800 focus-within:border-emerald-500/50 transition-colors">
            <input 
              ref={inputRef}
              type="text"
              placeholder="Escribe y pulsa Intro..."
              className="flex-1 bg-transparent border-none text-zinc-200 text-sm py-4 pl-4 pr-12 focus:ring-0 placeholder:text-zinc-600"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button 
              onClick={handleAdd}
              disabled={!inputValue.trim()}
              className="absolute right-2 p-2 bg-emerald-500/20 text-emerald-400 rounded-xl disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-600 transition-all"
            >
              <Plus size={18} strokeWidth={2.5} />
            </button>
          </div>
          <p className="text-[10px] text-zinc-500 mt-2 ml-2">Puedes añadir varios separando con comas.</p>

          {/* Chips area */}
          <div className="mt-6 flex flex-wrap gap-2 min-h-[60px]">
            {ingredients.length === 0 && !inputValue.trim() && (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 py-4 opacity-50">
                <ShoppingCart size={24} className="mb-2" />
                <span className="text-xs">Sin ingredientes todavía</span>
              </div>
            )}
            
            {ingredients.map((ing, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full text-sm font-medium animate-in slide-in-from-bottom-2 duration-300"
              >
                <span>{ing}</span>
                <button 
                  onClick={() => removeIngredient(idx)}
                  className="p-0.5 hover:bg-emerald-500/20 rounded-full transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950/50 border-t border-zinc-800/50">
          <button 
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-zinc-950 font-bold py-3.5 rounded-2xl shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <ShoppingCart size={18} strokeWidth={2.5} />
            Añadir a la compra
          </button>
        </div>
      </div>
    </div>
  )
}
