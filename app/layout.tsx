import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { MusicPlayer } from '@/components/MusicPlayer'
import { NavBar } from '@/components/NavBar'
import { BirthdayBanner } from '@/components/BirthdayBanner'
import { BirthdayDecor } from '@/components/BirthdayDecor'
import { BirthdayCelebration } from '@/components/BirthdayCelebration'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "PJ's Pokemon",
  description: "PJ's Pokemon Adventure",
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
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
      </body>
    </html>
  )
}
