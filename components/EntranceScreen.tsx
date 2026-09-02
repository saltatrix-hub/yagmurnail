'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './entrance.module.css';

type Category = 'female' | 'male';
type Hairdresser = { id: string; name: string; category: Category; active: boolean };

const sections = {
  female: { title: 'Kadın Kuaförleri', note: 'Kuaförünüzü seçin', number: '01' },
  male: { title: 'Erkek Kuaförleri', note: 'Kuaförünüzü seçin', number: '02' },
} as const;

export default function EntranceScreen() {
  const [hairdressers, setHairdressers] = useState<Hairdresser[]>([]);
  const [selected, setSelected] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/hairdressers', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : [])
      .then((data: Hairdresser[]) => setHairdressers(data.filter((item) => item.active)))
      .finally(() => setLoading(false));
  }, []);

  return <main className={styles.page}>
    <div className={styles.split}>
      {(['female', 'male'] as const).map((category) => {
        const section = sections[category];
        const open = selected === category;
        const members = hairdressers.filter((item) => item.category === category);
        return <section className={`${styles.section} ${styles[category]} ${open ? styles.open : ''} ${selected && !open ? styles.dimmed : ''}`} key={category}>
          <button className={styles.categoryButton} type="button" onClick={() => setSelected(open ? null : category)} aria-expanded={open}>
            <span className={styles.number}>{section.number}</span>
            <span className={styles.title}>{section.title}</span>
            <span className={styles.note}>{open ? 'Seçimi kapat' : section.note}</span>
            <span className={styles.circle} aria-hidden="true">{open ? '×' : '→'}</span>
          </button>
          <div className={styles.people} aria-hidden={!open}>
            {loading ? <p>Kuaförler yükleniyor…</p> : members.length ? members.map((item, index) => <Link href={`/hairdresser/${item.id}`} key={item.id} tabIndex={open ? 0 : -1}>
              <span>{String(index + 1).padStart(2, '0')}</span><strong>{item.name}</strong><i>Programı gör →</i>
            </Link>) : <p>Bu bölüm için henüz kuaför eklenmedi.</p>}
          </div>
        </section>;
      })}
    </div>
  </main>;
}
