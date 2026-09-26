import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ShoppingBag, ShieldCheck, QrCode, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Stokvel Collective | Bulk Buying FMCG Platform',
  description: 'Township bulk-buying platform enabling communities to pool purchasing power for fast-moving consumer goods directly from wholesale distributors.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight text-slate-900 block leading-tight">
                  Stokvel <span className="text-emerald-600">Collective</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-600 block">
                  Township Bulk Buying
                </span>
              </div>
            </Link>

            <nav className="flex items-center space-x-1 sm:space-x-4 text-sm font-medium">
              <Link
                href="/"
                className="px-3 py-2 text-slate-700 hover:text-emerald-600 hover:bg-slate-50 rounded-lg transition"
              >
                Pools
              </Link>
              <Link
                href="/manager/redeem"
                className="flex items-center space-x-1.5 px-3 py-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
              >
                <QrCode className="w-4 h-4" />
                <span>Hub Redemption</span>
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
          {children}
        </main>

        {/* Low-Bandwidth Footer */}
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-600">
          <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center space-x-1 text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
              <span>Escrow Protected • Verified Township Wholesalers</span>
            </div>
            <p>© {new Date().getFullYear()} Stokvel Collective. Fast, secure FMCG pooling.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
