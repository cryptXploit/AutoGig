import './globals.css'
import { Navigation } from '../components/Navigation';
import { SettingsProvider } from './contexts/SettingsContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col">
        <SettingsProvider>
          <Navigation />
          <main className="flex-1">
            {children}
          </main>
        </SettingsProvider>
      </body>
    </html>
  )
}
