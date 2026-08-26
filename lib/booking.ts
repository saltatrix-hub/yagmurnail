import { env } from 'cloudflare:workers';

export const serviceCatalog = {
  manikur: { name: 'Manikür', duration: 45 },
  pedikur: { name: 'Pedikür', duration: 60 },
  'kalici-el': { name: 'Kalıcı Oje · El', duration: 75 },
  'kalici-ayak': { name: 'Kalıcı Oje · Ayak', duration: 75 },
  jel: { name: 'Jel Güçlendirme', duration: 90 },
  protez: { name: 'Protez Tırnak', duration: 120 },
  'kalici-cikarma': { name: 'Kalıcı Oje Çıkarma', duration: 30 },
  'protez-cikarma': { name: 'Protez Tırnak Çıkartma', duration: 45 },
  'nail-art': { name: 'Nail Art', duration: 30 },
} as const;

export function getD1() {
  if (!env.DB) throw new Error('Randevu veritabanı kullanılamıyor.');
  return env.DB;
}

export async function ensureSchema(db: D1Database) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      booking_code TEXT NOT NULL UNIQUE,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      note TEXT,
      appointment_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      service_ids TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS booking_slots (
      appointment_date TEXT NOT NULL,
      slot_time TEXT NOT NULL,
      booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      PRIMARY KEY (appointment_date, slot_time)
    )`),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_bookings_appointment_date ON bookings(appointment_date)'),
  ]);
}

export function istanbulNow() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { date: `${value.year}-${value.month}-${value.day}`, time: `${value.hour}:${value.minute}` };
}

export function minutes(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

export function timeFromMinutes(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

export function validAppointmentDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));
  if (calendarDate.getUTCFullYear() !== year || calendarDate.getUTCMonth() !== month - 1 || calendarDate.getUTCDate() !== day) return false;
  const date = new Date(`${value}T12:00:00+03:00`);
  if (Number.isNaN(date.getTime()) || date.getDay() === 0) return false;
  const now = istanbulNow();
  const max = new Date(`${now.date}T12:00:00+03:00`);
  max.setDate(max.getDate() + 60);
  return value >= now.date && value <= max.toISOString().slice(0, 10);
}
