import { getServerPB } from '@/lib/pocketbase-server'
import { redirect } from 'next/navigation'
import CalendarClient from './CalendarClient'

export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
  const pb = await getServerPB()
  const user = pb.authStore.model
  if (!user) redirect('/login')

  let profile
  try {
    profile = await pb.collection('users').getFirstListItem(`id="${user.id}"`)
  } catch(e) {}

  if (!profile?.couple_id) redirect('/setup-couple')

  const past = new Date()
  past.setDate(past.getDate() - 365)
  
  const future = new Date()
  future.setDate(future.getDate() + 365)

  let events: any[] = []
  try {
    events = await pb.collection('calendar_events').getFullList({
      filter: `couple_id="${profile.couple_id}" && date>="${past.toISOString()}" && date<="${future.toISOString()}"`,
      sort: 'date'
    })
  } catch(e) {}

  return (
    <main className="w-full max-w-md mx-auto min-h-screen flex flex-col pb-32">
      <header className="px-6 py-6 pb-2">
        <h1 className="text-2xl font-bold text-zinc-100">Agenda Común</h1>
        <p className="text-sm text-zinc-500 mt-1">Sincronizados en todo momento</p>
      </header>

      <CalendarClient initialEvents={events || []} coupleId={profile.couple_id} />
    </main>
  )
}
