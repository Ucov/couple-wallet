import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ProfileForm from './ProfileForm'
import CopyCodeButton from './CopyCodeButton'
import LeaveGroupButton from './LeaveGroupButton'
import PushNotificationsClient from '@/components/PushNotificationsClient'
import BackupPanel from './BackupPanel'
import ColorSelector from './ColorSelector'
import ThemeToggle from '@/components/ThemeToggle'
import GenerateJoinCodeButton from '@/components/GenerateJoinCodeButton'
import SplitPercentageManager from './SplitPercentageManager'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, couple_id, split_percentage')
    .eq('id', user.id)
    .single()

    
  let joinCode = null;
  if (profile?.couple_id) {
    const { data: couple } = await supabase
      .from('couples')
      .select('join_code')
      .eq('id', profile.couple_id)
      .single()
    joinCode = couple?.join_code
  }

  return (
    <main className="w-full max-w-md mx-auto p-4 flex flex-col min-h-screen">
      <header className="flex items-center justify-between py-6 mb-2">
        <h1 className="text-2xl font-bold">Perfil y Seguridad</h1>
      </header>
      
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6 shadow-lg">
        <h2 className="text-sm text-zinc-400 font-semibold uppercase tracking-wider mb-4">Ajustes Personales</h2>
        <ProfileForm initialName={profile?.name || ''} />
        
        <div className="mt-8 pt-6 border-t border-zinc-800">
          <h2 className="text-sm text-zinc-400 font-semibold uppercase tracking-wider mb-4">Apariencia</h2>
          <ColorSelector />
          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-300">Modo Oscuro / Claro</span>
            <ThemeToggle />
          </div>
        </div>
      </section>

      {profile?.couple_id && (
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6 shadow-lg">
          <SplitPercentageManager initialPercentage={profile.split_percentage ?? 50} />
        </section>
      )}

      {profile?.couple_id && (

        <PushNotificationsClient coupleId={profile.couple_id} />
      )}

      {profile?.couple_id && (
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6 shadow-lg">
          <h2 className="text-sm text-zinc-400 font-semibold uppercase tracking-wider mb-4">Código de Pareja</h2>
          <p className="text-zinc-300 text-sm mb-4">Comparte este código con tu pareja si aún no se ha unido a tu grupo.</p>
          
          {joinCode ? (
            <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-zinc-800">
              <span className="font-mono text-emerald-400 tracking-widest font-bold text-lg">{joinCode}</span>
              <CopyCodeButton code={joinCode} />
            </div>
          ) : (
            <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 p-4 rounded-xl text-sm mb-4">
              <p>Tu grupo no tiene un código de pareja asignado o no tienes permisos para verlo.</p>
              <GenerateJoinCodeButton coupleId={profile.couple_id} />
            </div>
          )}
          
          <div className="mt-8 pt-6 border-t border-zinc-800">
            <h2 className="text-sm text-zinc-400 font-semibold uppercase tracking-wider mb-4">Copia de Seguridad</h2>
            <p className="text-zinc-500 text-xs mb-4">Exporta o importa todo el historial de gastos y tareas de la pareja. Guarda el archivo .json en un lugar seguro.</p>
            <BackupPanel />
          </div>

          <div className="mt-8 pt-6 border-t border-zinc-800">
            <LeaveGroupButton />
          </div>
        </section>
      )}
    </main>
  )
}
