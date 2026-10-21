import { supabase, STORAGE_BUCKET } from './supabase';

/** Tarjima bo'lsa — tarjimani, bo'lmasa asl nomni qaytaradi */
export function localized(item, field, lang) {
  if (!item) return '';
  if (lang && lang !== 'uz') {
    const tr = item.translations?.[lang]?.[field];
    if (tr && String(tr).trim()) return tr;
  }
  return item[field] || '';
}

export function publicUrl(path) {
  if (!path || !supabase) return '';
  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

export function downloadUrl(path, fileName) {
  if (!path || !supabase) return '';
  return supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path, { download: fileName || true }).data.publicUrl;
}

export function youtubeId(url) {
  if (!url) return null;
  const m = String(url).match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

export function formatSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

const UZ_MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];

export function formatDate(iso, lang) {
  if (!iso) return '';
  if (lang === 'uz' || !lang) {
    // Brauzerlarning o'zbekcha formati bir xil emas, shuning uchun qo'lda
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getDate()}-${UZ_MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
  }
  const locale = lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-GB' : 'uz-UZ';
  try {
    return new Date(iso).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return new Date(iso).toISOString().slice(0, 10);
  }
}

export function fileExt(name) {
  if (!name) return '';
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

/** Fayl qanday ko'rsatilishini aniqlaydi */
export function previewKind(mime, name) {
  const ext = fileExt(name);
  if (mime?.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  if (mime?.startsWith('video/') || ['mp4', 'webm', 'mov', 'm4v', 'ogg'].includes(ext)) return 'video';
  if (mime?.startsWith('audio/') || ['mp3', 'wav', 'm4a'].includes(ext)) return 'audio';
  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) return 'office';
  if (ext === 'txt') return 'text';
  return 'none';
}

export function officeViewerUrl(fileUrl) {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
}

/** Sandbox iframe uchun to'liq HTML hujjat */
export function buildAnimationDoc({ html = '', css = '', js = '' }) {
  const safeJs = String(js).replace(/<\/script/gi, '<\\/script');
  const safeCss = String(css).replace(/<\/style/gi, '<\\/style');
  const head = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;padding:0;font-family:Inter,system-ui,sans-serif}</style>
<style>${safeCss}</style></head>
<body>${html}
<script>
var __off = __OFFSET__;
window.addEventListener('error', function (e) {
  var line = e.lineno && e.lineno > __off ? ' (JS line ' + (e.lineno - __off) + ')' : '';
  try { parent.postMessage({ __tfAnimError: String(e.message) + line }, '*'); } catch (_) {}
});
</script>
<script>`;
  // Foydalanuvchi JS kodi boshlanadigan qatorgacha bo'lgan qatorlar soni (xato qatorini to'g'ri ko'rsatish uchun)
  const offset = head.split('\n').length - 1;
  const i = head.lastIndexOf('__OFFSET__');
  return head.slice(0, i) + offset + head.slice(i + 10) + safeJs + '</script>\n</body></html>';
}

/** Telegram havolasini to'g'rilaydi: "@user", "t.me/user" yoki to'liq URL */
export function telegramHref(value) {
  const v = String(value || '').trim();
  if (!v) return '';
  if (v.startsWith('@')) return `https://t.me/${v.slice(1)}`;
  if (/^(https?:\/\/)?(t\.me|telegram\.me)\//i.test(v)) return v.startsWith('http') ? v : `https://${v}`;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[A-Za-z0-9_]{4,}$/.test(v)) return `https://t.me/${v}`;
  return '';
}
