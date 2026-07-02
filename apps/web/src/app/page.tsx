import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700 text-white px-4">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">Erfar</h1>
        <p className="text-xl text-blue-100">
          Kunskapsbank för lärdomar från byggprojekt
        </p>
        <p className="text-blue-200 text-sm">
          Samla utmaningar och framgångar från era projekt — och sök i dem när nästa projekt planeras.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link
            href="/auth/login"
            className="px-6 py-3 bg-white text-blue-900 font-semibold rounded-lg hover:bg-blue-50 transition"
          >
            Logga in
          </Link>
          <Link
            href="/auth/signup"
            className="px-6 py-3 border border-white text-white font-semibold rounded-lg hover:bg-blue-800 transition"
          >
            Registrera
          </Link>
        </div>
      </div>
    </main>
  )
}
