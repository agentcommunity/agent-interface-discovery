import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { Header } from '@/components/layout/header';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3001'),
  title: 'Agent Interface Discovery - Universal AI Agent Standard',
  description:
    'DNS-based discovery protocol for AI agents. Find and connect to any agent using just a domain name.',
  keywords: ['AI', 'agents', 'discovery', 'DNS', 'protocol', 'MCP', 'A2A'],
  authors: [{ name: 'Agent Community' }],
  openGraph: {
    title: 'Agent Interface Discovery',
    description: 'Universal standard for AI agent discovery',
    images: ['/og-image.png'],
    url: 'https://aid.agentcommunity.org',
    siteName: 'Agent Interface Discovery',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agent Interface Discovery',
    description: 'Universal standard for AI agent discovery',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="flex h-screen flex-col">
          <Header />
          <main className="flex-1 min-h-0">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
