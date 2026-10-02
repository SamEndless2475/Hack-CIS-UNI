import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hack[CIS]',
  description: 'HackCIS.start({ time: "120H", prize: "S/2K" });',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="https://i.postimg.cc/PqYBWw7b/LOGO-CIS-UNI-SIN-FONDO.png" />
        <link rel="shortcut icon" href="https://i.postimg.cc/PqYBWw7b/LOGO-CIS-UNI-SIN-FONDO.png" />
        <link rel="apple-touch-icon" href="https://i.postimg.cc/PqYBWw7b/LOGO-CIS-UNI-SIN-FONDO.png" />
        <style dangerouslySetInnerHTML={{ __html: `
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        ` }} />
      </head>
      <body>
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
