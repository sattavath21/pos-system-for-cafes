import type { Metadata } from 'next'
import { Geist, Geist_Mono, Noto_Sans_Lao } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { ShiftProvider } from '@/components/shift-provider'
import { ClientLayout } from '@/components/client-layout'
import { SidebarProvider } from '@/components/sidebar-provider'
import { LanguageProvider } from '@/components/language-provider'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

const notoLaos = Noto_Sans_Lao({
  subsets: ["lao"],
  weight: ["400", "700"],
  variable: '--font-laos',
  display: 'swap',

});

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={notoLaos.className}>
        <LanguageProvider>
          <ShiftProvider>
            <SidebarProvider>
              <ClientLayout>
                {children}
              </ClientLayout>
            </SidebarProvider>
          </ShiftProvider>
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  )
}
