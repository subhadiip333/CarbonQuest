import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CarbonQuest AI | Enterprise AI Sustainability Coach',
  description: 'Reduces your daily carbon footprint through conversational coaching, route optimization, and gamification.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="bg-black text-zinc-100">
      <body className={`${inter.className} min-h-screen bg-black`}>
        {children}
      </body>
    </html>
  )
}
