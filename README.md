# Tabiiy fan — 5–6-sinflar uchun interaktiv ta’lim platformasi

Yagona **“Tabiiy fan”** fani uchun platforma. U dars ishlanmalari, videoroliklar, slaydlar, tarqatma materiallar, elektron kutubxona, interaktiv animatsiyalar hamda test va mustahkamlash topshiriqlarini bir joyga jamlaydi.

- Ma’lumotlar bazasi **bo‘sh holatda** keladi: demo materiallar, soxta foydalanuvchilar va sun’iy statistika yo‘q.
- Bo‘sh bo‘limlarda “Hozircha material joylashtirilmagan” xabari va “Material qo‘shish” tugmasi chiqadi.
- Admin panelida qo‘shilgan va **nashr qilingan** material ommaviy sahifalarda darhol paydo bo‘ladi (barcha qurilmalarda).

**Texnologiyalar:** React 19 + Vite · Supabase (PostgreSQL, Auth, Storage, RLS) · Netlify · lucide-react ikonlari · Inter/Manrope shriftlari.

---

## 1. Papkalar tuzilishi

```
tabiiy-fan/
├── index.html               # HTML shablon, shriftlar, tema (flash bo'lmasligi uchun)
├── netlify.toml             # Netlify build, SPA yo'naltirish, xavfsizlik sarlavhalari
├── .env.example             # Muhit o'zgaruvchilari namunasi
├── supabase/
│   └── schema.sql           # Jadvallar, RLS siyosatlari, Storage bucket
├── public/favicon.svg
└── src/
    ├── main.jsx             # Kirish nuqtasi, provayderlar
    ├── App.jsx              # Barcha marshrutlar (admin qismi alohida yuklanadi)
    ├── i18n/translations.js # O'zbek / rus / ingliz interfeys matnlari
    ├── context/             # Til, tema, auth, sayt sozlamalari, bildirishnomalar
    ├── lib/
    │   ├── supabase.js      # Supabase mijozi
    │   ├── api.js           # Barcha ma'lumotlar bazasi so'rovlari
    │   ├── storage.js       # Fayl yuklash (katta fayllar — bo'laklab, TUS)
    │   ├── constants.js     # Sinflar, bo'limlar, fayl formatlari
    │   ├── utils.js         # Tarjima, sana, YouTube, sandbox hujjati
    │   └── hooks.js
    ├── components/          # Layout, kartalar, filtrlar, bo'sh holat, SandboxFrame...
    ├── pages/               # Ommaviy sahifalar
    ├── admin/               # Admin paneli (kirish, ro'yxatlar, formalar, muharrirlar)
    └── styles/global.css    # Dizayn: ranglar, kunduzgi/tungi rejim, responsive
```

### Sahifalar

| Manzil | Sahifa |
|---|---|
| `/` | Bosh sahifa |
| `/lesson-plans` | Dars ishlanmalari |
| `/videos` | Videoroliklar |
| `/slides` | Slaydlar |
| `/handouts` | Tarqatma materiallar (tarqatma, ish varaqasi, topshiriq) |
| `/library` | Elektron kutubxona (darslik, metodik qo‘llanma, kitob) |
| `/animations`, `/animations/:id` | Interaktiv animatsiyalar |
| `/tests`, `/tests/:id` | Test va mustahkamlash topshiriqlari (onlayn ishlanadi) |
| `/material/:id` | Material sahifasi: ko‘rish va yuklab olish |
| `/grade/5`, `/grade/6` | Sinf mavzulari |
| `/topic/:id` | Bitta mavzuning barcha materiallari |
| `/about` | Platforma haqida |
| `/admin/login`, `/admin/...` | Himoyalangan admin paneli |

---

## 2. Supabase’ni sozlash

