import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'

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
      <body>
        <header className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <Link href="/" className="text-red-500 font-bold text-2xl">nFactorial</Link>
              </div>
              <nav>
              <Link href="/similar-repos" className="text-gray-700 hover:text-red-500 px-3 py-2 rounded-md text-sm font-medium">Find Similar Repos</Link>
                <Link href="/" className="text-gray-700 hover:text-red-500 px-3 py-2 rounded-md text-sm font-medium">Home</Link>
                <Link href="/compare" className="text-gray-700 hover:text-red-500 px-3 py-2 rounded-md text-sm font-medium">Compare</Link>
              </nav>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  )
}