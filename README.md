# GIBEI UNIMED - Portal & Sistem Manajemen Organisasi Dinamis (Tahap 1)

Platform web organisasi dinamis **Galeri Investasi Bursa Efek Indonesia Universitas Negeri Medan (GIBEI UNIMED)** yang dibangun dengan arsitektur modern Next.js (App Router), TypeScript, Tailwind CSS, Firebase (Auth & Cloud Firestore), dan sistem keamanan berbasis peran (RBAC 5 tingkatan).

---

## 🎨 Design System & Identitas Visual (Palette ColorHunt: 1e3b2f / 7f8c6a / c8b48a / f5f0e6)

Sesuai palet resmi terbaru:
1. **Soft Linen Cream (`#f5f0e6`) — 60%:** Latar belakang kanvas utama yang hangat, elegan, dan anti-silau di mata, dipadukan dengan permukaan kartu putih bersih (`#ffffff`).
2. **Deep Forest Green (`#1e3b2f`) — 20-30%:** Warna identitas struktural, tajuk penekanan, batas kartu aktif, dan lambang pasar modal yang bertumbuh (*bullish green*). Teks dan tautan berkarakter gelap pekat (`#142820`) dengan kontras tinggi demi memenuhi standar WCAG AA/AAA.
3. **Sage Olive Green (`#7f8c6a`) — 10%:** Elemen interaktif, bilah progres kuota SPM, status menu aktif, dan efek sorotan (*hover*).
4. **Warm Sand Gold (`#c8b48a`) — 10%:** Aksen prestise dan konversi untuk Primary CTA (**"Daftar SPM"**, **"Buat Link Aktivasi"**) dan lencana peran tinggi (**Presidium** & **Creator**). Teks di atas warna emas selalu gelap pekat (`#142820`) agar terbaca tajam dan berwibawa.

---

## 🚀 Panduan Menjalankan Proyek di Lokal

### 1. Konfigurasi Lingkungan (`.env.local`)
Pastikan file `.env.local` telah terisi kredensial Firebase Client dan Firebase Admin SDK:
```env
APP_URL=http://localhost:3000
CREATOR_EMAILS=email.anda@gmail.com

FIREBASE_API_KEY=AIzaSy...
FIREBASE_AUTH_DOMAIN=gibei-prod.firebaseapp.com
FIREBASE_STORAGE_BUCKET=gibei-prod.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_APP_ID=...

FIREBASE_PROJECT_ID=gibei-prod
GCLOUD_PROJECT=gibei-prod
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 2. Menjalankan Server Pengembangan Next.js
Jalankan perintah berikut:
```bash
npm run dev
```
Akses aplikasi melalui peramban: `http://localhost:3000`

---

## 🔐 Alur Uji Coba Autentikasi & Link Aktivasi

### A. Login Akun Creator Pertama Kali (Auto-Bootstrap)
1. Buka `http://localhost:3000/login`.
2. Masukkan email Creator yang terdaftar di `.env.local` atau klik **Masuk dengan Google**.
3. Sistem secara otomatis mendeteksi email Creator, menetapkan role tertinggi **Creator**, serta menyemai data periode aktif (`2026-2027`) dan **7 Master Divisi** (Presidium + 6 Divisi Resmi) jika database masih kosong.
4. Anda akan langsung dialihkan ke `/dashboard` dengan hak akses penuh.

### B. Membuat Link Aktivasi Pengurus Baru
1. Masuk ke menu **Link Aktivasi** (`/dashboard/aktivasi`).
2. Klik tombol emas **"Buat Link Aktivasi"**.
3. Pilih peran tujuan (**Master Admin/Presidium**, **Admin/Kadiv**, atau **User/Anggota**), divisi kerja, nama jabatan resmi, dan masa berlaku token.
4. Klik **Generate Link**, lalu klik **Salin** untuk mendapatkan URL unik sekali pakai (`/aktivasi/[token]`).

### C. Aktivasi Pengurus Baru
1. Buka tautan `/aktivasi/[token]` di jendela peramban (bisa di mode Incognito).
2. Calon pengurus dapat menghubungkan akun Google atau membuat email/password baru.
3. Isi biodata (Nama Lengkap, NIM, Fakultas/Prodi, WhatsApp, dan tautan foto).
4. Klik tombol emas **"Selesaikan Aktivasi Pengurus"**.
5. Sistem mengunci role sesuai undangan, menandai token menjadi `USED` dalam transaksi Firestore atomik, dan menambahkan profil pengurus secara otomatis ke halaman struktur publik (`/struktur`).

---

## 🗺️ Peta Halaman (Tahap 1)

* **Area Publik:**
  * `/` — Beranda (Hero, Bento Grid 6 divisi, cuplikan batch SPM, banner ajakan)
  * `/tentang` — Visi, Misi kabinet aktif, sejarah kemitraan BEI
  * `/struktur` — Bagan kepengurusan interaktif (filter per Divisi membaca data `board_members` nyata)
  * `/kegiatan` — Daftar kegiatan & Sekolah Pasar Modal dengan bilah kuota progres
  * `/artikel` — Portal artikel edukasi & riset pasar modal
  * `/galeri` — Dokumentasi foto kegiatan
  * `/kontak` — Informasi kontak, lokasi Galeri BEI di FE UNIMED, formulir pesan
* **Area Autentikasi:**
  * `/login` — Masuk pengurus internal (Email/Password & Google)
  * `/aktivasi/[token]` — Halaman dinamis aktivasi pengurus via token unik sekali pakai
* **Area Dashboard Internal (Terproteksi Role Guard):**
  * `/dashboard` — Ringkasan adaptif menyesuaikan 5 tingkatan role
  * `/dashboard/profil` — Biodata pengurus
  * `/dashboard/aktivasi` — Generator & tabel riwayat tautan aktivasi
  * `/dashboard/kepengurusan` — Kerangka manajemen kepengurusan (Tahap 2)
  * `/dashboard/event-spm` — Kerangka manajemen SPM & sinkronisasi Google Sheets (Tahap 3)
  * `/dashboard/artikel` — Kerangka alur approval artikel (Tahap 2)
  * `/dashboard/galeri` — Kerangka moderasi foto dokumentasi (Tahap 2)
  * `/dashboard/sistem` — Konsol Creator: log audit keamanan & konfigurasi integrasi

---

## 🧪 Pengujian Logika Otomatis

Jalankan pengujian unit berbasis Vitest:
```bash
npm run test
```
Memvalidasi:
* Hirarki 5 tingkatan RBAC (`hasMinRole`)
* Aturan wewenang pembuatan undangan (`canIssueInvite` untuk Creator, Presidium, Kadiv HRD)
* Validasi Zod schema aktivasi & token
