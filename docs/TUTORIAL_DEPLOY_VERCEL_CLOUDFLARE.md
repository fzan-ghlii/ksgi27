# Tutorial Lengkap Deploy Portal GIBEI UNIMED ke Vercel (Production) & Pengamanan Cloudflare

Dokumen ini adalah panduan operasional *end-to-end* untuk meluncurkan portal **GIBEI UNIMED** (`Next.js 16.4.6` + `Firebase Admin/Auth/Firestore` + `Google Sheets API` + `Upstash Redis` + `Cloudflare WAF & Turnstile`) ke tahap **Production** di **Vercel**.

---

## Ringkasan Arsitektur Keamanan & Infrastruktur

```text
Pengunjung / Pengurus
   │  (TLS 1.3 + HSTS + DNSSEC)
   ▼
Cloudflare Edge Network (Gratis)
   ├─ Anycast SYN Proxy (tahan SYN Flood L3/L4 & Network IP Spoofing)
   ├─ Always Use HTTPS + Full (Strict) TLS (anti SSL Stripping & MITM Wi-Fi)
   ├─ Bot Fight Mode + WAF Custom Rules + Turnstile Widget
   └─ Header CF-Connecting-IP diteruskan ke Origin
   │
   ▼
Vercel Production (Next.js 16.4.6)
   ├─ next.config.ts : CSP, HSTS, X-Frame-Options: DENY, nosniff, Permissions-Policy
   ├─ src/proxy.ts   : CSRF Origin Guard (/api/*) + pengarah sesi /dashboard
   ├─ Rate Limiter   : Upstash Redis (/api/auth/session, /api/activation/*, /api/events/*/register, dll.)
   ├─ Auth Session   : Cookie __session httpOnly + cek revokeRefreshTokens
   └─ API Handlers   : Validasi Zod, isSafeDocId, WebP/PDF Magic Bytes, timingSafeSecretEqual
   │
   ▼
Layanan Eksternal
   ├─ Cloud Firestore & Firebase Auth (Client SDK terkunci oleh firestore.rules)
   └─ Google Sheets API v4 (Sinkronisasi peserta SPM/Event)
```

---

## Tahap 1 — Verifikasi Kode Lokal Sebelum Deploy

Pastikan seluruh pemeriksaan lokal lolos 100% tanpa error sebelum mengunggah ke GitHub/Vercel:

```powershell
npm test
npx tsc --noEmit
npm run lint
npm run build
```

Pastikan pula file sensitif **tidak ikut ter-commit** ke Git:
- Cek `.gitignore` sudah memuat `.env*.local`, `.env.production`, dan file kunci `.json` Google/Firebase.
- Jalankan `git status` dan pastikan `.env.local` tidak masuk *tracked files*.

---

## Tahap 2 — Konfigurasi Firebase Console (Production)

Disarankan memakai proyek Firebase khusus **Production** (terpisah dari development) agar data uji coba tidak tercampur.

