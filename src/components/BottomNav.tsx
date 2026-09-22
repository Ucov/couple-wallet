'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CheckSquare, UserCog, Calendar, Plus, ShoppingCart, Utensils, Receipt, PiggyBank } from 'lucide-react'
import CreateGoalModal from '@/app/savings/CreateGoalModal'

export default function BottomNav() {
  const pathname = usePathname()
  const [isFabOpen, setIsFabOpen] = useState(false)
  const [isCreateGoalOpen, setIsCreateGoalOpen] = useState(false)

  // No mostrar la barra en pantallas de auth o setup
  if (!pathname || pathname === '/login' || pathname === '/setup-couple') {
    return null
  }

  return (
    <>
      {/* Backdrop para cerrar el FAB */}
      {isFabOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setIsFabOpen(false)}
        />
      )}

      {/* Menú Flotante Emergente */}
      <div 
        className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 transition-all duration-300 ${
          isFabOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-8 pointer-events-none'
        }`}
      >
        <Link 
          href="/shopping"
          onClick={() => setIsFabOpen(false)}
          className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 text-white px-5 py-3 rounded-2xl shadow-xl hover:bg-zinc-800 transition-colors"
        >
          <div className="bg-emerald-500/20 text-emerald-400 p-2 rounded-xl">
            <ShoppingCart size={20} />
          </div>
          <span className="font-medium">Ir a la compra</span>
        </Link>
        
        <Link 
          href="/menu"
          onClick={() => setIsFabOpen(false)}
          className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 text-white px-5 py-3 rounded-2xl shadow-xl hover:bg-zinc-800 transition-colors"
        >
          <div className="bg-amber-500/20 text-amber-400 p-2 rounded-xl">
            <Utensils size={20} />
          </div>
          <span className="font-medium">Planificar menú</span>
        </Link>
        
        <button 
          onClick={() => {
            setIsFabOpen(false)
            setIsCreateGoalOpen(true)
          }}
          className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 text-white px-5 py-3 rounded-2xl shadow-xl hover:bg-zinc-800 transition-colors"
        >
          <div className="bg-rose-500/20 text-rose-400 p-2 rounded-xl">
            <PiggyBank size={20} />
          </div>
          <span className="font-medium">Nueva Hucha</span>
        </button>
      </div>

      <CreateGoalModal 
        isOpen={isCreateGoalOpen} 
        onClose={() => setIsCreateGoalOpen(false)} 
      />

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
          <Link 
            href="/"
            prefetch={true}
            className={`flex flex-col items-center justify-center w-[50px] h-14 mt-1 rounded-2xl space-y-1 transition-all ${
              pathname === '/' ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Home size={22} className={pathname === '/' ? 'fill-emerald-400/20' : ''} />
            <span className="text-[10px] font-medium">Inicio</span>
          </Link>
          
          <Link 
            href="/calendar" 
            prefetch={true}
            className={`flex flex-col items-center justify-center w-[50px] h-14 rounded-2xl transition-all duration-300 ${
              pathname.startsWith('/calendar')
                ? 'text-emerald-400 bg-emerald-500/10' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <div className={`transition-transform duration-300 ${pathname.startsWith('/calendar') ? 'scale-110 mb-1' : 'mb-0.5'}`}>
              <Calendar size={22} strokeWidth={pathname.startsWith('/calendar') ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-medium transition-all duration-300 ${pathname.startsWith('/calendar') ? 'opacity-100' : 'opacity-70'}`}>
              Agenda
            </span>
          </Link>

          {/* Botón Flotante Central (FAB) */}
          <button 
            onClick={() => setIsFabOpen(!isFabOpen)}
            className="relative -top-4 flex items-center justify-center w-14 h-14 bg-emerald-500 text-zinc-950 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all z-50"
          >
            <Plus size={28} className={`transition-transform duration-300 ${isFabOpen ? 'rotate-45' : 'rotate-0'}`} />
          </button>

          <Link 
            href="/chores"
            prefetch={true}
            className={`flex flex-col items-center justify-center w-[50px] h-14 mt-1 rounded-2xl space-y-1 transition-all ${
              pathname === '/chores' || pathname?.startsWith('/chores') ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <CheckSquare size={22} className={pathname === '/chores' || pathname?.startsWith('/chores') ? 'fill-emerald-400/20' : ''} />
            <span className="text-[10px] font-medium">Tareas</span>
          </Link>
          
          <Link 
            href="/profile"
            prefetch={true}
            className={`flex flex-col items-center justify-center w-[50px] h-14 mt-1 rounded-2xl space-y-1 transition-all ${
              pathname === '/profile' || pathname?.startsWith('/profile') ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <UserCog size={22} className={pathname === '/profile' || pathname?.startsWith('/profile') ? 'fill-emerald-400/20' : ''} />
            <span className="text-[10px] font-medium">Perfil</span>
          </Link>
        </div>
      </nav>
    </>
  )
}
