'use client'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1
        className="text-5xl sm:text-7xl font-extrabold text-[#FFCB05] mb-2"
        style={{ textShadow: '3px 3px 0 #CC0000, 6px 6px 0 rgba(0,0,0,0.1)' }}
      >
        PJ&apos;s Pokemon
      </h1>
      <p className="text-xl sm:text-2xl text-gray-700 mb-8 font-medium">
        Aziah&apos;s Pokemon Adventure!
      </p>
      <button
        onClick={() => router.push('/encounter')}
        className="bg-gradient-to-r from-[#CC0000] to-[#FF4444] text-white text-2xl font-bold rounded-full px-12 py-6 shadow-xl hover:scale-110 transition-transform min-h-[64px]"
      >
        Let&apos;s Play!
      </button>
    </main>
  )
}
