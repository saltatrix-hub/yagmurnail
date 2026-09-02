import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const hairdressers = sqliteTable('hairdressers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(), // 'female' or 'male'
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
});

export const bookings = sqliteTable('bookings', {
  id: text('id').primaryKey(),
  bookingCode: text('booking_code').notNull().unique(),
  hairdresserId: text('hairdresser_id').notNull(),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  note: text('note'),
  appointmentDate: text('appointment_date').notNull(),
  startTime: text('start_time').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  serviceIds: text('service_ids').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: text('created_at').notNull(),
});

export const bookingSlots = sqliteTable('booking_slots', {
  appointmentDate: text('appointment_date').notNull(),
  slotTime: text('slot_time').notNull(),
  bookingId: text('booking_id').notNull().references(() => bookings.id, { onDelete: 'cascade' }),
}, (table) => [primaryKey({ columns: [table.appointmentDate, table.slotTime] })]);

export const scheduleSlots = sqliteTable('schedule_slots', {
  hairdresserId: text('hairdresser_id').notNull(),
  weekday: integer('weekday').notNull(),
  startTime: text('start_time').notNull(),
  occupied: integer('occupied', { mode: 'boolean' }).notNull().default(false),
  adminNote: text('admin_note'),
  updatedAt: text('updated_at').notNull(),
}, (table) => [primaryKey({ columns: [table.hairdresserId, table.weekday, table.startTime] })]);