1. [supabase.com](https://supabase.com) da yangi loyiha yarating.
2. **SQL Editor → New query** bo‘limiga `supabase/schema.sql` faylining butun matnini joylang va **Run** tugmasini bosing.
   Skript quyidagilarni yaratadi:
   - jadvallar: `topics`, `materials`, `animations`, `tests`, `site_settings`, `admins`;
   - RLS siyosatlari: mehmonlar faqat **nashr qilingan** materiallarni o‘qiy oladi, yozish esa faqat adminlarga ruxsat etilgan;
   - Storage’dagi `materials` bucket’i: hamma o‘qiy oladi, faqat admin yuklay, almashtira va o‘chira oladi.

   Skriptni qayta ishga tushirish xavfsiz: mavjud ma’lumotlar o‘chmaydi.
3. **Admin foydalanuvchini yarating:**
   - **Authentication → Users → Add user** — email va parol kiriting, “Auto Confirm User” belgisini qo‘ying.
   - SQL Editor’da quyidagini bajaring (emailni o‘zingiznikiga almashtiring):
     ```sql
     insert into public.admins (user_id)
     select id from auth.users where email = 'sizning@email.uz'
     on conflict do nothing;
     ```
4. **Begonalar ro‘yxatdan o‘tishini o‘chiring:** **Authentication → Sign In / Providers → Email** — “Allow new users to sign up” ni o‘chiring.
   (Kimdir ro‘yxatdan o‘tsa ham `admins` jadvalida bo‘lmagani uchun hech narsani o‘zgartira olmaydi. Lekin o‘chirib qo‘ygan ma’qul.)
5. **Kalitlarni oling:** **Project Settings → API** — `Project URL` va `anon` / `publishable` kalit.
   ⚠️ `service_role` (secret) kalitni hech qachon frontendga yoki `.env` ga qo‘ymang.
6. **Fayl hajmi chegarasi:** **Storage → Settings → Global file size limit.** Bepul tarifda bitta fayl 50 MB gacha bo‘ladi. Katta videolar uchun YouTube havolasidan foydalaning yoki pullik tarifda limitni oshiring. 6 MB dan katta fayllar avtomatik ravishda bo‘laklab (uzilishga chidamli) yuklanadi.

### Admin huquqlari qanday tekshiriladi

- Interfeysda: `/admin/*` sahifalari faqat `is_admin()` = `true` bo‘lgan foydalanuvchiga ochiladi.
- Ma’lumotlar bazasida: barcha `insert/update/delete` amallari RLS orqali `public.is_admin()` bilan tekshiriladi. Shuning uchun interfeysni chetlab o‘tib to‘g‘ridan-to‘g‘ri API’ga so‘rov yuborilsa ham, admin bo‘lmagan foydalanuvchi hech narsani o‘zgartira olmaydi.
- `admins` jadvaliga faqat SQL Editor orqali yozish mumkin: foydalanuvchi o‘zini admin qila olmaydi.

---

## 3. Kompyuterda ishga tushirish

Node.js 20 yoki undan yangi versiya kerak.

```bash
npm install
cp .env.example .env      # keyin .env ichiga URL va anon kalitni yozing
npm run dev               # http://localhost:5173
```

Boshqa buyruqlar:

```bash
npm run build     # dist/ papkasiga production build
npm run preview   # build natijasini lokal ko'rish
```

`.env` to‘ldirilmasa, sayt baribir ochiladi va “Supabase hali ulanmagan” ogohlantirishini ko‘rsatadi.

---

## 4. Netlify’ga joylash (deploy)

### A usul — GitHub orqali (tavsiya etiladi)
1. Loyihani GitHub repozitoriyasiga yuklang (`.env` fayli `.gitignore` da, shuning uchun u yuklanmaydi).
2. Netlify’da **Add new site → Import an existing project** ni tanlang va repozitoriyni ko‘rsating.
3. Build sozlamalari `netlify.toml` dan avtomatik olinadi: buyruq — `npm run build`, papka — `dist`.
4. **Site configuration → Environment variables** bo‘limida quyidagilarni qo‘shing:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_STORAGE_BUCKET` = `materials`
5. **Deploy** tugmasini bosing. Keyingi har bir `git push` saytni avtomatik yangilaydi.

### B usul — Netlify CLI orqali
```bash
npm install -g netlify-cli
netlify login
netlify init                       # yoki: netlify link
netlify env:set VITE_SUPABASE_URL https://xxxx.supabase.co
netlify env:set VITE_SUPABASE_ANON_KEY xxxxx
netlify deploy --build --prod
```

### Deploydan keyin
- Supabase → **Authentication → URL Configuration → Site URL** maydoniga Netlify manzilingizni yozing (masalan, `https://tabiiy-fan.netlify.app`).
- `netlify.toml` dagi yo‘naltirish qoidasi tufayli `/videos`, `/admin` kabi sahifalar yangilanganda ham 404 bermaydi.
- Fayllar Netlify’da emas, **Supabase Storage**’da saqlanadi. Netlify faqat sayt kodini joylashtiradi.

---

## 5. Admin paneli bilan ishlash

1. `/admin/login` sahifasiga kiring.
2. Avval **Mavzular** bo‘limida 5- va 6-sinf dars mavzularini yarating. Bu yerda mavzu nomini, tartib raqamini va tarjimalarini o‘zgartirish yoki mavzuni o‘chirish mumkin. Mavzu o‘chirilsa, unga biriktirilgan materiallar o‘chmaydi.
3. Kerakli bo‘limda **Yangi qo‘shish** tugmasini bosing, so‘ng nom, sinf, mavzu, tavsif, fayl va ixtiyoriy muqova rasmini kiriting.
   - **Videolar:** YouTube havolasi (sayt ichida ochiladi), qurilmadan yuklash yoki tashqi havola.
   - **Hujjatlar:** PDF sayt ichida ko‘rsatiladi; DOCX/PPTX/XLSX esa Microsoft Office Online orqali ko‘rsatiladi. Har bir faylni yuklab olish mumkin.
4. **Qoralama sifatida saqlash** — materialni faqat admin ko‘radi. **Saqlash va nashr qilish** — material hammaga ko‘rinadi. Ro‘yxatdagi 👁 tugmasi bilan materialni bir bosishda nashr qilish yoki qoralamaga qaytarish mumkin.
5. **Tarjimalar (ixtiyoriy):** rus va ingliz tilidagi nom/tavsif. Tarjima kiritilmasa, barcha tillarda asl nom ko‘rsatiladi.
6. **Sozlamalar:** sayt nomi, bosh sahifa matnlari, “Platforma haqida” matni, aloqa ma’lumotlari — uchala tilda.

### Interaktiv animatsiya muharriri
- HTML, CSS va JavaScript uchun alohida tablar bor. Muharrir qator raqamlarini ko‘rsatadi, `Tab` bilan suradi, `Ctrl+S` bilan saqlaydi.
- **Jonli ko‘rinish:** kod yozilishi bilan avtomatik yangilanadi (yoki “Ishga tushirish” tugmasi bilan). Ko‘rinishni kompyuter, planshet va telefon o‘lchamlarida tekshirish mumkin. Kod xatosi bo‘lsa, JS qator raqami bilan ko‘rsatiladi.
- **Xavfsizlik:** kod `sandbox="allow-scripts"` iframe ichida ishlaydi (`allow-same-origin` yo‘q). U asosiy saytning sahifasiga, cookie’lariga, localStorage’iga va admin sessiyasiga kira olmaydi.
- **Shablonlar:** istalgan animatsiyani “Shablon sifatida saqlash” mumkin. Yangi animatsiya yaratishda “Shablondan boshlash” paneli chiqadi. Shablonlar ommaga ko‘rinmaydi.
- Ommaviy sahifada animatsiya alohida sahifada ochiladi va “To‘liq ekran” hamda “Qayta boshlash” tugmalariga ega.

### Test va mustahkamlash topshiriqlari
- Ko‘p variantli savollar (2–8 variant), to‘g‘ri javob va ixtiyoriy izoh kiritiladi. Topshiriqqa fayl ham biriktirish mumkin (masalan, chop etiladigan ish varag‘i).
- O‘quvchi testni onlayn ishlaydi, so‘ng natijani foizda ko‘radi va javoblarni ko‘rib chiqadi. Natijalar hech qayerda saqlanmaydi, chunki o‘quvchi akkaunti yo‘q.

---

## 6. Kengaytirish

- **Yangi interfeys matni:** `src/i18n/translations.js` ga uchala tilda qo‘shing.
- **Yangi material turi yoki kategoriyasi:** `src/lib/constants.js` dagi `MATERIAL_TYPES` ga qo‘shing va `schema.sql` dagi `type` cheklovini yangilang.
- **Ma’lumotlar bazasi so‘rovlari:** barchasi `src/lib/api.js` da jamlangan.
