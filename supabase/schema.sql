-- =====================================================================
-- TABIIY FAN PLATFORMASI — Supabase ma'lumotlar bazasi sxemasi
-- Supabase → SQL Editor → New query → ushbu faylni to'liq joylab, Run bosing.
-- Fayl qayta ishga tushirilsa ham xavfsiz (idempotent).
-- Hech qanday demo ma'lumot qo'shilmaydi.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Adminlar
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Joriy foydalanuvchi admin ekanini tekshiradi.
-- SECURITY DEFINER: admins jadvalining o'z RLS qoidalarini aylanib o'tib tekshiradi.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- updated_at ustunini avtomatik yangilash
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  if new.status = 'published' then
    if tg_op = 'INSERT' then
      new.published_at = now();
    elsif old.status is distinct from 'published' then
      new.published_at = now();
    end if;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. Dars mavzulari (faqat 5- va 6-sinf, yagona "Tabiiy fan" fani)
-- ---------------------------------------------------------------------
create table if not exists public.topics (
  id           uuid primary key default gen_random_uuid(),
  grade        smallint not null check (grade in (5, 6)),
  title        text not null check (char_length(title) between 1 and 300),
  translations jsonb not null default '{}'::jsonb,  -- {"ru":{"title":"..."},"en":{"title":"..."}}
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists topics_grade_idx on public.topics (grade, sort_order);

-- ---------------------------------------------------------------------
-- 3. Fayl asosidagi materiallar
--    type: lesson_plan | video | slide | handout | library
-- ---------------------------------------------------------------------
create table if not exists public.materials (
  id           uuid primary key default gen_random_uuid(),
  type         text not null check (type in ('lesson_plan', 'video', 'slide', 'handout', 'library')),
  category     text,                                 -- masalan: worksheet, textbook, methodical ...
  title        text not null check (char_length(title) between 1 and 300),
  description  text,
  translations jsonb not null default '{}'::jsonb,   -- {"ru":{"title":"","description":""},"en":{...}}
  grade        smallint not null check (grade in (5, 6)),
  topic_id     uuid references public.topics (id) on delete set null,
  file_path    text,                                 -- Storage ichidagi yo'l
  file_name    text,
  file_size    bigint,
  file_mime    text,
  external_url text,                                 -- YouTube yoki tashqi fayl havolasi
  cover_path   text,
  status       text not null default 'draft' check (status in ('draft', 'published')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  published_at timestamptz
);
create index if not exists materials_type_idx on public.materials (type, status, grade);
create index if not exists materials_topic_idx on public.materials (topic_id);

drop trigger if exists materials_touch on public.materials;
create trigger materials_touch before insert or update on public.materials
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- 4. Interaktiv animatsiyalar (HTML/CSS/JS, sandbox iframe ichida ishlaydi)
-- ---------------------------------------------------------------------
create table if not exists public.animations (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (char_length(title) between 1 and 300),
  description  text,
  translations jsonb not null default '{}'::jsonb,
  grade        smallint check (grade in (5, 6)),
  topic_id     uuid references public.topics (id) on delete set null,
  html         text not null default '',
  css          text not null default '',
  js           text not null default '',
  cover_path   text,
  is_template  boolean not null default false,       -- shablonlar faqat admin uchun ko'rinadi
  status       text not null default 'draft' check (status in ('draft', 'published')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  published_at timestamptz
);
create index if not exists animations_idx on public.animations (status, grade);

drop trigger if exists animations_touch on public.animations;
create trigger animations_touch before insert or update on public.animations
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- 5. Test va mustahkamlash topshiriqlari
--    questions: [{"question":"","options":["",""],"correct":0,"explanation":""}]
-- ---------------------------------------------------------------------
create table if not exists public.tests (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (char_length(title) between 1 and 300),
  description  text,
  translations jsonb not null default '{}'::jsonb,
  grade        smallint not null check (grade in (5, 6)),
  topic_id     uuid references public.topics (id) on delete set null,
  questions    jsonb not null default '[]'::jsonb check (jsonb_typeof(questions) = 'array'),
  file_path    text,                                  -- ixtiyoriy: tarqatma topshiriq fayli
  file_name    text,
  file_size    bigint,
  file_mime    text,
  status       text not null default 'draft' check (status in ('draft', 'published')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  published_at timestamptz
);
create index if not exists tests_idx on public.tests (status, grade);

drop trigger if exists tests_touch on public.tests;
create trigger tests_touch before insert or update on public.tests
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- 6. Sayt sozlamalari (bitta qator)
-- ---------------------------------------------------------------------
create table if not exists public.site_settings (
  id         integer primary key default 1 check (id = 1),
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id, data) values (1, '{}'::jsonb)
  on conflict (id) do nothing;

-- =====================================================================
-- ROW LEVEL SECURITY
-- Ommaviy foydalanuvchilar: faqat nashr qilingan materiallarni o'qiydi.
-- Adminlar (public.admins jadvalida bor foydalanuvchilar): to'liq huquq.
-- =====================================================================
-- Jadval darajasidagi ruxsatlar (haqiqiy cheklov quyidagi RLS qoidalarida)
grant select on public.topics, public.materials, public.animations, public.tests, public.site_settings
  to anon, authenticated;
grant insert, update, delete on public.topics, public.materials, public.animations, public.tests
  to authenticated;
grant update on public.site_settings to authenticated;
grant select on public.admins to authenticated;

alter table public.admins        enable row level security;
alter table public.topics        enable row level security;
alter table public.materials     enable row level security;
alter table public.animations    enable row level security;
alter table public.tests         enable row level security;
alter table public.site_settings enable row level security;

-- admins: foydalanuvchi faqat o'z yozuvini ko'ra oladi; yozish faqat SQL Editor orqali.
drop policy if exists "admins_self_read" on public.admins;
create policy "admins_self_read" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- topics
drop policy if exists "topics_public_read" on public.topics;
create policy "topics_public_read" on public.topics
  for select to anon, authenticated using (true);
drop policy if exists "topics_admin_write" on public.topics;
create policy "topics_admin_write" on public.topics
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- materials
drop policy if exists "materials_public_read" on public.materials;
create policy "materials_public_read" on public.materials
  for select to anon, authenticated using (status = 'published' or public.is_admin());
drop policy if exists "materials_admin_write" on public.materials;
create policy "materials_admin_write" on public.materials
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- animations
drop policy if exists "animations_public_read" on public.animations;
create policy "animations_public_read" on public.animations
  for select to anon, authenticated
  using ((status = 'published' and is_template = false) or public.is_admin());
drop policy if exists "animations_admin_write" on public.animations;
create policy "animations_admin_write" on public.animations
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- tests
drop policy if exists "tests_public_read" on public.tests;
create policy "tests_public_read" on public.tests
  for select to anon, authenticated using (status = 'published' or public.is_admin());
drop policy if exists "tests_admin_write" on public.tests;
create policy "tests_admin_write" on public.tests
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- site_settings
drop policy if exists "settings_public_read" on public.site_settings;
create policy "settings_public_read" on public.site_settings
  for select to anon, authenticated using (true);
drop policy if exists "settings_admin_write" on public.site_settings;
create policy "settings_admin_write" on public.site_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- STORAGE: "materials" bucket
-- Bucket ommaviy (public) — nashr qilingan fayllarni hamma ochishi va yuklab olishi uchun.
-- Fayl nomlari tasodifiy UUID bo'ladi. Yuklash, almashtirish, o'chirish — faqat admin.
-- Fayl hajmi chegarasi: Supabase → Storage → Settings dagi global limit ham amal qiladi.
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('materials', 'materials', true)
on conflict (id) do update set public = true;

drop policy if exists "materials_bucket_admin_read" on storage.objects;
create policy "materials_bucket_admin_read" on storage.objects
  for select to authenticated using (bucket_id = 'materials' and public.is_admin());

drop policy if exists "materials_bucket_admin_insert" on storage.objects;
create policy "materials_bucket_admin_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'materials' and public.is_admin());

drop policy if exists "materials_bucket_admin_update" on storage.objects;
create policy "materials_bucket_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'materials' and public.is_admin());

drop policy if exists "materials_bucket_admin_delete" on storage.objects;
create policy "materials_bucket_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'materials' and public.is_admin());

-- =====================================================================
-- ADMIN QO'SHISH (bir marta, qo'lda):
-- 1) Supabase → Authentication → Users → "Add user" → email va parol kiriting
--    ("Auto Confirm User" belgisini qo'ying).
-- 2) Quyidagi so'rovda emailni o'zingiznikiga almashtirib, ishga tushiring:
--
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'sizning@email.uz'
--   on conflict do nothing;
-- =====================================================================
