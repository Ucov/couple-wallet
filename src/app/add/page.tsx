import { createClient } from '@/utils/supabase/server'
import { addExpense } from './actions'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function AddExpensePage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  const supabase = await createClient()
  const { data: categories } = await supabase.from('categories').select('*').order('name')
  const { message } = await searchParams

  return (
    <main className="w-full max-w-md mx-auto p-4 flex flex-col min-h-screen">
      <header className="flex items-center py-6 mb-4">
        <Link href="/" className="text-zinc-400 hover:text-white mr-4">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold">Añadir Gasto</h1>
      </header>

      <form action={addExpense} className="flex flex-col gap-6">
        <div>
          <label className="block text-sm font-semibold text-zinc-400 mb-2">Cantidad (€)</label>
          <input
            type="number"
            step="0.01"
            name="amount"
            className="w-full text-3xl bg-transparent border-b-2 border-zinc-800 focus:border-emerald-500 pb-2 outline-none text-white placeholder-zinc-700"
            placeholder="0.00"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-400 mb-2">Concepto</label>
          <input
            type="text"
            name="concept"
            className="w-full bg-zinc-900 rounded-xl px-4 py-3 text-white border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
            placeholder="Ej. Cena en pizzería"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-400 mb-2">Fecha</label>
          <input
            type="date"
            name="date"
            defaultValue={new Date().toISOString().split('T')[0]}
            max={new Date().toISOString().split('T')[0]}
            className="w-full bg-zinc-900 rounded-xl px-4 py-3 text-white border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-400 mb-2">Categoría</label>
          <div className="grid grid-cols-2 gap-3">
            {categories?.map((cat) => (
              <label key={cat.id} className="cursor-pointer">
                <input type="radio" name="category_id" value={cat.id} className="peer sr-only" required />
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-center peer-checked:bg-emerald-600/20 peer-checked:border-emerald-500 peer-checked:text-emerald-400 transition-colors">
                  {cat.name}
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-400 mb-2">¿Quién lo ha pagado?</label>
          <div className="grid grid-cols-2 gap-3">
            <label className="cursor-pointer">
              <input type="radio" name="paid_by_me" value="true" className="peer sr-only" defaultChecked />
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-center peer-checked:bg-emerald-600/20 peer-checked:border-emerald-500 peer-checked:text-emerald-400 transition-colors">
                Yo
              </div>
            </label>
            <label className="cursor-pointer">
              <input type="radio" name="paid_by_me" value="false" className="peer sr-only" />
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-center peer-checked:bg-emerald-600/20 peer-checked:border-emerald-500 peer-checked:text-emerald-400 transition-colors">
                Mi pareja
              </div>
            </label>
          </div>
        </div>
        
        {message && (
          <div className="p-4 rounded-xl bg-red-950 border border-red-900 text-red-200 text-sm text-center">
            {message}
          </div>
        )}

        <button
          type="submit"
          className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-4 font-bold text-lg shadow-lg shadow-emerald-900/20 transition-transform active:scale-95"
        >
          Guardar Gasto
        </button>
      </form>
    </main>
  )
}
