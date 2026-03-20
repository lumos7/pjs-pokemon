import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { MusicPlayer } from '@/components/MusicPlayer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "PJ's Pokemon",
  description: "Aziah's Pokemon Adventure",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <MusicPlayer />
      </body>
    </html>
  )
}