### 2.1. Siapkan Web App & Service Account
1. Buka [Firebase Console](https://console.firebase.google.com/) > pilih proyek produksi.
2. **Client SDK Keys**: Masuk **Project Settings > General > Your apps > Web app (`</>`)**, catat:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
3. **Admin SDK Service Account**: Masuk **Project Settings > Service accounts > Generate new private key**, unduh file JSON, lalu ambil:
   - `FIREBASE_PROJECT_ID` (dan `GCLOUD_PROJECT` samakan dengan ID proyek)
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (salin utuh dari `-----BEGIN PRIVATE KEY-----` sampai `-----END PRIVATE KEY-----\n`; lihat catatan format pada Tahap 6).

### 2.2. Autentikasi & Hardening Akun
Masuk menu **Authentication**:
1. Tab **Sign-in method**:
   - Aktifkan **Google** (isi *Project support email*, misalnya email resmi `gibei@unimed.ac.id`).
   - Aktifkan **Email/Password** (dibutuhkan untuk pendaftaran pengurus lewat Link Aktivasi maupun login password).
2. Tab **Settings > Authorized domains**:
   - Tambahkan domain produksi Anda (misal `gibei-unimed.com`, `www.gibei-unimed.com`).
   - Tambahkan juga domain bawaan Vercel (misal `gibei-unimed.vercel.app`) untuk verifikasi awal.
3. Tab **Settings > User actions**:
   - Aktifkan **Email enumeration protection** agar pesan error auth tidak membocorkan apakah email pengurus terdaftar atau tidak.

### 2.3. Deploy Firestore Security Rules & Composite Indexes
Proyek menggunakan model *Zero-Trust Client SDK* ([`firestore.rules`](file:///d:/DOKUMEN%20UMUM/gibei-27/firestore.rules)): akses baca/tulis langsung dari browser diblokir (kecuali pengguna membaca dokumen profilnya sendiri di `users/{uid}`), dan semua operasi data diproses via Next.js Server API.

Deploy aturan dan indeks komposit ([`firestore.indexes.json`](file:///d:/DOKUMEN%20UMUM/gibei-27/firestore.indexes.json)) melalui Firebase CLI:

```powershell
firebase login
firebase use <id-proyek-firebase-production>
firebase deploy --only firestore:rules,firestore:indexes
```

> **Indeks komposit yang otomatis dibuat:**
> 1. `board_members`: `period_id` (ASC), `division_id` (ASC), `order_index` (ASC)
> 2. `activation_invites`: `status` (ASC), `created_at` (DESC)

*(Opsional)* Aktifkan **Firebase App Check** (reCAPTCHA Enterprise) pada Web App di Firebase Console bila proyek sudah pada paket Blaze/kuota memadai untuk mencegah penyalahgunaan `NEXT_PUBLIC_FIREBASE_API_KEY` dari skrip luar.

---

## Tahap 3 — Konfigurasi Google Sheets & Webhook Google Form (Opsional / Sangat Disarankan)

Digunakan agar data pendaftar Event/SPM otomatis masuk ke Google Spreadsheet divisi pelaksana dan Google Form eksternal dapat menyinkronkan peserta.

### 3.1. Service Account Google Sheets
1. Di Google Cloud Console proyek yang sama (atau proyek Google Cloud khusus), buka **APIs & Services > Library**, cari **Google Sheets API**, lalu klik **Enable**.
2. Buat Service Account baru (atau pakai Service Account Admin SDK jika ingin ringkas), lalu buat key JSON.
3. Ambil nilai berikut:
   - `GOOGLE_SHEETS_CLIENT_EMAIL` = email service account (`...@...iam.gserviceaccount.com`)
   - `GOOGLE_SHEETS_PRIVATE_KEY` = private key service account tersebut.

> [!IMPORTANT]
> **Perhatikan Nama Variabel!**
> File [`src/lib/google/sheets.ts`](file:///d:/DOKUMEN%20UMUM/gibei-27/src/lib/google/sheets.ts) membaca **`GOOGLE_SHEETS_CLIENT_EMAIL`** dan **`GOOGLE_SHEETS_PRIVATE_KEY`** (bukan `GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL`). Pastikan variabel di Vercel menggunakan **`GOOGLE_SHEETS_CLIENT_EMAIL`**.

4. **Wajib pada setiap Spreadsheet Event/SPM**: klik **Share** di Google Spreadsheet target, tambahkan alamat email `GOOGLE_SHEETS_CLIENT_EMAIL` tersebut dengan izin **Editor**.

### 3.2. Secret Webhook Google Form
Buat string acak panjang minimal 32 karakter (contoh lewat PowerShell):
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```
Simpan ke env **`GFORM_WEBHOOK_SECRET`** di Vercel (atau isi juga lewat *Creator Console > Integrasi Google*). Saat mengirim data dari Google Apps Script ke `POST https://<domain-anda>/api/webhooks/gform`, kirim secret di header `x-webhook-secret` atau field body `secret_token`. Endpoint ini diverifikasi secara *constant-time* (`timingSafeSecretEqual`).

---

## Tahap 4 — Konfigurasi Upstash Redis (Rate Limiting Terdistribusi)

Di Vercel (*serverless functions*), state memori per-instance bersifat sementara. Agar rate limiter pada [`src/lib/security/rate-limit.ts`](file:///d:/DOKUMEN%20UMUM/gibei-27/src/lib/security/rate-limit.ts) konsisten lintas instance dan tahan brute-force:

1. Daftar / login ke [Upstash Console](https://console.upstash.com/) (paket **Free Tier** sudah cukup untuk portal organisasi).
2. Buat database **Redis** baru, pilih region terdekat ke server Vercel (misal **ap-southeast-1 / Singapore**).
3. Masuk tab **REST API**, salin:
   - **`UPSTASH_REDIS_REST_URL`**
   - **`UPSTASH_REDIS_REST_TOKEN`**

**Kebijakan Rate Limiting bawaan aplikasi yang otomatis memakai Upstash:**
- `POST /api/auth/session`: maks 10 percobaan / 10 menit per IP
- `POST /api/activation/validate` & `complete`: maks 10 percobaan / 15 menit per IP
- `POST /api/events/[id]/register`: maks 5 pendaftaran / 10 menit per IP
- `POST /api/artikel/[slug]/view`: maks 1 view / 5 menit per artikel+IP
- `POST /api/images` & `POST /api/events/[id]/report/pdf`: maks 20 unggahan / 10 menit per pengguna/token
- `POST /api/webhooks/gform`: maks 60 request / menit per IP

---

## Tahap 5 — Pengamanan Domain & Edge Menggunakan Cloudflare (Gratis)

Cloudflare berdiri di depan Vercel untuk menangani ancaman jaringan (**SYN Flood, Network IP Spoofing, DDoS**), mencegah **SSL Stripping**, memperkuat ketahanan **ARP Spoofing Wi-Fi publik**, dan menyediakan **Turnstile Anti-Bot** tanpa biaya berlangganan (*Free Plan*).

### 5.1. Siapkan Cloudflare Turnstile (Anti-Bot Formulir Publik)
1. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com/) > pilih menu **Turnstile** > klik **Add widget**.
2. Isi **Widget name**: `GIBEI UNIMED Production`.
3. Pada **Domains / Hostnames**, tambahkan domain produksi Anda (misal `gibei-unimed.com` dan `www.gibei-unimed.com`).
4. Pilih **Widget Mode**: **Managed** (rekomendasi, otomatis non-interaktif bagi manusia dan menantang bot).
5. Klik **Create**, lalu salin:
   - **`NEXT_PUBLIC_TURNSTILE_SITE_KEY`**
   - **`TURNSTILE_SECRET_KEY`**
6. Siapkan juga env:
   - **`TURNSTILE_HOSTNAMES`**=`gibei-unimed.com,www.gibei-unimed.com` *(domain dipisah koma tanpa `https://`)*
   - **`TURNSTILE_REQUIRED`**=`true` *(memaksa verifikasi fail-closed di production)*

> [!NOTE]
> `next.config.ts` sudah mengizinkan `https://challenges.cloudflare.com` pada `script-src`, `connect-src`, dan `frame-src` di Content Security Policy (CSP), sehingga widget Turnstile dapat berjalan langsung tanpa error CSP.

### 5.2. Tambahkan Domain ke Cloudflare & Pindahkan Nameserver
1. Di Cloudflare Dashboard > **Add a site** > masukkan domain utama Anda (misal `gibei-unimed.com`) > pilih paket **Free**.
2. Cloudflare akan memberikan 2 alamat **Nameserver** (misal `ada.ns.cloudflare.com` & `bob.ns.cloudflare.com`).
3. Login ke panel registrar domain Anda (Niagahoster, Rumahweb, Domainesia, Namecheap, atau pengelola domain kampus), ganti Nameserver ke 2 NS Cloudflare tersebut, lalu tunggu propagasi (biasanya 15 menit–24 jam hingga status di Cloudflare menjadi **Active**).

### 5.3. Hubungkan DNS Cloudflare ↔ Vercel (Urutan yang Tepat Agar SSL Tidak Error)
Agar penerbitan sertifikat SSL Vercel dan mode *Full (Strict)* Cloudflare berjalan mulus tanpa loop redirect:

1. **Tambahkan Domain di Vercel lebih dulu** (Dashboard Project Vercel > **Settings > Domains** > tambahkan `gibei-unimed.com` & `www.gibei-unimed.com`).
2. Vercel akan menampilkan record DNS target:
   - Apex (`@` atau `gibei-unimed.com`): `A` record ke `76.76.21.21` (atau IP spesifik yang ditampilkan Vercel pada akun Anda).
   - `www`: `CNAME` record ke `cname.vercel-dns.com` (atau CNAME khusus proyek dari dashboard Vercel).
   - Jika diminta Vercel, tambahkan pula record `TXT` `_vercel` untuk verifikasi kepemilikan domain.
3. **Masukkan record tersebut di Cloudflare > DNS > Records** dengan status awal **DNS Only (awan abu-abu / Grey Cloud)** terlebih dahulu selama ~2–5 menit sampai di Vercel muncul status **Valid Configuration & SSL Certificate Issued**.
4. **Setelah Vercel menyatakan Valid**, ubah Proxy status record `A` (`@`) dan `CNAME` (`www`) di Cloudflare menjadi **Proxied (awan oranye / Orange Cloud)**.
   - Jangan biarkan record `TXT` verifikasi di-proxy (memang selalu DNS only).
   - Jangan membuat record DNS yang mengekspos IP server lain secara terbuka.

### 5.4. Pengaturan SSL/TLS Cloudflare (Anti SSL Stripping & MITM)
Masuk menu **SSL/TLS** di Cloudflare untuk domain Anda:
1. **Overview**: Pilih mode **Full (Strict)** *(wajib! Jangan pilih Flexible, karena Flexible membuat koneksi Cloudflare→Vercel tidak terenkripsi dan menyebabkan infinite redirect saat Always Use HTTPS aktif).*
2. **Edge Certificates**:
   - **Always Use HTTPS**: **ON**
   - **Minimum TLS Version**: **TLS 1.2** *(atau TLS 1.3)*
   - **Opportunistic Encryption**: **ON**
   - **TLS 1.3**: **ON**
   - **Automatic HTTPS Rewrites**: **ON**
   - **HTTP Strict Transport Security (HSTS)** -> klik **Enable HSTS**:
     - `Max Age Header`: **12 months (31536000)** (atau 6+ bulan setelah yakin tidak ada subdomain non-HTTPS)
     - `Apply HSTS policy to subdomains (includeSubDomains)`: **ON** *(hanya jika seluruh subdomain memakai HTTPS)*
     - `Preload`: **ON** *(setelah stabil, Anda dapat mendaftarkan domain ke [hstspreload.org](https://hstspreload.org/))*
     - `No-Sniff Header`: **ON**

### 5.5. Pengaturan DNSSEC & Jaringan Anti-Spoofing
1. Masuk **DNS > Settings** di Cloudflare > klik **Enable DNSSEC**.
2. Salin **DS Record** yang diberikan Cloudflare ke panel registrar domain Anda agar terlindung dari *DNS Hijacking / Cache Poisoning* pasca-ARP Spoofing di Wi-Fi publik.
3. Pastikan aplikasi membaca IP asli dari Cloudflare: `src/lib/security/rate-limit.ts` sudah memprioritaskan header **`cf-connecting-ip`** (lalu `x-vercel-forwarded-for`), sehingga penyerang tidak dapat memalsukan IP lewat header `X-Forwarded-For` mentah.

### 5.6. WAF, Bot Fight Mode, & Rate Limiting Rules (Cloudflare Free)
Masuk menu **Security**:
1. **Bots**: Aktifkan **Bot Fight Mode (ON)**.
2. **WAF > Custom Rules** (buat aturan proteksi tambahan gratis):
   - **Rule 1 — Bypass Security Challenge untuk Webhook GForm**:
     - *Expression*: `(http.request.uri.path eq "/api/webhooks/gform")`
     - *Action*: **Skip** -> centang *Bot Fight Mode / Managed Challenges* *(agar Google Apps Script tidak tertahan challenge Cloudflare; keamanan endpoint ini tetap dikunci oleh rate limiter + header `x-webhook-secret` constant-time)*.
   - **Rule 2 — Perlindungan Ketat Rute Sensitif (Non-GET ke Auth/Aktivasi)**:
     - *Expression*: `(http.request.uri.path starts_with "/api/activation" or http.request.uri.path eq "/api/auth/session") and (not cf.client.bot) and (cf.threat_score gt 10)`
     - *Action*: **Managed Challenge**
3. **Security Level** (menu **Security > Settings**): Setel ke **Medium** atau **High**, dan **Browser Integrity Check: ON**.

---

## Tahap 6 — Deploy Aplikasi ke Vercel

### 6.1. Hubungkan Repositori
1. Push seluruh kode ke repositori GitHub pribadi/organisasi.
2. Buka [Vercel Dashboard](https://vercel.com/new) > **Import Git Repository** > pilih repo `gibei-27`.
3. Biarkan pengaturan build default Next.js:
   - **Framework Preset**: `Next.js`
   - **Build Command**: `npm run build`
   - **Install Command**: `npm install`

### 6.2. Daftar Lengkap Environment Variables Production (Vercel > Settings > Environment Variables)

Pilih scope **Production** untuk semua variabel berikut:

| Variabel | Wajib? | Contoh / Cara Pengisian |
| :--- | :---: | :--- |
| `NEXT_PUBLIC_APP_URL` | **Wajib** | `https://gibei-unimed.com` *(tanpa garis miring `/` di belakang; harus persis domain utama HTTPS agar Proxy CSRF Check lolos)* |
| `CREATOR_EMAILS` | **Wajib** | `ketua.gibei@gmail.com,pembina@unimed.ac.id` *(email Google yang otomatis jadi role `creator` saat login pertama kali)* |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | **Wajib** | `AIzaSy...` *(dari Firebase Web App)* |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | **Wajib** | `gibei-prod.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | **Wajib** | `gibei-prod` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | **Wajib** | `gibei-prod.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | **Wajib** | `123456789012` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | **Wajib** | `1:123456789012:web:...` |
| `FIREBASE_PROJECT_ID` | **Wajib** | `gibei-prod` |
| `GCLOUD_PROJECT` | **Wajib** | `gibei-prod` |
| `FIREBASE_CLIENT_EMAIL` | **Wajib** | `firebase-adminsdk-xxxx@gibei-prod.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | **Wajib** | Tempel kunci privat Service Account. Di Vercel, Anda bisa menempel dengan `\n` literal (sudah ditangani `.replace(/\\n/g, '\n')` di `admin.ts`) maupun multi-line |
| `UPSTASH_REDIS_REST_URL` | **Sangat Disarankan** | `https://xxxx.upstash.io` *(dari Upstash Console)* |
| `UPSTASH_REDIS_REST_TOKEN` | **Sangat Disarankan** | Token REST Upstash |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | **Sangat Disarankan** | Site Key Turnstile Cloudflare |
| `TURNSTILE_SECRET_KEY` | **Sangat Disarankan** | Secret Key Turnstile Cloudflare |
| `TURNSTILE_HOSTNAMES` | **Sangat Disarankan** | `gibei-unimed.com,www.gibei-unimed.com` |
| `TURNSTILE_REQUIRED` | Disarankan | `true` *(aktifkan setelah Site Key & Secret Key sudah terpasang valid)* |
| `GOOGLE_SHEETS_CLIENT_EMAIL` | Opsional | Email Service Account untuk auto-sync Spreadsheet Event/SPM |
| `GOOGLE_SHEETS_PRIVATE_KEY` | Opsional | Private key Service Account Google Sheets |
| `GFORM_WEBHOOK_SECRET` | Opsional | Secret panjang acak untuk endpoint `/api/webhooks/gform` |

> [!CAUTION]
> Setelah menambahkan variabel berawalan `NEXT_PUBLIC_*` atau mengubahnya, **wajib lakukan Redeploy** di Vercel (tab **Deployments > `...` > Redeploy**), karena variabel `NEXT_PUBLIC_*` dibundel pada saat *build time*.

---

## Tahap 7 — Inisialisasi Data Perdana (Bootstrap Post-Deploy)

Segera setelah status deployment Vercel **Ready** dan domain terhubung penuh:

1. **Bootstrap Akun Creator**:
   - Buka `https://<domain-anda>/login`.
   - Login dengan **Akun Google** yang alamat emailnya tercantum pada `CREATOR_EMAILS`.
   - Sistem otomatis membuat profil `creator` dan membuka akses penuh dashboard.
2. **Periksa Maintenance Mode & Integrasi**:
   - Masuk ke **`/dashboard/sistem`**:
     - Tab **Maintenance Mode**: pastikan status dalam kondisi **NONAKTIF / NORMAL (Publik Aktif)** ketika siap dibuka ke umum.
     - Tab **Koleksi & Integrasi Google**: klik tombol uji koneksi Google Sheets untuk memverifikasi kredensial `GOOGLE_SHEETS_CLIENT_EMAIL` bekerja.
3. **Buat & Aktifkan Periode Kepengurusan**:
   - Masuk ke **`/dashboard/kepengurusan`**, buat periode aktif (misal `2026/2027`), lalu klik **Jadikan Periode Aktif**.
4. **Undang Presidium & Pengurus Lewat Link Aktivasi**:
   - Masuk ke **`/dashboard/aktivasi`**, buat Link Aktivasi sekali pakai untuk **Presidium** (Ketua Umum, Sekretaris, Bendahara, dll.) dan **Kadiv**, lalu bagikan tautan `/aktivasi/[token]` kepada yang bersangkutan.
5. **Pengaturan Awal Operasional**:
   - **Presidium**: Unggah slide **Carousel Beranda** (`/dashboard/carousel`) dan tambahkan daftar **Prestasi GIBEI UNIMED** (`/dashboard/prestasi`).
   - **Kadiv/Wakadiv Galeri**: Setel koordinat GPS & jadwal **Piket Galeri** (`/dashboard/piket`).
   - **Kadiv Edukasi / Kegiatan / Presidium**: Buat agenda **Event / SPM** perdana (`/dashboard/event-spm`) & publikasikan artikel pertama (`/dashboard/artikel/baru`).

---

## Tahap 8 — Checklist Pengujian Keamanan & Operasional Live

Jalankan pengecekan berikut langsung pada domain produksi setelah semua tahap selesai:

- [ ] **Cek HTTPS & HSTS**: Buka `http://<domain-anda>` (HTTP biasa), pastikan otomatis redirect `301` ke `https://...` oleh Cloudflare tanpa peringatan sertifikat.
- [ ] **Cek Security Headers**: Jalankan di PowerShell:
  ```powershell
  Invoke-WebRequest -Uri "https://<domain-anda>" -Method Head | Select-Object -ExpandProperty Headers
  ```
  Pastikan muncul `Strict-Transport-Security`, `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Permissions-Policy`, dan **tidak ada** header `X-Powered-By`.
- [ ] **Cek Anti-CSRF Origin Guard**: Uji kirim `POST` ke `https://<domain-anda>/api/articles` dengan header `Origin: https://evil.example` -> pastikan mendapat respons **HTTP 403** (`Permintaan lintas origin ditolak.`).
- [ ] **Cek Turnstile & Rate Limit Form SPM**: Buka halaman detail kegiatan `/kegiatan/[slug]`, pastikan widget Cloudflare Turnstile tampil normal dan formulir berhasil mengirim pendaftaran.
- [ ] **Cek Firestore Rules**: Pastikan API `/api/system/metrics` atau akses langsung ke Firestore Client SDK tanpa autentikasi ditolak.
- [ ] **Cek Piket Galeri di Ponsel**: Buka `/dashboard/piket` lewat HP pengurus, pastikan peramban mengizinkan **Kamera & GPS** (berkat `Permissions-Policy: camera=(self), geolocation=(self)`).
- [ ] **Cek Wi-Fi Ruang Galeri BEI UNIMED (Rekomendasi Tambahan Anti ARP Spoofing)**:
  - Pisahkan Wi-Fi **Pengurus** dan **Tamu/Mahasiswa** (*Client/AP Isolation* untuk tamu).
  - Gunakan enkripsi minimal **WPA2-AES / WPA3** (matikan WPS).
  - Aktifkan **DNS-over-HTTPS (DoH)** di browser perangkat operasional Galeri.

---

## Pemeliharaan Rutin Pasca-Go-Live

1. **Tinjau Audit Log Secara Berkala**: melalui `/dashboard/sistem > Audit Log Explorer` oleh Creator untuk memantau pembuatan/pencabutan Link Aktivasi, perubahan role, persetujuan laporan kegiatan, dan publikasi konten.
2. **Backup Database Firestore**: jika menggunakan paket Blaze di Google Cloud/Firebase, aktifkan *Scheduled Firestore Backups* (mingguan/harian) ke Cloud Storage bucket.
3. **Rotasi Secret Berkala**: ganti `GFORM_WEBHOOK_SECRET` atau kunci Service Account jika ada pergantian kepengurusan teknis / indikasi kebocoran kredensial.

