import { createCouple, joinCouple } from './actions'

export default async function SetupCouplePage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  const { message } = await searchParams

  return (
    <main className="w-full max-w-md mx-auto p-8 flex flex-col min-h-screen justify-center">
      <h1 className="text-3xl font-bold mb-2">Configura tu Pareja</h1>
      <p className="text-zinc-400 mb-8">Para empezar a usar CoupleWallet, necesitas estar vinculado a alguien.</p>

      <div className="space-y-12">
        {/* Crear Pareja */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-zinc-200">Crear un nuevo grupo</h2>
          <form action={createCouple} className="flex flex-col gap-3">
            <input
              name="name"
              placeholder="Nombre de vuestro dúo (ej. Los Martínez)"
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
            <button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors">
              Crear Grupo
            </button>
          </form>
        </section>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-800"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-zinc-950 px-2 text-zinc-500 font-bold">O</span>
          </div>
        </div>

        {/* Unirse a Pareja */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-zinc-200">Unirme a mi pareja</h2>
          <form action={joinCouple} className="flex flex-col gap-3">
            <input
              name="join_code"
              placeholder="Código de invitación (ej. XJ29KF)"
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
              required
            />
            <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold py-3 rounded-xl transition-colors">
              Unirse con código
            </button>
          </form>
        </section>
      </div>

      {message && (
        <p className="mt-8 p-4 bg-red-950/30 border border-red-900 text-red-400 text-center rounded-xl text-sm">
          {message}
        </p>
      )}
    </main>
  )
}
