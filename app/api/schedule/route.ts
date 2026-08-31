import { NextRequest, NextResponse } from 'next/server';
import { ensureScheduleSchema, getD1 } from '@/lib/booking';
import { getAdminStatus } from '@/lib/admin';

const slotHours = Array.from({ length: 12 }, (_, index) => `${String(index + 9).padStart(2, '0')}:00`);

function adminError(status: Awaited<ReturnType<typeof getAdminStatus>>) {
  return NextResponse.json(
    { error: status === 'anonymous' ? 'Yönetici girişi gerekli.' : 'Bu işlem için yetkiniz yok.' },
    { status: status === 'anonymous' ? 401 : 403 },
  );
}

export async function GET(request: NextRequest) {
  const includeNotes = request.nextUrl.searchParams.get('admin') === '1';
  if (includeNotes) {
    const adminStatus = await getAdminStatus();
    if (adminStatus !== 'authorized') return adminError(adminStatus);
  }

  try {
    const db = getD1(); await ensureScheduleSchema(db);
    if (includeNotes) {
      const result = await db.prepare('SELECT weekday, start_time, occupied, admin_note FROM schedule_slots ORDER BY weekday, start_time').all<{ weekday: number; start_time: string; occupied: number; admin_note: string | null }>();
      return NextResponse.json({
        busySlots: result.results.filter((slot) => slot.occupied === 1).map((slot) => `${slot.weekday}-${slot.start_time}`),
        notes: Object.fromEntries(result.results.filter((slot) => slot.admin_note).map((slot) => [`${slot.weekday}-${slot.start_time}`, slot.admin_note])),
      }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const result = await db.prepare('SELECT weekday, start_time FROM schedule_slots WHERE occupied = 1 ORDER BY weekday, start_time').all<{ weekday: number; start_time: string }>();
    return NextResponse.json({ busySlots: result.results.map((slot) => `${slot.weekday}-${slot.start_time}`) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Schedule lookup failed.', error);
    return NextResponse.json({ error: 'Program alınamadı.' }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  const adminStatus = await getAdminStatus();
  if (adminStatus !== 'authorized') return adminError(adminStatus);

  let input: { scope?: unknown; day?: unknown; time?: unknown; occupied?: unknown; note?: unknown };
  try { input = await request.json() as typeof input; } catch { return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 }); }
  const scope = input.scope === 'day' || input.scope === 'reset' ? input.scope : 'slot';

  try {
    const db = getD1(); await ensureScheduleSchema(db);
    const updatedAt = new Date().toISOString();

    if (scope === 'reset') {
      await db.prepare('UPDATE schedule_slots SET occupied = 0, admin_note = NULL, updated_at = ?').bind(updatedAt).run();
      return NextResponse.json({ reset: true });
    }

    const day = Number(input.day);
    if (!Number.isInteger(day) || day < 1 || day > 7) return NextResponse.json({ error: 'Geçersiz gün bilgisi.' }, { status: 400 });

    if (scope === 'day') {
      await db.batch(slotHours.map((time) => db.prepare(`INSERT INTO schedule_slots (weekday, start_time, occupied, admin_note, updated_at) VALUES (?, ?, 1, NULL, ?) ON CONFLICT(weekday, start_time) DO UPDATE SET occupied = 1, updated_at = excluded.updated_at`).bind(day, time, updatedAt)));
      return NextResponse.json({ day, occupied: true });
    }

    const time = typeof input.time === 'string' ? input.time : '';
    const hour = Number(time.slice(0, 2));
    const occupied = input.occupied;
    const note = typeof input.note === 'string' ? input.note.trim() : '';
    if (!/^\d{2}:00$/.test(time) || hour < 9 || hour > 20 || typeof occupied !== 'boolean' || note.length > 120) return NextResponse.json({ error: 'Geçersiz saat veya not bilgisi.' }, { status: 400 });
    const savedNote = occupied && note ? note : null;
    await db.prepare(`INSERT INTO schedule_slots (weekday, start_time, occupied, admin_note, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(weekday, start_time) DO UPDATE SET occupied = excluded.occupied, admin_note = excluded.admin_note, updated_at = excluded.updated_at`).bind(day, time, occupied ? 1 : 0, savedNote, updatedAt).run();
    return NextResponse.json({ day, time, occupied, note: savedNote });
  } catch (error) {
    console.error('Schedule update failed.', error);
    return NextResponse.json({ error: 'Değişiklik kaydedilemedi.' }, { status: 503 });
  }
}
