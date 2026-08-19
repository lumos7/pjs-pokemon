import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { MusicPlayer } from '@/components/MusicPlayer'
import { NavBar } from '@/components/NavBar'
import { BirthdayBanner } from '@/components/BirthdayBanner'
import { BirthdayDecor } from '@/components/BirthdayDecor'
import { BirthdayCelebration } from '@/components/BirthdayCelebration'
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "PJ's Pokemon",
  description: "PJ's Pokemon Adventure",
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: "PJ's Pokémon",
    statusBarStyle: 'default',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // kids constantly pinch-zoom by accident
  viewportFit: 'cover',
  themeColor: '#CC0000',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} pb-32`}>
        <NavBar />
        <BirthdayBanner />
        <BirthdayDecor />
        {children}
        <BirthdayCelebration />
        <MusicPlayer />
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
