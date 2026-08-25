import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, getD1, istanbulNow, minutes, serviceCatalog, timeFromMinutes, validAppointmentDate } from '@/lib/booking';

type BookingInput = {
  date?: unknown;
  time?: unknown;
  serviceIds?: unknown;
  customer?: { name?: unknown; phone?: unknown; note?: unknown };
};

export async function POST(request: NextRequest) {
  let input: BookingInput;
  try { input = await request.json() as BookingInput; }
  catch { return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 }); }

  const date = typeof input.date === 'string' ? input.date : '';
  const time = typeof input.time === 'string' ? input.time : '';
  const serviceIds = Array.isArray(input.serviceIds) ? [...new Set(input.serviceIds.filter((id): id is keyof typeof serviceCatalog => typeof id === 'string' && id in serviceCatalog))] : [];
  const name = typeof input.customer?.name === 'string' ? input.customer.name.trim() : '';
  const phone = typeof input.customer?.phone === 'string' ? input.customer.phone.replace(/\s+/g, '') : '';
  const note = typeof input.customer?.note === 'string' ? input.customer.note.trim().slice(0, 500) : '';

  if (!validAppointmentDate(date) || !/^\d{2}:\d{2}$/.test(time) || !serviceIds.length) return NextResponse.json({ error: 'Randevu bilgileri geçersiz.' }, { status: 400 });
  if (name.length < 3 || name.length > 80 || !/^(?:\+?90|0)?5\d{9}$/.test(phone)) return NextResponse.json({ error: 'Ad soyad veya telefon numarası geçersiz.' }, { status: 400 });

  const start = minutes(time);
  const duration = serviceIds.reduce((total, id) => total + serviceCatalog[id].duration, 0);
  if (start < 600 || start % 30 !== 0 || start + duration > 1200) return NextResponse.json({ error: 'Seçilen saat çalışma saatlerine uygun değil.' }, { status: 400 });
  const now = istanbulNow();
  if (date === now.date && start <= minutes(now.time)) return NextResponse.json({ error: 'Geçmiş bir saat için randevu oluşturulamaz.' }, { status: 400 });

  const slots: string[] = [];
  for (let value = start; value < start + duration; value += 30) slots.push(timeFromMinutes(value));
  const id = crypto.randomUUID();
  const bookingCode = `ONX-${crypto.randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()}`;
  const createdAt = new Date().toISOString();
  const db = getD1();
  await ensureSchema(db);

  try {
    await db.batch([
      db.prepare(`INSERT INTO bookings (id, booking_code, customer_name, customer_phone, note, appointment_date, start_time, duration_minutes, service_ids, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`).bind(id, bookingCode, name, phone, note || null, date, time, duration, JSON.stringify(serviceIds), createdAt),
      ...slots.map((slot) => db.prepare('INSERT INTO booking_slots (appointment_date, slot_time, booking_id) VALUES (?, ?, ?)').bind(date, slot, id)),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/UNIQUE|constraint/i.test(message)) return NextResponse.json({ error: 'Bu saat az önce doldu. Lütfen başka bir saat seçin.' }, { status: 409 });
    throw error;
  }

  return NextResponse.json({ booking: { id: bookingCode, date, time, duration, services: serviceIds.map((serviceId) => serviceCatalog[serviceId].name) } }, { status: 201 });
}
