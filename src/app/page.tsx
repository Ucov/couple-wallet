import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PlusCircle, LogOut, Pencil, ChevronLeft, ChevronRight, Repeat, CheckCircle } from 'lucide-react'
import { logout } from './login/actions'
import DeleteExpenseButton from '@/components/DeleteExpenseButton'
import CategoryDonutChart from '@/components/CategoryDonutChart'
import { applyRecurringExpenses } from './recurring-actions'
import { settleMonth } from './settlement-actions'

// Forzamos que la página sea siempre dinámica y no se guarde en caché
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Category {
  name: string
  icon: string
  color: string
}

interface Expense {
  id: string
  amount: number
  concept: string
  date: string
  created_at: string
  paid_by: string
  category_id?: string
  categories: Category | Category[] | null
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const supabase = await createClient()
  const { month, year } = await searchParams

  // 1. Verificar auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Obtener perfil del usuario
  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      couple_id, 
      name
    `)
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Error fetching profile:', profileError)
  }

  let joinCode = null;
  if (userProfile?.couple_id) {
    const { data: coupleData } = await supabase
      .from('couples')
      .select('join_code')
      .eq('id', userProfile.couple_id)
      .single()
    
    joinCode = coupleData?.join_code;
  }

  const myName = userProfile?.name || user.email?.split('@')[0] || 'Usuario'

  // 3. Manejo de fechas y gastos recurrentes
  const now = new Date()
  
  if (userProfile?.couple_id) {
    // Aplicar gastos recurrentes del mes actual (si no se han aplicado ya)
    try {
      await applyRecurringExpenses(userProfile.couple_id, now.getMonth(), now.getFullYear(), false)
    } catch (e) {
      console.error('Error applying recurring expenses:', e)
    }
  }

  const currentMonth = month ? parseInt(month) : now.getMonth()
  const currentYear = year ? parseInt(year) : now.getFullYear()
  
  const startOfMonth = new Date(currentYear, currentMonth, 1)
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)

  // 4. Obtener gastos del mes seleccionado
  let expensesQuery = supabase
    .from('expenses')
    .select(`
      id, 
      amount, 
      concept, 
      date, 
      created_at, 
      paid_by,
      category_id,
      categories ( name, icon, color )
    `)
    .gte('date', startOfMonth.toISOString())
    .lte('date', endOfMonth.toISOString())
    .order('date', { ascending: false })

  if (userProfile?.couple_id) {
    expensesQuery = expensesQuery.eq('couple_id', userProfile.couple_id)
  } else {
    expensesQuery = expensesQuery.eq('paid_by', user.id)
  }

  const { data: expenses } = await expensesQuery

  // 5. Cálculos
  let myTotal = 0
  let partnerTotal = 0
  const categoryTotals: Record<string, { name: string; amount: number; color: string; icon: string }> = {}
  
  expenses?.forEach(exp => {
    const amount = Number(exp.amount)
    if (exp.paid_by === user.id) {
      myTotal += amount
    } else {
      partnerTotal += amount
    }

    const categories = exp.categories
    const category = Array.isArray(categories) ? categories[0] : categories
    const catId = exp.category_id || 'no-category'
    if (!categoryTotals[catId]) {
      categoryTotals[catId] = {
        name: category?.name || 'Sin categoría',
        amount: 0,
        color: category?.color || '#6b7280',
        icon: category?.icon || '💰'
      }
    }
    categoryTotals[catId].amount += amount
  })

  const totalMonth = myTotal + partnerTotal
  const sortedCategories = Object.values(categoryTotals).sort((a, b) => b.amount - a.amount)

  // 6. Verificar si el mes está saldado
  let isSettled = false
  if (userProfile?.couple_id) {
    const { data: settlement } = await supabase
      .from('settlements')
      .select('id')
      .eq('couple_id', userProfile.couple_id)
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .maybeSingle()
    
    if (settlement) {
      isSettled = true
    }
  }

  let settlementMessage = 'Sin gastos este mes.'
  let showSettleButton = false

  if (userProfile?.couple_id) {
    if (isSettled) {
      settlementMessage = 'Mes saldado. Todo al día. ✅'
    } else {
      const diff = Math.abs(myTotal - partnerTotal)
      const debt = diff / 2
      if (myTotal > partnerTotal) {
        settlementMessage = `Tu pareja te debe €${debt.toFixed(2)}`
        showSettleButton = debt > 0
      } else if (partnerTotal > myTotal) {
        settlementMessage = `Le debes €${debt.toFixed(2)} a tu pareja`
        showSettleButton = debt > 0
      } else if (myTotal > 0) {
        settlementMessage = 'Estáis en paz. 🍻'
      }
    }
  } else {
    settlementMessage = `Has gastado €${myTotal.toFixed(2)} este mes`
  }

  // Navegación de meses
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear

  const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(startOfMonth)

  return (
    <main className="w-full max-w-md mx-auto p-4 flex flex-col min-h-screen">
      <header className="flex justify-between items-center py-6 mb-2">
        <div>
          <h1 className="text-2xl font-bold">CoupleWallet</h1>
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest mt-1">
            Hola, {myName}
          </p>
          {joinCode && (
            <p className="text-xs text-emerald-500/80 font-medium mt-1 cursor-help" title="Comparte este código con tu pareja para que se una">
              Código vinculación: <span className="font-mono text-emerald-400 bg-emerald-950/30 px-1.5 py-0.5 rounded">{joinCode}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Link href="/recurring" className="text-zinc-400 hover:text-emerald-400 transition-colors" title="Gastos Fijos">
            <Repeat size={20} />
          </Link>
          <form action={logout}>
            <button className="text-zinc-400 hover:text-white transition-colors" title="Cerrar sesión">
              <LogOut size={20} />
            </button>
          </form>
        </div>
      </header>

      {/* Navegador de Mes */}
      <div className="flex justify-between items-center mb-6 bg-zinc-900/50 p-2 rounded-xl border border-zinc-800">
        <Link href={`/?month=${prevMonth}&year=${prevYear}`} className="p-2 text-zinc-400 hover:text-white">
          <ChevronLeft size={20} />
        </Link>
        <span className="font-semibold text-zinc-200 capitalize">{monthName} {currentYear}</span>
        <Link href={`/?month=${nextMonth}&year=${nextYear}`} className="p-2 text-zinc-400 hover:text-white">
          <ChevronRight size={20} />
        </Link>
      </div>

      {/* Ajuste de Cuentas */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8 shadow-lg">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-sm text-zinc-400 font-semibold uppercase tracking-wider">Balance del Mes</h2>
          {showSettleButton && userProfile?.couple_id && (
            <form action={settleMonth.bind(null, userProfile.couple_id, currentMonth, currentYear)}>
              <button 
                type="submit" 
                className="text-xs font-semibold bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg hover:bg-emerald-600/30 transition-colors flex items-center gap-1.5"
              >
                <CheckCircle size={14} /> Saldar Mes
              </button>
            </form>
          )}
        </div>
        {!userProfile?.couple_id ? (
          <div className="flex flex-col items-start gap-3 mt-1">
            <p className="text-lg font-medium text-red-400 leading-snug">
              Aún no tienes pareja vinculada.
            </p>
            <Link 
              href="/setup-couple" 
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm"
            >
              Crear o unirse a un grupo
            </Link>
          </div>
        ) : (
          <p className="text-xl font-medium text-emerald-400 leading-snug">
            {settlementMessage}
          </p>
        )}
        <div className="flex justify-between mt-6 text-sm">
          <div className="flex flex-col">
            <span className="text-zinc-500">Tú has pagado</span>
            <span className={`text-lg font-semibold ${isSettled ? 'text-zinc-400' : 'text-zinc-200'}`}>€{myTotal.toFixed(2)}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-zinc-500">Tu pareja pagó</span>
            <span className={`text-lg font-semibold ${isSettled ? 'text-zinc-400' : 'text-zinc-200'}`}>€{partnerTotal.toFixed(2)}</span>
          </div>
        </div>
      </section>

      {/* Resumen por Categorías (donut) */}
      <CategoryDonutChart categories={sortedCategories} total={totalMonth} />

      {/* Lista de Gastos */}
      <section className="flex-1">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-zinc-100">Gastos del Mes</h2>
        </div>

        <div className="space-y-3 pb-24">
          {expenses?.map((expense: Expense) => {
            const categories = expense.categories
            const category = Array.isArray(categories) ? categories[0] : categories
            return (
              <div key={expense.id} className="bg-zinc-900/50 p-4 rounded-xl flex justify-between items-center border border-zinc-800/50">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xl">
                    {category?.icon || '💰'}
                  </div>
                  <div>
                    <p className="font-medium text-zinc-200">{expense.concept}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {new Date(expense.date).toLocaleDateString('es-ES')} • {category?.name || 'General'}
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
                <Link href={`/edit/${expense.id}`} className="text-zinc-600 hover:text-emerald-400 transition-colors p-1">
                  <Pencil size={18} />
                </Link>
                <DeleteExpenseButton 
                  id={expense.id} 
                  concept={expense.concept} 
                  amount={Number(expense.amount)} 
                />
              </div>
            </div>
          )
        })}
          {(!expenses || expenses.length === 0) && (
            <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-2xl">
              <p className="text-zinc-500">No hay gastos este mes.</p>
              <p className="text-xs text-zinc-600 mt-1">¡Pulsa el botón + para añadir uno!</p>
            </div>
          )}
        </div>
      </section>

      {/* Botón Flotante */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center pointer-events-none">
        <Link
          href="/add"
          className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full p-4 shadow-xl shadow-emerald-900/20 pointer-events-auto transition-transform hover:scale-110 active:scale-95"
        >
          <PlusCircle size={32} />
        </Link>
      </div>
    </main>
  )
}
