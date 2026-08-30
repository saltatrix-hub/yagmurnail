import { NextRequest, NextResponse } from 'next/server';
import { ensureScheduleSchema, getD1 } from '@/lib/booking';
import { getAdminStatus } from '@/lib/admin';

export async function GET() {
  try {
    const db = getD1(); await ensureScheduleSchema(db);
    const result = await db.prepare('SELECT weekday, start_time FROM schedule_slots WHERE occupied = 1 ORDER BY weekday, start_time').all<{ weekday: number; start_time: string }>();
    return NextResponse.json({ busySlots: result.results.map((slot) => `${slot.weekday}-${slot.start_time}`) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Schedule lookup failed.', error);
    return NextResponse.json({ error: 'Program alınamadı.' }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  const adminStatus = await getAdminStatus();
  if (adminStatus !== 'authorized') {
    return NextResponse.json(
      { error: adminStatus === 'anonymous' ? 'Yönetici girişi gerekli.' : 'Bu işlem için yetkiniz yok.' },
      { status: adminStatus === 'anonymous' ? 401 : 403 },
    );
  }

  let input: { day?: unknown; time?: unknown; occupied?: unknown };
  try { input = await request.json() as typeof input; } catch { return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 }); }
  const day = Number(input.day); const time = typeof input.time === 'string' ? input.time : ''; const occupied = input.occupied; const hour = Number(time.slice(0, 2));
  if (!Number.isInteger(day) || day < 1 || day > 7 || !/^\d{2}:00$/.test(time) || hour < 9 || hour > 20 || typeof occupied !== 'boolean') return NextResponse.json({ error: 'Geçersiz saat bilgisi.' }, { status: 400 });
  try {
    const db = getD1(); await ensureScheduleSchema(db);
    await db.prepare(`INSERT INTO schedule_slots (weekday, start_time, occupied, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(weekday, start_time) DO UPDATE SET occupied = excluded.occupied, updated_at = excluded.updated_at`).bind(day, time, occupied ? 1 : 0, new Date().toISOString()).run();
    return NextResponse.json({ day, time, occupied });
  } catch (error) {
    console.error('Schedule update failed.', error);
    return NextResponse.json({ error: 'Değişiklik kaydedilemedi.' }, { status: 503 });
  }
}
