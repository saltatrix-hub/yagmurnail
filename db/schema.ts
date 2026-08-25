import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const bookings = sqliteTable('bookings', {
  id: text('id').primaryKey(),
  bookingCode: text('booking_code').notNull().unique(),
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
