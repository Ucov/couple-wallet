import { createClient } from '@/utils/supabase/server'
import { addRecurringExpense } from '../recurring-actions'
import Link from 'next/link'
import { ArrowLeft, Repeat } from 'lucide-react'
import { redirect } from 'next/navigation'
import DeleteRecurringButton from '@/components/DeleteRecurringButton'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function RecurringExpensesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: userProfile } = await supabase
    .from('profiles')
    .select('couple_id')
    .eq('id', user.id)
    .single()

  if (!userProfile?.couple_id) {
    return (
      <main className="w-full max-w-md mx-auto p-4 flex flex-col min-h-screen justify-center items-center text-center">
        <h1 className="text-xl font-bold mb-4">Gastos Fijos</h1>
        <p className="text-zinc-400 mb-6">Necesitas configurar una pareja para añadir gastos fijos.</p>
        <Link href="/" className="bg-emerald-600 px-6 py-3 rounded-xl font-semibold">Volver al inicio</Link>
      </main>
    )
  }

  const { data: categories } = await supabase.from('categories').select('*').order('name')
  
  const { data: recurringExpenses } = await supabase
    .from('recurring_expenses')
    .select(`
      id,
      amount,
      concept,
      day_of_month,
      paid_by,
      categories ( name, icon, color )
    `)
    .eq('couple_id', userProfile.couple_id)
    .order('day_of_month', { ascending: true })

  return (
    <main className="w-full max-w-md mx-auto p-4 flex flex-col min-h-screen">
      <header className="flex items-center py-6 mb-2">
        <Link href="/" className="text-zinc-400 hover:text-white mr-4">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Repeat size={20} className="text-emerald-500" />
          Gastos Fijos
        </h1>
      </header>

      <p className="text-sm text-zinc-400 mb-6">
        Estos gastos se añadirán automáticamente cada mes el día que especifiques.
      </p>

      {/* Lista de Gastos Fijos Existentes */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">Tus Gastos Fijos</h2>
        {recurringExpenses && recurringExpenses.length > 0 ? (
          <div className="space-y-3">
            {recurringExpenses.map((expense) => {
              const category = Array.isArray(expense.categories) ? expense.categories[0] : expense.categories
              return (
                <div key={expense.id} className="bg-zinc-900/50 p-4 rounded-xl flex justify-between items-center border border-zinc-800/50">
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xl">
                      {category?.icon || '📅'}
                    </div>
                    <div>
                      <p className="font-medium text-zinc-200">{expense.concept}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Día {expense.day_of_month} • {category?.name || 'General'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div className="mr-2">
                      <p className="font-bold text-zinc-100">€{Number(expense.amount).toFixed(2)}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {expense.paid_by === user.id ? 'Tú' : 'Pareja'}
                      </p>
                    </div>
                    <DeleteRecurringButton
                      id={expense.id}
                      concept={expense.concept}
                      amount={Number(expense.amount)}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-6 border-2 border-dashed border-zinc-800 rounded-xl">
            <p className="text-zinc-500 text-sm">No tienes gastos fijos configurados.</p>
          </div>
        )}
      </section>

      {/* Formulario para añadir */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">Añadir Nuevo</h2>
        <form action={addRecurringExpense} className="flex flex-col gap-5 bg-zinc-900 p-5 rounded-2xl border border-zinc-800">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Cantidad (€)</label>
            <input
              type="number"
              step="0.01"
              name="amount"
              className="w-full text-2xl bg-transparent border-b border-zinc-700 focus:border-emerald-500 pb-1 outline-none text-white placeholder-zinc-700"
              placeholder="0.00"
              required
            />
            <p className="text-xs text-zinc-500 mt-1">Introduce el coste TOTAL. Se dividirá automáticamente según vuestro porcentaje.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Concepto</label>
            <input
              type="text"
              name="concept"
              className="w-full bg-zinc-950 rounded-lg px-3 py-2.5 text-sm text-white border border-zinc-800 focus:border-emerald-500 outline-none"
              placeholder="Ej. Alquiler, Internet..."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Día del mes (1-31)</label>
            <input
              type="number"
              min="1"
              max="31"
              name="day_of_month"
              defaultValue="1"
              className="w-full bg-zinc-950 rounded-lg px-3 py-2.5 text-sm text-white border border-zinc-800 focus:border-emerald-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-2">Categoría</label>
            <div className="grid grid-cols-2 gap-2">
              {categories?.map((cat) => (
                <label key={cat.id} className="cursor-pointer">
                  <input type="radio" name="category_id" value={cat.id} className="peer sr-only" required />
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-2 text-center text-xs peer-checked:bg-emerald-600/20 peer-checked:border-emerald-500 peer-checked:text-emerald-400 transition-colors">
                    {cat.name}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="mt-2 w-full bg-zinc-100 hover:bg-white text-zinc-900 rounded-lg py-3 font-bold text-sm transition-transform active:scale-95"
          >
            Añadir Gasto Fijo
          </button>
        </form>
      </section>
    </main>
  )
}
