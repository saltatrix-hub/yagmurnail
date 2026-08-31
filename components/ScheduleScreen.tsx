'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './schedule.module.css';

const days = [
  { id: 1, name: 'Pazartesi', short: 'Pzt' }, { id: 2, name: 'Salı', short: 'Sal' },
  { id: 3, name: 'Çarşamba', short: 'Çar' }, { id: 4, name: 'Perşembe', short: 'Per' },
  { id: 5, name: 'Cuma', short: 'Cum' }, { id: 6, name: 'Cumartesi', short: 'Cmt' },
  { id: 7, name: 'Pazar', short: 'Paz' },
] as const;

const times = Array.from({ length: 12 }, (_, index) => {
  const start = index + 9;
  return `${String(start).padStart(2, '0')}:00–${String(start + 1).padStart(2, '0')}:00`;
});

function slotKey(day: number, time: string) { return `${day}-${time.slice(0, 5)}`; }

export default function ScheduleScreen({ admin = false }: { admin?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const starClicks = useRef(0);
  const starResetTimer = useRef<number | null>(null);

  const loadSchedule = useCallback(async () => {
    try {
      const response = await fetch('/api/schedule', { cache: 'no-store' });
      if (!response.ok) throw new Error();
      const data = await response.json() as { busySlots: string[] };
      setBusy(new Set(data.busySlots));
      setMessage('');
    } catch { setMessage('Randevu durumu şu anda alınamıyor.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void loadSchedule();
    if (admin) return;
    const interval = window.setInterval(() => void loadSchedule(), 15_000);
    return () => window.clearInterval(interval);
  }, [admin, loadSchedule]);

  useEffect(() => () => {
    if (starResetTimer.current !== null) window.clearTimeout(starResetTimer.current);
  }, []);

  function openAdmin() {
    starClicks.current += 1;
    if (starResetTimer.current !== null) window.clearTimeout(starResetTimer.current);
    if (starClicks.current >= 5) {
      starClicks.current = 0;
      router.push('/admin');
      return;
    }
    starResetTimer.current = window.setTimeout(() => { starClicks.current = 0; }, 4_000);
  }

  async function toggle(day: number, time: string) {
    if (!admin || saving) return;
    const key = slotKey(day, time);
    const occupied = !busy.has(key);
    setSaving(true);
    setMessage('');
    setBusy((current) => { const next = new Set(current); occupied ? next.add(key) : next.delete(key); return next; });
    try {
      const response = await fetch('/api/schedule', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day, time: time.slice(0, 5), occupied }),
      });
      if (!response.ok) throw new Error();
    } catch {
      setBusy((current) => { const next = new Set(current); occupied ? next.delete(key) : next.add(key); return next; });
      setMessage('Değişiklik kaydedilemedi. Lütfen tekrar dene.');
    } finally { setSaving(false); }
  }

  return (
    <main className={styles.page}>
      <video className={styles.video} autoPlay muted loop playsInline preload="auto" aria-hidden="true">
        <source src="/videos/2.mp4" type="video/mp4" />
      </video>
      <div className={styles.tint} />
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>Yağmur Nail Art</Link>
        {admin ? <>
          <strong className={styles.adminBadge}>YÖNETİCİ</strong>
          <Link href="/" className={styles.backLink} aria-label="Normal siteye dön">← Geri</Link>
        </> : <button type="button" className={styles.starButton} onClick={openAdmin} aria-label="Yıldız">★</button>}
      </header>
      <section className={styles.content} aria-labelledby="schedule-title">
        <div className={styles.titleRow}>
          <div><p className={styles.eyebrow}>{admin ? 'YÖNETİM PANELİ' : 'HAFTALIK PROGRAM'}</p><h1 id="schedule-title">{admin ? 'Randevuları yönet' : 'Randevular'}</h1></div>
          <div className={styles.legend} aria-label="Randevu durumları"><span><i className={styles.availableDot} />Boş</span><span><i className={styles.busyDot} />Dolu</span></div>
        </div>
        {admin && <p className={styles.hint}>Dolu veya boş yapmak istediğin saate dokun.</p>}
        {message && <p className={styles.message} role="status">{message}</p>}
        <div className={`${styles.schedule} ${loading ? styles.loading : ''}`} aria-busy={loading}>
          {days.map((day) => <section className={styles.day} key={day.id} aria-label={day.name}>
            <h2><span className={styles.fullDay}>{day.name}</span><span className={styles.shortDay}>{day.short}</span></h2>
            <div className={styles.slots}>{times.map((time) => {
              const key = slotKey(day.id, time); const occupied = busy.has(key);
              const className = `${styles.slot} ${occupied ? styles.busy : styles.available}`;
              const label = `${day.name} ${time}, ${occupied ? 'dolu' : 'boş'}`;
              return admin
                ? <button type="button" key={time} className={className} onClick={() => void toggle(day.id, time)} disabled={saving} aria-pressed={occupied} aria-label={label}><span>{time}</span><b>{occupied ? 'DOLU' : 'BOŞ'}</b></button>
                : <div className={className} key={time} aria-label={label}><span>{time}</span><b>{occupied ? 'DOLU' : 'BOŞ'}</b></div>;
            })}</div>
          </section>)}
        </div>
      </section>
    </main>
  );
}
