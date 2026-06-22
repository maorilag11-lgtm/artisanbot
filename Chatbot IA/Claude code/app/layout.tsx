import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ArtisanBot — Votre assistant IA pour artisans',
  description: 'Qualifiez vos demandes clients, générez des devis et gérez votre planning avec l\'IA.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
