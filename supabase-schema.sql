-- Production booking backend starter schema (Supabase / PostgreSQL)
-- Frontend demo currently uses localStorage. Use this schema when moving to a shared online booking database.

create extension if not exists pgcrypto;

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  price_min numeric(10,2),
  price_max numeric(10,2),
  is_active boolean not null default true,
  sort_order integer not null default 0
);

create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  booking_code text unique not null,
  customer_name text not null,
  customer_phone text not null,
  note text,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  staff_id uuid references staff(id),
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled','completed','no_show')),
  created_at timestamptz not null default now()
);

create table if not exists booking_services (
  booking_id uuid references bookings(id) on delete cascade,
  service_id uuid references services(id),
  price_snapshot numeric(10,2),
  primary key (booking_id, service_id)
);

-- Recommended production logic:
-- 1) Server calculates availability from business hours + existing bookings.
-- 2) Booking creation must happen in a transaction.
-- 3) Before insert, re-check that the requested interval does not overlap an existing confirmed/pending booking.
-- 4) Never trust client-calculated price/duration as authoritative.
-- 5) Add RLS policies before exposing Supabase directly to the browser.
