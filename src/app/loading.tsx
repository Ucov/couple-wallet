export default function Loading() {
  return (
    <main className="w-full max-w-md mx-auto p-4 flex flex-col min-h-screen">
      <header className="flex justify-between items-center py-6 mb-2">
        <div>
          <div className="h-8 w-32 bg-zinc-800 rounded-md animate-pulse"></div>
          <div className="h-3 w-24 bg-zinc-800 rounded-md animate-pulse mt-2"></div>
        </div>
        <div className="h-6 w-6 bg-zinc-800 rounded-md animate-pulse"></div>
      </header>

      <div className="h-10 w-full bg-zinc-800/50 rounded-xl mb-6 animate-pulse border border-zinc-800"></div>

      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8 shadow-lg animate-pulse">
        <div className="h-4 w-32 bg-zinc-800 rounded-md mb-4"></div>
        <div className="h-6 w-48 bg-zinc-800 rounded-md"></div>
        <div className="flex justify-between mt-8">
          <div className="h-10 w-24 bg-zinc-800 rounded-md"></div>
          <div className="h-10 w-24 bg-zinc-800 rounded-md"></div>
        </div>
      </section>

      <section className="mb-8">
        <div className="h-6 w-40 bg-zinc-800 rounded-md mb-4 animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex justify-between mb-2">
                <div className="h-4 w-24 bg-zinc-800 rounded-md"></div>
                <div className="h-4 w-12 bg-zinc-800 rounded-md"></div>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2"></div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
