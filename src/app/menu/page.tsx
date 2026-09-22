import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import WeeklyMenuClient from './WeeklyMenuClient'
import { getWeeklyMenu } from './actions'

export const dynamic = 'force-dynamic'

export default async function MenuPage({ searchParams }: { searchParams: Promise<{ start?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const resolvedParams = await searchParams
  
  // Find Monday of the current week (or requested week)
  const today = resolvedParams.start ? new Date(resolvedParams.start) : new Date()
  const day = today.getDay()
  const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  
  const weekStart = new Date(today.setDate(diff))
  weekStart.setHours(0, 0, 0, 0)
  
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  const { data, coupleId, error } = await getWeeklyMenu(
    weekStart.toISOString(), 
    weekEnd.toISOString()
  )

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
        initialData={data || []} 
        coupleId={coupleId!} 
        currentWeekStart={weekStart}
      />
    </main>
  )
}
