import { createClient } from '@/utils/supabase/server'
import { addRecurringExpense } from '../recurring-actions'
import Link from 'next/link'
import { ArrowLeft, Repeat, CalendarDays, Wallet, Plus } from 'lucide-react'
import { redirect } from 'next/navigation'
import DeleteRecurringButton from '@/components/DeleteRecurringButton'
import { getCategoryIcon } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Helper to determine brand colors/logos based on concept name
const getBrandInfo = (concept: string) => {
  const name = concept.toLowerCase()
  let domain = ''
  
  // Streaming & Entertainment
  if (name.includes('netflix')) domain = 'netflix.com'
  else if (name.includes('spotify')) domain = 'spotify.com'
  else if (name.includes('amazon') || name.includes('prime')) domain = 'amazon.es'
  else if (name.includes('hbo') || name.includes('max')) domain = 'max.com'
  else if (name.includes('disney')) domain = 'disneyplus.com'
  else if (name.includes('apple')) domain = 'apple.com'
  else if (name.includes('dazn')) domain = 'dazn.com'
  else if (name.includes('youtube')) domain = 'youtube.com'
  else if (name.includes('twitch')) domain = 'twitch.tv'
  
  // Gaming
  else if (name.includes('playstation') || name.includes('psn')) domain = 'playstation.com'
  else if (name.includes('xbox')) domain = 'xbox.com'
  else if (name.includes('nintendo')) domain = 'nintendo.com'
  
  // Utilities & Services
  else if (name.includes('gym') || name.includes('gimnasio') || name.includes('mcfit') || name.includes('synergym') || name.includes('basicfit')) {
    if (name.includes('mcfit')) domain = 'mcfit.com'
    else if (name.includes('synergym')) domain = 'synergym.es'
    else if (name.includes('basicfit') || name.includes('basic fit')) domain = 'basic-fit.com'
    else return { letter: '🏋️', bg: 'bg-orange-500' }
  }
  else if (name.includes('alquiler') || name.includes('hipoteca')) return { letter: '🏠', bg: 'bg-blue-600' }
  else if (name.includes('internet') || name.includes('fibra') || name.includes('movil') || name.includes('vodafone') || name.includes('movistar') || name.includes('orange') || name.includes('digi')) {
    if (name.includes('vodafone')) domain = 'vodafone.es'
    else if (name.includes('movistar')) domain = 'movistar.es'
    else if (name.includes('orange')) domain = 'orange.es'
    else if (name.includes('digi')) domain = 'digimobil.es'
    else return { letter: '🌐', bg: 'bg-teal-500' }
  }
  else if (name.includes('luz') || name.includes('electricidad') || name.includes('endesa') || name.includes('iberdrola') || name.includes('repsol') || name.includes('naturgy')) {
    if (name.includes('endesa')) domain = 'endesa.com'
    else if (name.includes('iberdrola')) domain = 'iberdrola.es'
    else if (name.includes('repsol')) domain = 'repsol.es'
    else if (name.includes('naturgy')) domain = 'naturgy.es'
    else return { letter: '⚡', bg: 'bg-yellow-500' }
  }
  else if (name.includes('agua')) return { letter: '💧', bg: 'bg-cyan-500' }
  else if (name.includes('seguro')) {
    if (name.includes('mapfre')) domain = 'mapfre.es'
    else if (name.includes('mutua')) domain = 'mutuamadrilena.es'
    else if (name.includes('allianz')) domain = 'allianz.es'
    else return { letter: '🛡️', bg: 'bg-indigo-500' }
  }
  
  if (domain) {
    return { logoUrl: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`, bg: 'bg-white' }
  }
  
  // Default fallback
  return { letter: concept.charAt(0).toUpperCase(), bg: 'bg-zinc-800', text: 'text-white' }
}

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
        <h1 className="text-xl font-bold mb-4">Suscripciones</h1>
        <p className="text-zinc-400 mb-6">Necesitas configurar una pareja para añadir suscripciones.</p>
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

  // Cálculos del Dashboard
  const expenses = recurringExpenses || []
  const totalMonthly = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0)
  const totalYearly = totalMonthly * 12

  // Ordenar por el próximo cobro
  const today = new Date().getDate()
  
  // Separar en "Próximos este mes" y "El mes que viene"
  const upcomingThisMonth = expenses.filter(e => e.day_of_month >= today).sort((a, b) => a.day_of_month - b.day_of_month)
  const nextMonth = expenses.filter(e => e.day_of_month < today).sort((a, b) => a.day_of_month - b.day_of_month)
  
  const timelineExpenses = [...upcomingThisMonth, ...nextMonth]

  return (
    <main className="w-full max-w-md mx-auto p-4 flex flex-col min-h-screen pb-24">
      <header className="flex items-center py-6 mb-2">
        <Link href="/" className="text-zinc-400 hover:text-white mr-4 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold flex items-center gap-2 text-white tracking-tight">
          Suscripciones y Fijos
        </h1>
      </header>

      {/* Dashboard Anual / Mensual */}
      <section className="mb-8">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-3xl flex flex-col items-center justify-center text-center shadow-lg backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 w-full h-1 bg-emerald-500 opacity-50" />
            <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-1">Total Mensual</span>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-black text-white">{totalMonthly.toFixed(2)}</span>
              <span className="text-sm font-medium text-zinc-500 mb-1">€</span>
            </div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-3xl flex flex-col items-center justify-center text-center shadow-lg backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 w-full h-1 bg-rose-500 opacity-50" />
            <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-1">Impacto Anual</span>
            <div className="flex items-end gap-1 group-hover:scale-105 transition-transform">
              <span className="text-3xl font-black text-rose-400">{totalYearly.toFixed(2)}</span>
              <span className="text-sm font-medium text-rose-500/50 mb-1">€</span>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline de Suscripciones */}
      <section className="mb-10 flex-1">
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 px-1 flex items-center justify-between">
          <span>Tus suscripciones</span>
          <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full">{expenses.length}</span>
        </h2>
        
        {timelineExpenses.length > 0 ? (
          <div className="space-y-3 relative before:absolute before:inset-0 before:ml-[23px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-800 before:to-transparent">
            {timelineExpenses.map((expense) => {
              const brand = getBrandInfo(expense.concept)
              const isNext = expense.id === timelineExpenses[0].id // El primer cobro más inminente
              
              return (
                <div key={expense.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  
                  {/* Dot en el timeline */}
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-4 border-zinc-950 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${brand.bg} ${brand.text || ''} font-black text-xl z-10 overflow-hidden ${isNext ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-zinc-950 scale-110' : ''}`}>
                    {brand.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={brand.logoUrl} alt={expense.concept} className="w-full h-full object-cover p-1.5" />
                    ) : (
                      brand.letter
                    )}
                  </div>
                  
                  {/* Card */}
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-3xl bg-zinc-900 border border-zinc-800/50 shadow-md">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h3 className="font-bold text-zinc-100">{expense.concept}</h3>
                        <p className="text-xs text-zinc-500 font-medium flex items-center gap-1 mt-0.5">
                          <CalendarDays size={12} />
                          Día {expense.day_of_month} {expense.day_of_month < today ? '(Próx. mes)' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="block font-black text-lg text-emerald-400">€{Number(expense.amount).toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-800/50">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-md">
                        Paga: {expense.paid_by === user.id ? 'Tú' : 'Pareja'}
                      </span>
                      <DeleteRecurringButton
                        id={expense.id}
                        concept={expense.concept}
                        amount={Number(expense.amount)}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-zinc-900/20 border-2 border-dashed border-zinc-800/50 rounded-3xl">
            <div className="w-14 h-14 bg-zinc-800 text-zinc-500 rounded-full flex items-center justify-center mb-3">
              <Wallet size={28} />
            </div>
            <p className="text-zinc-400 font-medium">Sin suscripciones</p>
            <p className="text-sm text-zinc-600 mt-1">Añade la primera abajo.</p>
          </div>
        )}
      </section>

      {/* Formulario para añadir */}
      <section className="mt-8 bg-zinc-900/40 p-5 rounded-3xl border border-zinc-800/50">
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Plus size={16} /> Añadir Suscripción
        </h2>
        
        <form action={addRecurringExpense} className="flex flex-col gap-4">
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 ml-1">Concepto</label>
              <input
                type="text"
                name="concept"
                className="w-full bg-zinc-950 rounded-2xl px-4 py-3.5 text-sm text-white border border-zinc-800 focus:border-emerald-500 outline-none transition-colors placeholder:text-zinc-600 font-medium"
                placeholder="Ej. Netflix, Gimnasio..."
                required
              />
            </div>
            <div className="w-28">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 ml-1">Día (1-31)</label>
              <input
                type="number"
                min="1"
                max="31"
                name="day_of_month"
                defaultValue="1"
                className="w-full bg-zinc-950 rounded-2xl px-4 py-3.5 text-sm text-white border border-zinc-800 focus:border-emerald-500 outline-none text-center font-bold"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5 ml-1">Cantidad Mensual Total (€)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">€</span>
              <input
                type="number"
                step="0.01"
                name="amount"
                className="w-full bg-zinc-950 rounded-2xl pl-9 pr-4 py-3.5 text-lg text-white border border-zinc-800 focus:border-emerald-500 outline-none transition-colors font-black placeholder:text-zinc-700"
                placeholder="0.00"
                required
              />
            </div>
            <p className="text-[10px] text-zinc-500 mt-1.5 ml-1 font-medium">Introduce el coste total. Se dividirá automáticamente.</p>
          </div>

          {/* Categoría Oculta / Por defecto (ya no es tan relevante visualmente pero la DB lo pide) */}
          <div className="hidden">
            <input type="radio" name="category_id" value={categories?.[0]?.id || ''} checked readOnly />
          </div>

          <button
            type="submit"
            className="mt-2 w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-2xl py-4 font-black transition-transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            Guardar Suscripción
          </button>
        </form>
      </section>
    </main>
  )
}
