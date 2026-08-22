'use client';
import Link from 'next/link';
import { useSettings } from '../app/contexts/SettingsContext';

export function Navigation() {
  const { t } = useSettings();
  
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-8 h-14 flex items-center justify-between">
        <Link href="/" className="font-black text-3xl tracking-tighter text-blue-300">AutoGig</Link>
        <div className="flex space-x-6 text-sm font-semibold text-slate-600">
          <Link href="/" className="hover:text-blue-600 transition">{t('commandCenter')}</Link>
          <Link href="/inbox" className="hover:text-blue-600 transition">{t('inbox')}</Link>
          <Link href="/profile" className="hover:text-blue-600 transition">{t('profile')}</Link>
          <Link href="/settings" className="hover:text-blue-600 transition">{t('settings')}</Link>
          <Link href="/evidence" className="hover:text-blue-600 transition">{t('evidence')}</Link>
          <Link href="/runs" className="hover:text-blue-600 transition">{t('runs')}</Link>
        </div>
      </div>
    </nav>
  );
}
