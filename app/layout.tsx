import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/firebase/authContext';
import { AppHeader } from '@/components/common/AppHeader';
import { MobileBottomNav } from '@/components/common/MobileBottomNav';
import { PWAInstallPrompt } from '@/components/common/PWAInstallPrompt';

export const metadata: Metadata = {
  title: 'Travel BZAR | Premium Cab Service in Dhanbad',
  description:
    'Premium cab service in Dhanbad with safe, reliable and comfortable local and airport transportation to Ranchi, Deoghar, and Durgapur airports.',
  applicationName: 'Travel BZAR',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
  keywords: [
    'Travel Bzar',
    'Dhanbad cab service',
    'Ranchi airport taxi',
    'Deoghar airport cab',
    'Durgapur airport cab',
    'luxury cab Dhanbad',
    'premium taxi Dhanbad',
  ],
  authors: [{ name: 'Travel BZAR' }],
};

export const viewport: Viewport = {
  themeColor: '#061B33',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen bg-[#F5F7F5] text-[#132238] flex flex-col antialiased">
        <AuthProvider>
          <AppHeader />
          <main className="flex-1 pb-16 sm:pb-0">{children}</main>
          <MobileBottomNav />
          <PWAInstallPrompt />
        </AuthProvider>
      </body>
    </html>
  );
}
