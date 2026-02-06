import type { Metadata, Viewport } from 'next';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { Toaster } from 'sonner';
import { Header } from '@/components/layout/header';
import './globals.css';

const geistSans = GeistSans;
const geistMono = GeistMono;

export const metadata: Metadata = {
  title: 'Agent Identity & Discovery — DNS for Agents',
  description: 'DNS-first agent discovery and identity for the agentic web.',
  metadataBase: new URL('https://aid.agentcommunity.org'),
  keywords: [
    'agent domain',
    '.agent',
    'identity',
    'agent identity',
    'agent discovery',
    'agent discovery protocol',
    'agent discovery standard',
    'endpoint identity',
    'agent standard',
    'agent community',
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
    title: 'Agent Identity & Discovery — DNS for Agents',
    description: 'DNS-first agent discovery and identity for the agentic web.',
    url: 'https://aid.agentcommunity.org',
    siteName: '_agent Identity & Discovery',
    images: [
      {
        url: '/og-card.png',
        width: 1200,
        height: 630,
        alt: 'Agent Identity & Discovery',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@agentcommunity_',
    creator: '@agentcommunity_',
    title: 'Agent Identity & Discovery - DNS for Agents',
    description: 'DNS for Agents. - Identity for the Agentic Web.',
    images: ['https://aid.agentcommunity.org/og-card.png'],
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
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
  other: {
    'twitter:site': '@agentcommunity_',
    'twitter:creator': '@agentcommunity_',
    'twitter:title': 'Agent Identity & Discovery - DNS for Agents',
    'twitter:description': 'DNS for Agents. - Identity for the Agentic Web.',
    'twitter:image': 'https://aid.agentcommunity.org/og-card.png',
    'twitter:image:alt': 'Agent Identity & Discovery',
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
      <body
        className={`${geistSans.className} ${geistMono.variable} min-h-dvh bg-background text-foreground antialiased`}
      >
        <div className="flex h-dvh flex-col overflow-hidden">
          <Header />
          <main className="flex-1 min-h-0 overflow-y-auto">{children}</main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
