import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import WeeklyMenuClient from './WeeklyMenuClient'
import { getWeeklyMenu } from './actions'
import { startOfWeek, addDays, format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

export default async function MenuPage({ searchParams }: { searchParams: Promise<{ start?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const resolvedParams = await searchParams
  
  // Find Monday of the current week (or requested week)
  let today = new Date()
  if (resolvedParams.start) {
    today = parseISO(resolvedParams.start)
  }
  
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekEnd = addDays(weekStart, 6)

  const startDateStr = format(weekStart, 'yyyy-MM-dd')
  const endDateStr = format(weekEnd, 'yyyy-MM-dd')

  const { data, coupleId, error } = await getWeeklyMenu(startDateStr, endDateStr)

  if (error) {
    return <div className="p-4 text-red-500">Error loading menu: {error}</div>
  }

  return (
    <main className="p-4 pt-6 max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Menú Semanal</h1>
        <p className="text-zinc-400 text-sm">Planifica vuestras comidas y cenas. Pulsa el carrito para añadir lo que falte a la lista de la compra.</p>
      </div>

      <WeeklyMenuClient 
        initialData={data as any || []} 
        coupleId={coupleId!} 
        currentWeekStart={startDateStr}
      />
    </main>
  )
}
