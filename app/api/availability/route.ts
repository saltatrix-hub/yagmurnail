import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, getD1, istanbulNow, validAppointmentDate } from '@/lib/booking';

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date') ?? '';
  if (!validAppointmentDate(date)) return NextResponse.json({ error: 'Geçersiz tarih.' }, { status: 400 });
  const db = getD1();
  await ensureSchema(db);
  const result = await db.prepare('SELECT slot_time FROM booking_slots WHERE appointment_date = ? ORDER BY slot_time').bind(date).all<{ slot_time: string }>();
  const now = istanbulNow();
  return NextResponse.json({ busySlots: result.results.map((row) => row.slot_time), currentDate: now.date, currentTime: now.time }, { headers: { 'Cache-Control': 'no-store' } });
}
