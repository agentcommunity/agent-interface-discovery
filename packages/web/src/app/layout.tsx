import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { Header } from '@/components/layout/header';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '.agent Domain – DNS for Agents',
  description:
    'The open, decentralized DNS-based discovery protocol for AI agents. Register your .agent domain and connect your agent to the world.',
  metadataBase: new URL('https://www.agentcommunity.org'),
  keywords: [
    'agent domain',
    '.agent',
    'AI agents',
    'DNS',
    'discovery',
    'domain registration',
    'agent community',
    'AID',
    'MCP',
    'A2A',
  ],
  authors: [{ name: 'Agent Community' }],
  openGraph: {
    title: '.agent Domain – DNS for Agents',
    description:
      'Register your .agent domain and make your AI agent discoverable instantly. The universal standard for agent discovery.',
    url: 'https://www.agentcommunity.org',
    siteName: '.agent Domain',
    images: [
      {
        url: '/og-card.png',
        width: 1200,
        height: 630,
        alt: '.agent Domain Banner',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@agentdomainxyz',
    creator: '@agentdomainxyz',
    title: '.agent Domain – DNS for Agents',
    description:
      'Register your .agent domain and connect your agent to the world. DNS for Agents by Agent Community.',
    images: ['/og-card.png'],
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
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  other: {
    'twitter:card': 'summary_large_image',
    'twitter:site': '@agentdomainxyz',
    'twitter:creator': '@agentdomainxyz',
    'twitter:title': '.agent Domain – DNS for Agents',
    'twitter:description': 'Register your .agent domain and connect your agent to the world.',
    'twitter:image': '/og-card.png',
    'twitter:image:alt': '.agent Domain Banner',
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
        <div className="flex h-dvh flex-col">
          <Header />
          <main className="flex-1 min-h-0">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
