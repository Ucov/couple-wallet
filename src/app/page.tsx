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

  // 2. Obtener gastos del mes actual
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: expenses } = await supabase
    .from('expenses')
    .select(`
      id, amount, concept, date, paid_by,
      categories ( name, icon, color ),
      profiles ( name )
    `)
    .gte('date', startOfMonth.toISOString())
    .order('date', { ascending: false })

  // 3. Obtener perfiles para el cálculo
  const { data: profiles } = await supabase.from('profiles').select('*')
  
  // Cálculo de Deudas
  let settlementMessage = "No hay gastos este mes."
  let balanceData = { youPaid: 0, partnerPaid: 0 }

  if (profiles && profiles.length === 2 && expenses) {
    const p1 = profiles[0]
    const p2 = profiles[1]

    let totalP1 = 0
    let totalP2 = 0

    expenses.forEach(exp => {
      if (exp.paid_by === p1.id) totalP1 += Number(exp.amount)
      if (exp.paid_by === p2.id) totalP2 += Number(exp.amount)
    })

    const difference = Math.abs(totalP1 - totalP2)
    const debt = difference / 2

    if (totalP1 > totalP2) {
      settlementMessage = `${p2.name} le debe €${debt.toFixed(2)} a ${p1.name}`
    } else if (totalP2 > totalP1) {
      settlementMessage = `${p1.name} le debe €${debt.toFixed(2)} a ${p2.name}`
    } else {
      settlementMessage = "Estáis en paz. 🍻"
    }

    if (user.id === p1.id) {
      balanceData = { youPaid: totalP1, partnerPaid: totalP2 }
    } else {
      balanceData = { youPaid: totalP2, partnerPaid: totalP1 }
    }
  } else if (profiles && profiles.length < 2) {
    settlementMessage = "Falta tu pareja. Dile que se registre."
  }

  return (
    <main className="w-full max-w-md mx-auto p-4 flex flex-col min-h-screen">
      <header className="flex justify-between items-center py-6 mb-2">
        <h1 className="text-2xl font-bold">CoupleWallet</h1>
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
          {settlementMessage}
        </p>
        <div className="flex justify-between mt-6 text-sm">
          <div className="flex flex-col">
            <span className="text-zinc-500">Tú has pagado</span>
            <span className="text-lg font-semibold text-zinc-200">€{balanceData.youPaid.toFixed(2)}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-zinc-500">Tu pareja pagó</span>
            <span className="text-lg font-semibold text-zinc-200">€{balanceData.partnerPaid.toFixed(2)}</span>
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
                <p className="font-medium text-zinc-200">{expense.concept}</p>
                <div className="flex gap-2 text-xs text-zinc-500 mt-1">
                  <span className="px-2 py-0.5 bg-zinc-800 rounded-full">{expense.categories?.name}</span>
                  <span>• {new Date(expense.date).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-zinc-100">€{expense.amount}</p>
                <p className="text-xs text-zinc-500 mt-1">Pagó {expense.profiles?.name}</p>
              </div>
            </div>
          ))}
          {expenses?.length === 0 && (
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
