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

const services = ['Manikür', 'Pedikür', 'El & Ayak Kalıcı Oje', 'Kalıcı Oje Çıkarma', 'Nail Art', 'Kaş Bıyık Alımı', 'Komple Ağda'];

type SelectedSlot = { day: number; time: string };

function slotKey(day: number, time: string) { return `${day}-${time.slice(0, 5)}`; }

export default function ScheduleScreen({ admin = false }: { admin?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const starClicks = useRef(0);
  const starResetTimer = useRef<number | null>(null);

  const loadSchedule = useCallback(async () => {
    try {
      const response = await fetch(admin ? '/api/schedule?admin=1' : '/api/schedule', { cache: 'no-store' });
      if (!response.ok) throw new Error();
      const data = await response.json() as { busySlots: string[]; notes?: Record<string, string> };
      setBusy(new Set(data.busySlots));
      setNotes(data.notes ?? {});
      setMessage('');
    } catch { setMessage('Randevu durumu şu anda alınamıyor.'); }
    finally { setLoading(false); }
  }, [admin]);

  useEffect(() => {
    void loadSchedule();
    if (admin) return;
    const interval = window.setInterval(() => void loadSchedule(), 15_000);
    return () => window.clearInterval(interval);
  }, [admin, loadSchedule]);

  useEffect(() => () => {
    if (starResetTimer.current !== null) window.clearTimeout(starResetTimer.current);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (admin) {
      video.pause();
      video.currentTime = 0;
    } else {
      void video.play().catch(() => undefined);
    }
  }, [admin]);

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

  function editSlot(day: number, time: string) {
    if (!admin || saving) return;
    const key = slotKey(day, time);
    setSelectedSlot({ day, time });
    setNoteDraft(notes[key] ?? '');
  }

  async function updateSchedule(payload: Record<string, unknown>) {
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/schedule', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error();
      await loadSchedule();
      return true;
    } catch {
      setMessage('Değişiklik kaydedilemedi. Lütfen tekrar dene.');
      return false;
    } finally { setSaving(false); }
  }

  async function saveSlot(occupied: boolean) {
    if (!selectedSlot) return;
    const saved = await updateSchedule({ scope: 'slot', day: selectedSlot.day, time: selectedSlot.time.slice(0, 5), occupied, note: occupied ? noteDraft : '' });
    if (saved) setSelectedSlot(null);
  }

  async function toggleDay(day: number) {
    if (saving) return;
    const wholeDayBusy = times.every((time) => busy.has(slotKey(day, time)));
    await updateSchedule({ scope: 'day', day, occupied: !wholeDayBusy });
  }

  async function resetSchedule() {
    if (saving || !window.confirm('Tüm saatler boş yapılsın ve yönetici notları silinsin mi?')) return;
    await updateSchedule({ scope: 'reset' });
  }

  return (
    <main className={styles.page}>
      <video ref={videoRef} className={styles.video} autoPlay={!admin} muted loop={!admin} playsInline controls={false} disablePictureInPicture preload="auto" aria-hidden="true">
        <source src="/videos/2.mp4" type="video/mp4" />
      </video>
      <div className={styles.tint} />
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>Yağmur Nail Art</Link>
        {admin ? <>
          <strong className={styles.adminBadge}>YÖNETİCİ</strong>
          <Link href="/" className={styles.backLink} aria-label="Normal siteye dön">← Siteye dön</Link>
        </> : <div className={styles.headerActions}>
          <a className={`${styles.socialButton} ${styles.whatsappButton}`} href="https://wa.me/905312937653" target="_blank" rel="noreferrer" aria-label="WhatsApp'tan iletişime geç">
            <span className={styles.socialFull}>WhatsApp</span><span className={styles.socialShort}>WA</span>
          </a>
          <a className={`${styles.socialButton} ${styles.instagramButton}`} href="https://www.instagram.com/yagm.urnail/" target="_blank" rel="noreferrer" aria-label="Instagram'da yagm.urnail hesabını aç">
            <span className={styles.socialFull}>Instagram</span><span className={styles.socialShort}>IG</span>
          </a>
          <button type="button" className={styles.starButton} onClick={openAdmin} aria-label="Yıldız">★</button>
        </div>}
      </header>
      <section className={styles.content} aria-labelledby="schedule-title">
        <div className={styles.titleRow}>
          <div><p className={styles.eyebrow}>{admin ? 'YÖNETİM PANELİ' : 'HAFTALIK PROGRAM'}</p><h1 id="schedule-title">{admin ? 'Randevuları yönet' : 'Randevular'}</h1></div>
          <div className={styles.titleActions}>
            <div className={styles.legend} aria-label="Randevu durumları"><span><i className={styles.availableDot} />Boş</span><span><i className={styles.busyDot} />Dolu</span></div>
            {admin && <button type="button" className={styles.resetButton} onClick={() => void resetSchedule()} disabled={saving}>Sıfırla</button>}
          </div>
        </div>
        {!admin && <p className={styles.services} aria-label="Hizmetlerimiz">{services.map((service) => <span key={service}>{service}</span>)}</p>}
        {admin && <p className={styles.hint}>Bir saati düzenlemek için saate dokun. Gün başlığı ilk dokunuşta tüm günü dolu, ikinci dokunuşta boş yapar.</p>}
        {message && <p className={styles.message} role="status">{message}</p>}
        <div className={`${styles.schedule} ${loading ? styles.loading : ''}`} aria-busy={loading}>
          {days.map((day) => { const wholeDayBusy = times.every((time) => busy.has(slotKey(day.id, time))); return <section className={styles.day} key={day.id} aria-label={day.name}>
            {admin
              ? <button type="button" className={`${styles.dayButton} ${wholeDayBusy ? styles.dayButtonActive : ''}`} onClick={() => void toggleDay(day.id)} disabled={saving} aria-pressed={wholeDayBusy} aria-label={`${day.name} gününün tamamını ${wholeDayBusy ? 'boş' : 'dolu'} yap`}><span className={styles.fullDay}>{day.name}</span><span className={styles.shortDay}>{day.short}</span></button>
              : <h2><span className={styles.fullDay}>{day.name}</span><span className={styles.shortDay}>{day.short}</span></h2>}
            <div className={styles.slots}>{times.map((time) => {
              const key = slotKey(day.id, time); const occupied = busy.has(key);
              const className = `${styles.slot} ${occupied ? styles.busy : styles.available}`;
              const note = notes[key];
              const label = `${day.name} ${time}, ${occupied ? 'dolu' : 'boş'}${note ? `, not: ${note}` : ''}`;
              return admin
                ? <button type="button" key={time} className={`${className} ${note ? styles.slotWithNote : ''}`} onClick={() => editSlot(day.id, time)} disabled={saving} aria-pressed={occupied} aria-label={label}><span>{time}</span><b>{occupied ? 'DOLU' : 'BOŞ'}</b>{note && <small className={styles.slotNote}>{note}</small>}</button>
                : <div className={className} key={time} aria-label={label}><span>{time}</span><b>{occupied ? 'DOLU' : 'BOŞ'}</b></div>;
            })}</div>
          </section>; })}
        </div>
      </section>
      {admin && selectedSlot && <div className={styles.modalBackdrop} role="presentation">
        <form className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="note-title" onSubmit={(event) => { event.preventDefault(); void saveSlot(true); }}>
          <button type="button" className={styles.modalClose} onClick={() => setSelectedSlot(null)} aria-label="Pencereyi kapat">×</button>
          <p className={styles.modalEyebrow}>{days.find((day) => day.id === selectedSlot.day)?.name} · {selectedSlot.time}</p>
          <h2 id="note-title">Yönetici notu</h2>
          <label htmlFor="admin-note">İsim veya not</label>
          <input id="admin-note" value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} maxLength={120} placeholder="Örn. Hayriye Kozdere" autoFocus />
          <div className={styles.modalActions}>
            <button type="button" className={styles.makeAvailableButton} onClick={() => void saveSlot(false)} disabled={saving}>Boş yap</button>
            <button type="submit" className={styles.saveBusyButton} disabled={saving}>Dolu olarak kaydet</button>
          </div>
        </form>
      </div>}
    </main>
  );
}
