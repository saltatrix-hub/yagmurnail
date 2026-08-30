import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://yagmur-nail-art.saltatrix.chatgpt.site'),
  title: 'Yağmur Nail Art | Randevular',
  description: 'Yağmur Nail Art haftalık randevu programı ve müsait saatler.',
  openGraph: {
    title: 'Yağmur Nail Art | Randevular',
    description: 'Haftalık programı inceleyin, boş ve dolu saatleri görün.',
    type: 'website',
    images: [{ url: '/og.png', width: 1729, height: 910, alt: 'Yağmur Nail Art — Randevular' }]
  },
  twitter: { card: 'summary_large_image', title: 'Yağmur Nail Art | Randevular', description: 'Haftalık programı inceleyin, boş ve dolu saatleri görün.', images: ['/og.png'] },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body style={{ margin: 0, overflow: 'hidden' }}>{children}</body></html>;
}
