import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LeanReserve - Restaurant Booking Engine',
  description: 'Headless restaurant booking engine using resource buckets',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}