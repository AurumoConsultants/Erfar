import { Suspense } from 'react'
import Image from 'next/image'
import GateForm from './GateForm'

export default function GatePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="flex justify-center mb-6">
          <Image src="/logo.png" alt="Erfar" width={150} height={47} priority />
        </div>
        <p className="text-gray-500 text-sm mb-6">
          Den här sidan testas fortfarande och är inte färdig än. Ange lösenordet för att fortsätta.
        </p>
        <Suspense>
          <GateForm />
        </Suspense>
      </div>
    </div>
  )
}
