import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { Header } from '@/components/layout/header';
import './globals.css';
import Head from 'next/head';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Agent Identity & Discovery - the DNS forAgents',
  description: 'DNS for Agents. - Identity for the Agentic Web.',
  metadataBase: new URL('https://aid.agentcommunity.org'),
  keywords: [
    'agent domain',
    '.agent',
    'identity',
    'agent identity',
    'agent discovery',
    'agent discovery protocol',
    'agent discovery standard',
    'agent discovery protocol',
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
    title: 'Agent Identity & Discovery - the DNS forAgents',
    description: 'DNS for Agents. - Identity for the Agentic Web.',
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
    title: 'Agent Identity & Discovery - the DNS forAgents',
    description: 'DNS for Agents. - Identity for the Agentic Web.',
    images: ['https://aid.agentcommunity.org/og-card.png'], // absolute URL
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
    'twitter:site': '@agentcommunity_',
    'twitter:creator': '@agentcommunity_',
    'twitter:title': 'Agent Identity & Discovery - the DNS forAgents',
    'twitter:description': 'DNS for Agents. - Identity for the Agentic Web.',
    'twitter:image': 'https://aid.agentcommunity.org/og-card.png', // absolute URL
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
      <Head>
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@agentcommunity_" />
        <meta name="twitter:creator" content="@agentcommunity_" />
        <meta name="twitter:title" content="Agent Identity & Discovery - the DNS forAgents" />
        <meta name="twitter:description" content="DNS for Agents. - Identity for the Agentic Web." />
        <meta name="twitter:image" content="https://aid.agentcommunity.org/og-card.png" />
        <meta name="twitter:image:alt" content="Agent Identity & Discovery" />
      </Head>
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
