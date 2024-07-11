import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'nFactorial Incubator Applications',
  description: 'Application evaluation system for nFactorial Incubator',
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