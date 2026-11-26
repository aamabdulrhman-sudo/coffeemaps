import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Navbar } from '@/components/layout/navbar';
import { getBaseUrl } from '@/lib/utils';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: 'CoffeeMap — Discover, Rate & Save Specialty Coffee Shops',
    template: '%s | CoffeeMap',
  },
  description:
    'Explore curated specialty coffee shops on an interactive map. Filter by WiFi, study-friendly spaces, outdoor seating, read AI review summaries, and save your favorites.',
  keywords: [
    'coffee shops',
    'specialty coffee',
    'cafe map',
    'study friendly cafes',
    'wifi cafes',
    'coffee reviews',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: getBaseUrl(),
    siteName: 'CoffeeMap',
    title: 'CoffeeMap — Discover, Rate & Save Specialty Coffee Shops',
    description:
      'Find the best specialty coffee shops near you with interactive maps, curated tags, and community reviews.',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop',
        width: 1200,
        height: 630,
        alt: 'CoffeeMap Interactive Coffee Discovery Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CoffeeMap — Discover Specialty Coffee Shops',
    description:
      'Interactive map of the best specialty coffee shops, WiFi study spots, and community reviews.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jakarta.className} min-h-screen bg-background text-foreground`}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <div className="flex-1">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
