import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Onyx Nail Studio | Maslak',
  description: "Maslak'ta premium manikür, pedikür, kalıcı oje, protez tırnak ve nail art. Online randevu oluşturun.",
  openGraph: {
    title: 'Onyx Nail Studio | Maslak',
    description: 'Detaylarda kusursuzluk. Randevunuzu online oluşturun.',
    type: 'website'
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body style={{ margin: 0 }}>{children}</body></html>;
}
