import { getServerPB } from '@/lib/pocketbase-server'
import { redirect } from 'next/navigation'
import ChoresClient from './ChoresClient'

export const dynamic = 'force-dynamic'

export default async function ChoresPage() {
  const pb = await getServerPB()
  const user = pb.authStore.model
  if (!user) redirect('/login')

  let profile
  try {
    profile = await pb.collection('users').getFirstListItem(`id="${user.id}"`)
  } catch(e) {}

  if (!profile?.couple_id) redirect('/setup-couple')

  let partnerProfile
  try {
    partnerProfile = await pb.collection('users').getFirstListItem(`couple_id="${profile.couple_id}" && id!="${user.id}"`)
  } catch(e) {}

  let chores: any[] = []
  try {
    chores = await pb.collection('chores').getFullList({
      filter: `couple_id="${profile.couple_id}"`,
      sort: '-created'
    })
  } catch(e) {}

  return (
    <main className="w-full max-w-md mx-auto min-h-screen flex flex-col pb-32">
      <header className="px-6 py-6 pb-2">
        <h1 className="text-2xl font-bold text-zinc-100">Tareas Domésticas</h1>
        <p className="text-sm text-zinc-500 mt-1">Repartiendo el trabajo en equipo</p>
      </header>

      <ChoresClient 
        initialChores={chores || []} 
        coupleId={profile.couple_id} 
        currentUserId={user.id}
        currentUserName={profile.name || 'Tú'}
        partnerId={partnerProfile?.id || null}
        partnerName={partnerProfile?.name || 'Pareja'}
      />
    </main>
  )
}
