import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://onyx-nail-studio.saltatrix.chatgpt.site'),
  title: 'Onyx Nail Studio | Maslak',
  description: "Maslak'ta premium manikür, pedikür, kalıcı oje, protez tırnak ve nail art. Online randevu oluşturun.",
  openGraph: {
    title: 'Onyx Nail Studio | Maslak',
    description: 'Detaylarda kusursuzluk. Randevunuzu online oluşturun.',
    type: 'website',
    images: [{ url: '/og.png', width: 1729, height: 910, alt: 'Onyx Nail Studio — Detaylarda kusursuzluk' }]
  },
  twitter: { card: 'summary_large_image', images: ['/og.png'] }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body style={{ margin: 0 }}>{children}</body></html>;
}
