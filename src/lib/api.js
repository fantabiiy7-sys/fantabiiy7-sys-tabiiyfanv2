import { supabase } from './supabase';
import { removeFiles } from './storage';

function db() {
  if (!supabase) throw new Error('Supabase is not configured');
  return supabase;
}

function check({ data, error }) {
  if (error) throw error;
  return data;
}

/* ----------------------------- Topics ----------------------------- */
export async function listTopics(grade) {
  if (!supabase) return [];
  let q = db().from('topics').select('*').order('grade').order('sort_order').order('created_at');
  if (grade) q = q.eq('grade', grade);
  return check(await q);
}
export async function saveTopic(topic) {
  const { id, ...rest } = topic;
  if (id) return check(await db().from('topics').update(rest).eq('id', id).select().single());
  return check(await db().from('topics').insert(rest).select().single());
}
export async function deleteTopic(id) {
  check(await db().from('topics').delete().eq('id', id));
}

/* ------------------------- Generic content ------------------------- */
/**
 * table: materials | animations | tests
 * filters: { type, grade, topic_id, category, search, status, includeTemplates, limit }
 */
export async function listItems(table, filters = {}) {
  if (!supabase) return [];
  const cols =
    table === 'animations'
      ? 'id,title,description,translations,grade,topic_id,cover_path,status,is_template,created_at,updated_at,published_at'
      : '*';
  let q = db().from(table).select(cols).order('created_at', { ascending: false });
  if (filters.type) q = q.eq('type', filters.type);
  if (filters.grade) q = q.eq('grade', filters.grade);
  if (filters.topic_id) q = q.eq('topic_id', filters.topic_id);
  if (filters.category) q = q.eq('category', filters.category);
  if (filters.status) q = q.eq('status', filters.status);
  if (table === 'animations') {
    if (filters.onlyTemplates) q = q.eq('is_template', true);
    else if (!filters.includeTemplates) q = q.eq('is_template', false);
  }
  if (filters.search) {
    const s = filters.search.replace(/[%,()]/g, ' ').trim();
    if (s) q = q.or(`title.ilike.%${s}%,description.ilike.%${s}%`);
  }
  if (filters.limit) q = q.limit(filters.limit);
  return check(await q);
}

export async function getItem(table, id) {
  if (!supabase) return null;
  return check(await db().from(table).select('*').eq('id', id).maybeSingle());
}

export async function saveItem(table, item) {
  const { id, created_at, updated_at, published_at, ...rest } = item;
  if (id) return check(await db().from(table).update(rest).eq('id', id).select().single());
  return check(await db().from(table).insert(rest).select().single());
}

export async function deleteItem(table, item) {
  check(await db().from(table).delete().eq('id', item.id));
  await removeFiles([item.file_path, item.cover_path]).catch(() => {});
}

/** Har bir bo'limdagi nashr qilingan materiallar soni (haqiqiy ma'lumotlar asosida) */
export async function countPublished() {
  if (!supabase) return {};
  const head = { count: 'exact', head: true };
  const types = ['lesson_plan', 'video', 'slide', 'handout', 'library'];
  const reqs = types.map((t) => db().from('materials').select('id', head).eq('type', t).eq('status', 'published'));
  reqs.push(db().from('animations').select('id', head).eq('status', 'published').eq('is_template', false));
  reqs.push(db().from('tests').select('id', head).eq('status', 'published'));
  const res = await Promise.all(reqs);
  const out = {};
  types.forEach((t, i) => (out[t] = res[i].count || 0));
  out.animation = res[5].count || 0;
  out.test = res[6].count || 0;
  return out;
}

/** Admin uchun: barcha (qoralama + nashr) materiallar soni */
export async function countAll() {
  if (!supabase) return {};
  const head = { count: 'exact', head: true };
  const types = ['lesson_plan', 'video', 'slide', 'handout', 'library'];
  const reqs = [];
  types.forEach((t) => {
    reqs.push(db().from('materials').select('id', head).eq('type', t));
    reqs.push(db().from('materials').select('id', head).eq('type', t).eq('status', 'draft'));
  });
  reqs.push(db().from('animations').select('id', head).eq('is_template', false));
  reqs.push(db().from('animations').select('id', head).eq('is_template', false).eq('status', 'draft'));
  reqs.push(db().from('tests').select('id', head));
  reqs.push(db().from('tests').select('id', head).eq('status', 'draft'));
  reqs.push(db().from('topics').select('id', head));
  const r = await Promise.all(reqs);
  const out = {};
  types.forEach((t, i) => (out[t] = { total: r[i * 2].count || 0, draft: r[i * 2 + 1].count || 0 }));
  out.animation = { total: r[10].count || 0, draft: r[11].count || 0 };
  out.test = { total: r[12].count || 0, draft: r[13].count || 0 };
  out.topics = r[14].count || 0;
  return out;
}

/* ----------------------------- Settings ----------------------------- */
export async function getSettings() {
  if (!supabase) return {};
  const row = check(await db().from('site_settings').select('data').eq('id', 1).maybeSingle());
  return row?.data || {};
}
export async function saveSettings(data) {
  return check(await db().from('site_settings').update({ data }).eq('id', 1).select().single());
}
