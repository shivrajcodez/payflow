import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: { default: 'PayFlow', template: '%s | PayFlow' },
  description: 'Enterprise-grade payment gateway simulator — built for developers',
  keywords: ['payments', 'fintech', 'payment gateway', 'stripe alternative'],
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'PayFlow — Modern Payment Gateway',
    description: 'Enterprise-grade payment processing platform',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-dark-950 text-white antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
