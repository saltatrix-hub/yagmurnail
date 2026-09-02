'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import styles from './admin.module.css';

type Category = 'female' | 'male';
type Hairdresser = { id: string; name: string; category: Category; active: boolean };

export default function AdminDashboard() {
  const [items, setItems] = useState<Hairdresser[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('female');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch('/api/hairdressers', { cache: 'no-store' });
    if (response.ok) setItems(await response.json() as Hairdresser[]);
    else setMessage('Kuaför listesi alınamadı.');
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function add(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true); setMessage('');
    const response = await fetch('/api/hairdressers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, category }) });
    if (response.ok) { setName(''); await load(); } else setMessage('Kuaför eklenemedi.');
    setSaving(false);
  }

  async function update(item: Hairdresser, changes: Partial<Hairdresser>) {
    setSaving(true); setMessage('');
    const response = await fetch('/api/hairdressers', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id, ...changes }) });
    if (response.ok) await load(); else setMessage('Değişiklik kaydedilemedi.');
    setSaving(false);
  }

  return <main className={styles.page}>
    <header className={styles.header}><div><p>YÖNETİM PANELİ</p><h1>Kuaförleri yönet</h1></div><Link href="/">Siteye dön</Link></header>
    <section className={styles.panel}>
      <form className={styles.addForm} onSubmit={add}>
        <label><span>Kuaför adı</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn. Kuaför 1" maxLength={60} /></label>
        <label><span>Bölüm</span><select value={category} onChange={(e) => setCategory(e.target.value as Category)}><option value="female">Kadın Kuaförleri</option><option value="male">Erkek Kuaförleri</option></select></label>
        <button disabled={saving || !name.trim()}>Kuaför ekle</button>
      </form>
      {message && <p className={styles.message}>{message}</p>}
      <div className={styles.columns}>
        {(['female', 'male'] as const).map((group) => <section key={group} className={`${styles.group} ${styles[group]}`}>
          <h2>{group === 'female' ? 'Kadın Kuaförleri' : 'Erkek Kuaförleri'}</h2>
          <div className={styles.list}>{items.filter((item) => item.category === group).map((item) => <article className={!item.active ? styles.inactive : ''} key={item.id}>
            <input aria-label="Kuaför adı" value={item.name} onChange={(e) => setItems((current) => current.map((x) => x.id === item.id ? { ...x, name: e.target.value } : x))} onBlur={(e) => { if (e.target.value !== item.name) void update(item, { name: e.target.value }); }} />
            <div className={styles.actions}><Link href={`/admin?hairdresserId=${item.id}`}>Saatleri yönet</Link><button type="button" onClick={() => void update(item, { active: !item.active })} disabled={saving}>{item.active ? 'Gizle' : 'Yayınla'}</button></div>
          </article>)}</div>
          {items.filter((item) => item.category === group).length === 0 && <p className={styles.empty}>Henüz kuaför eklenmedi.</p>}
        </section>)}
      </div>
    </section>
  </main>;
}
