import { NextRequest, NextResponse } from 'next/server';
import { ensureScheduleSchema, getD1 } from '@/lib/booking';
import { getAdminStatus } from '@/lib/admin';

type Category = 'female' | 'male';
async function requireAdmin() { return (await getAdminStatus()) === 'authorized'; }

export async function GET() {
  try {
    const db = getD1();
    await ensureScheduleSchema(db);
    const result = await db.prepare('SELECT id, name, category, active, created_at AS createdAt FROM hairdressers ORDER BY category, created_at').all<{ id: string; name: string; category: Category; active: number; createdAt: string }>();
    return NextResponse.json(result.results.map((item) => ({ ...item, active: item.active === 1 })), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Hairdresser lookup failed.', error);
    return NextResponse.json({ error: 'Kuaförler alınamadı.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Yetkisiz işlem.' }, { status: 403 });
  let input: { name?: unknown; category?: unknown };
  try { input = await request.json() as typeof input; } catch { return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 }); }
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const category = input.category === 'female' || input.category === 'male' ? input.category : null;
  if (!name || name.length > 60 || !category) return NextResponse.json({ error: 'Ad ve bölüm gereklidir.' }, { status: 400 });
  try {
    const db = getD1();
    await ensureScheduleSchema(db);
    const item = { id: crypto.randomUUID(), name, category, active: true, createdAt: new Date().toISOString() };
    await db.prepare('INSERT INTO hairdressers (id, name, category, active, created_at) VALUES (?, ?, ?, 1, ?)').bind(item.id, item.name, item.category, item.createdAt).run();
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Hairdresser creation failed.', error);
    return NextResponse.json({ error: 'Kuaför eklenemedi.' }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Yetkisiz işlem.' }, { status: 403 });
  let input: { id?: unknown; name?: unknown; category?: unknown; active?: unknown };
  try { input = await request.json() as typeof input; } catch { return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 }); }
  const id = typeof input.id === 'string' ? input.id : '';
  const name = typeof input.name === 'string' ? input.name.trim() : null;
  const category = input.category === 'female' || input.category === 'male' ? input.category : null;
  const active = typeof input.active === 'boolean' ? input.active : null;
  if (!id || (name !== null && (!name || name.length > 60))) return NextResponse.json({ error: 'Geçersiz kuaför bilgisi.' }, { status: 400 });
  try {
    const db = getD1();
    await ensureScheduleSchema(db);
    const current = await db.prepare('SELECT name, category, active FROM hairdressers WHERE id = ?').bind(id).first<{ name: string; category: Category; active: number }>();
    if (!current) return NextResponse.json({ error: 'Kuaför bulunamadı.' }, { status: 404 });
    await db.prepare('UPDATE hairdressers SET name = ?, category = ?, active = ? WHERE id = ?').bind(name ?? current.name, category ?? current.category, active === null ? current.active : active ? 1 : 0, id).run();
    return NextResponse.json({ id, name: name ?? current.name, category: category ?? current.category, active: active === null ? current.active === 1 : active });
  } catch (error) {
    console.error('Hairdresser update failed.', error);
    return NextResponse.json({ error: 'Kuaför güncellenemedi.' }, { status: 503 });
  }
}
