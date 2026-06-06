import type { Metadata } from 'next'
import { DM_Sans, Lora } from 'next/font/google'
import Nav from '@/components/layout/Nav'
import './globals.css'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' })
const lora = Lora({ subsets: ['latin'], variable: '--font-lora', display: 'swap' })

export const metadata: Metadata = {
  title: "Capability Navigator — Discover what you're capable of becoming",
  description: "Upload your CV, answer a few questions, and receive an AI-generated capability profile with career pathways and transition steps.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${lora.variable}`}>
      <body className="min-h-screen font-sans antialiased" style={{ background: '#F8F6F1', color: '#2D2926' }}>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  )
}
