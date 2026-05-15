import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PlusCircle, LogOut } from 'lucide-react'
import { logout } from './login/actions'

export default async function Dashboard() {
  const supabase = await createClient()

  // 1. Verificar auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Obtener perfil del usuario
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('couple_id, display_name, name')
    .eq('id', user.id)
    .single()

  const myName = userProfile?.name || userProfile?.display_name || user.email?.split('@')[0] || 'Tú'

  // 3. Obtener gastos del mes actual
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  let expensesQuery = supabase
    .from('expenses')
    .select(`
      id, amount, concept, description, date, created_at, paid_by,
      categories ( name, icon )
    `)
    .gte('created_at', startOfMonth.toISOString())
    .order('created_at', { ascending: false })

  // Filtrar por pareja o por usuario propio
  if (userProfile?.couple_id) {
    expensesQuery = expensesQuery.eq('couple_id', userProfile.couple_id)
  } else {
    expensesQuery = expensesQuery.eq('paid_by', user.id)
  }

  const { data: expenses } = await expensesQuery

  // 4. Cálculo de totales del mes
  let myTotal = 0
  let partnerTotal = 0
  let settlementMessage = 'No hay gastos este mes.'

  if (expenses && expenses.length > 0) {
    expenses.forEach(exp => {
      if (exp.paid_by === user.id) {
        myTotal += Number(exp.amount)
      } else {
        partnerTotal += Number(exp.amount)
      }
    })

    if (userProfile?.couple_id) {
      // Modo pareja: calcular quién debe a quién
      const diff = Math.abs(myTotal - partnerTotal)
      const debt = diff / 2
      if (myTotal > partnerTotal) {
        settlementMessage = `Tu pareja te debe €${debt.toFixed(2)}`
      } else if (partnerTotal > myTotal) {
        settlementMessage = `Le debes €${debt.toFixed(2)} a tu pareja`
      } else {
        settlementMessage = 'Estáis en paz. 🍻'
      }
    } else {
      settlementMessage = `Has gastado €${myTotal.toFixed(2)} este mes`
    }
  }

  const showPartnerMissing = userProfile?.couple_id === null || userProfile?.couple_id === undefined

  return (
    <main className="w-full max-w-md mx-auto p-4 flex flex-col min-h-screen">
      <header className="flex justify-between items-center py-6 mb-2">
        <div>
          <h1 className="text-2xl font-bold">CoupleWallet</h1>
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest mt-1">
            {myName}
          </p>
        </div>
        <form action={logout}>
          <button className="text-zinc-400 hover:text-white transition-colors">
            <LogOut size={20} />
          </button>
        </form>
      </header>

      {/* Ajuste de Cuentas */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8 shadow-lg">
        <h2 className="text-sm text-zinc-400 font-semibold mb-2 uppercase tracking-wider">Ajuste del Mes</h2>
        <p className="text-xl font-medium text-emerald-400 leading-snug">
          {showPartnerMissing ? 'Falta tu pareja. Dile que se registre.' : settlementMessage}
        </p>
        <div className="flex justify-between mt-6 text-sm">
          <div className="flex flex-col">
            <span className="text-zinc-500">Tú has pagado</span>
            <span className="text-lg font-semibold text-zinc-200">€{myTotal.toFixed(2)}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-zinc-500">Tu pareja pagó</span>
            <span className="text-lg font-semibold text-zinc-200">€{partnerTotal.toFixed(2)}</span>
          </div>
        </div>
      </section>

      {/* Lista de Gastos */}
      <section className="flex-1">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-zinc-100">Gastos Recientes</h2>
        </div>

        <div className="space-y-3 pb-24">
          {expenses?.map((expense: any) => (
            <div key={expense.id} className="bg-zinc-900/50 p-4 rounded-xl flex justify-between items-center border border-zinc-800/50">
              <div>
                <p className="font-medium text-zinc-200">{expense.concept || expense.description}</p>
                <div className="flex gap-2 text-xs text-zinc-500 mt-1">
                  <span className="px-2 py-0.5 bg-zinc-800 rounded-full">{expense.categories?.name || 'Sin categoría'}</span>
                  <span>• {new Date(expense.date || expense.created_at).toLocaleDateString('es-ES')}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-zinc-100">€{Number(expense.amount).toFixed(2)}</p>
                <p className="text-xs text-zinc-500 mt-1">
                  {expense.paid_by === user.id ? 'Tú' : 'Tu pareja'}
                </p>
              </div>
            </div>
          ))}
          {(!expenses || expenses.length === 0) && (
            <p className="text-center text-zinc-500 py-8">No hay gastos todavía. ¡Añade el primero!</p>
          )}
        </div>
      </section>

      {/* Botón Flotante */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center pointer-events-none">
        <Link
          href="/add"
          className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full p-4 shadow-xl shadow-emerald-900/20 pointer-events-auto transition-transform hover:scale-105 active:scale-95"
        >
          <PlusCircle size={32} />
        </Link>
      </div>
    </main>
  )
}
