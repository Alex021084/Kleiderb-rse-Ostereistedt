-- V66: Vollständige Verkäufer-/Kundendaten dauerhaft in der Cloud speichern.
alter table public.sellers add column if not exists salutation text not null default 'Frau';
alter table public.sellers add column if not exists address text not null default '';
alter table public.sellers add column if not exists street text not null default '';
alter table public.sellers add column if not exists house_number text not null default '';
alter table public.sellers add column if not exists zip text not null default '';
alter table public.sellers add column if not exists city text not null default '';
alter table public.sellers add column if not exists email text not null default '';
alter table public.sellers add column if not exists payout_method text not null default 'Bar';
