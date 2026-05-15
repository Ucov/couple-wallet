import { login, signup } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  const { message } = await searchParams

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 h-screen max-h-screen">
      <form className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground">
        <h1 className="text-3xl font-bold text-center mb-8">CoupleWallet</h1>
        
        <label className="text-md font-semibold text-zinc-300" htmlFor="email">
          Email
        </label>
        <input
          className="rounded-md px-4 py-2 bg-zinc-900 border border-zinc-800 mb-4 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          name="email"
          placeholder="tu@email.com"
          required
        />
        
        <label className="text-md font-semibold text-zinc-300" htmlFor="password">
          Password
        </label>
        <input
          className="rounded-md px-4 py-2 bg-zinc-900 border border-zinc-800 mb-4 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          type="password"
          name="password"
          placeholder="••••••••"
          required
        />
        
        <button
          formAction={login}
          className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-md px-4 py-2 mb-2 transition-colors font-semibold"
        >
          Iniciar Sesión
        </button>
        <button
          formAction={signup}
          className="bg-zinc-800 hover:bg-zinc-700 rounded-md px-4 py-2 text-zinc-200 mb-2 transition-colors font-semibold"
        >
          Registrarse
        </button>
        
        {message && (
          <p className="mt-4 p-4 bg-zinc-900 border border-zinc-800 text-red-400 text-center rounded-md">
            {message}
          </p>
        )}
      </form>
    </div>
  )
}
