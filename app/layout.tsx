import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'Ativa Chemical — Sistema de Gestão',
  description: 'ERP/CRM para Ativa Chemical Representações — Gestão de produtos químicos industriais',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: { fontFamily: 'Inter, system-ui, sans-serif' },
          }}
        />
      </body>
    </html>
  )
}
