import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { MusicPlayer } from '@/components/MusicPlayer'
import { NavBar } from '@/components/NavBar'

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
        {children}
        <MusicPlayer />
      </body>
    </html>
  )
}
