import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { Header } from '@/components/layout/header';
import './globals.css';
import Head from 'next/head';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Agent Interface Discovery - the DNS forAgents',
  description:
    'The open, decentralized DNS-based discovery protocol for AI agents. Register your .agent domain and connect your agent to the world.',
  metadataBase: new URL('https://aid.agentcommunity.org'),
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
    title: 'Agent Interface Discovery - the DNS forAgents',
    description: 'Agent Interface Discovery -  the universal standard for agent discovery.',
    url: 'https://aid.agentcommunity.org',
    siteName: '.agent Domain',
    images: [
      {
        url: '/og-card.png',
        width: 1200,
        height: 630,
        alt: '_agent Interface Discovery',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@agentcommunity_',
    creator: '@agentcommunity_',
    title: 'Agent Interface Discovery - the DNS forAgents',
    description: 'DNS for Agents by Agent Community.',
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
    'twitter:title': 'Agent Interface Discovery - the DNS forAgents',
    'twitter:description': 'Decentralized DNS based agent discovery protocol.',
    'twitter:image': 'https://aid.agentcommunity.org/og-card.png', // absolute URL
    'twitter:image:alt': '_agent banner',
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
        <meta name="twitter:title" content="Agent Interface Discovery - the DNS forAgents" />
        <meta name="twitter:description" content="DNS for Agents by Agent Community." />
        <meta name="twitter:image" content="https://aid.agentcommunity.org/og-card.png" />
        <meta name="twitter:image:alt" content="_agent banner" />
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
