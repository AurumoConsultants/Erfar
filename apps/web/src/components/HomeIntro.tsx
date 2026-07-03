'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export function HomeIntro() {
  const [showForm, setShowForm] = useState(false)
  const [muted, setMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  const unmute = () => {
    if (videoRef.current) {
      videoRef.current.muted = false
    }
    setMuted(false)
  }

  if (!showForm) {
    return (
      <main className="relative w-screen h-screen bg-black">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          src="/videos/erfar-intro.mp4"
          autoPlay
          muted={muted}
          playsInline
          onEnded={() => setShowForm(true)}
        />
        {muted && (
          <button
            onClick={unmute}
            className="absolute bottom-6 left-6 px-4 py-2 bg-white/90 text-blue-900 text-sm font-semibold rounded-lg hover:bg-white transition"
          >
            🔊 Slå på ljud
          </button>
        )}
        <button
          onClick={() => setShowForm(true)}
          className="absolute bottom-6 right-6 px-4 py-2 bg-white/90 text-blue-900 text-sm font-semibold rounded-lg hover:bg-white transition"
        >
          Hoppa över
        </button>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700 text-white px-4">
      <div className="max-w-2xl text-center space-y-6">
        <div className="inline-block bg-white rounded-2xl px-8 py-6">
          <Image src="/logo.png" alt="Erfar" width={340} height={107} priority />
        </div>
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
