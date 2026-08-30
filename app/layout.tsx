import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://yagmur-nail-art.saltatrix.chatgpt.site'),
  title: 'Yağmur Nail Art | Randevular',
  description: 'Yağmur Nail Art haftalık randevu programı ve müsait saatler.',
  openGraph: {
    title: 'Yağmur Nail Art | Randevular',
    description: 'Haftalık programı inceleyin, boş ve dolu saatleri görün.',
    type: 'website',
  },
  twitter: { card: 'summary', title: 'Yağmur Nail Art | Randevular', description: 'Haftalık programı inceleyin, boş ve dolu saatleri görün.' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body style={{ margin: 0, overflow: 'hidden' }}>{children}</body></html>;
}
