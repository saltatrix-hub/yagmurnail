import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kuaför Randevuları',
  description: 'Kadın ve erkek kuaförleri için haftalık randevu programı.',
  openGraph: {
    title: 'Kuaför Randevuları',
    description: 'Kuaförünüzü seçin; Pazartesi–Pazar programını inceleyin.',
    type: 'website',
  },
  twitter: { card: 'summary', title: 'Kuaför Randevuları', description: 'Kuaförünüzü seçin ve haftalık programı görün.' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body style={{ margin: 0 }}>{children}</body></html>;
}
