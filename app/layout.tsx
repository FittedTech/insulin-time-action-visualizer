import './globals.css'
import { Analytics } from '@vercel/analytics/react'
import type { Metadata } from 'next'

/**
 * Metadata for the Insulin Decay Tool application.
 * Optimized for SEO with the domain insulin-time-action.projects.fittedtech.com
 */
export const metadata: Metadata = {
  title: 'Insulin Time-Action Visualizer | Fitted Tech',
  description:
    'Interactive tool for visualizing and creating insulin time-action decay curves. Create percentage of dose mappings for rapid, short, intermediate, and long-acting insulin types. Desktop-optimized medical visualization tool.',
  keywords: [
    'insulin',
    'time-action',
    'decay curve',
    'insulin visualization',
    'medical tool',
    'diabetes',
    'insulin mapping',
    'dose calculation',
    'Fitted Tech',
  ],
  authors: [{ name: 'Fitted Tech' }],
  creator: 'Fitted Tech',
  publisher: 'Fitted Tech',
  metadataBase: new URL('https://insulin-time-action.projects.fittedtech.com'),
  alternates: {
    canonical: '/',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'Insulin Time-Action Visualizer | Fitted Tech',
    description:
      'Interactive tool for visualizing and creating insulin time-action decay curves. Create percentage of dose mappings for various insulin types.',
    url: 'https://insulin-time-action.projects.fittedtech.com',
    siteName: 'Fitted Tech Projects',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Insulin Time-Action Visualizer | Fitted Tech',
    description:
      'Interactive tool for visualizing and creating insulin time-action decay curves.',
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
  verification: {
    // Add verification codes here if needed
  },
}

/**
 * Root layout component for the Next.js application.
 * 
 * Provides the HTML structure and applies global styles.
 * 
 * @param props - Layout props containing children
 * @param props.children - Child components to render
 * @returns The root layout JSX
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}

