# Dokumen Perancangan Sistem (PRD & ERD Sementara)
**Nama Proyek:** Portal & Sistem Manajemen Organisasi Dinamis GIBEI UNIMED  
**Target Eksekusi:** Fondasi Awal (MVP Phase 1) & Arsitektur Keseluruhan  
**Platform Eksekusi:** Antigravity (Next.js App Router, Node.js, Firebase, Vercel)  

---

## BAGIAN 1: PRODUCT REQUIREMENTS DOCUMENT (PRD)

### 1.1 Visi & Tujuan Produk
Membangun platform web organisasi dinamis bagi **Galeri Investasi Bursa Efek Indonesia Universitas Negeri Medan (GIBEI UNIMED)** yang memadukan estetika finansial modern dengan tata kelola internal yang terstruktur:
1. **Portal Informasi & Edukasi Publik:** Menampilkan profil organisasi, struktur kepengurusan multi-periode, informasi kegiatan/event, pendaftaran Sekolah Pasar Modal (SPM), artikel edukasi pasar modal, dan galeri dokumentasi dengan pengalaman pengguna (UX) yang intuitif dan responsif.
2. **Sistem Manajemen Internal Bertingkat (RBAC):** Dashboard adaptif berdasarkan tingkat wewenang bagi Anggota, Kepala Divisi (6 Divisi), Presidium, dan Creator untuk mengelola konten secara mandiri (CRUD) serta terhubung dengan Google Form dan Google Spreadsheet.

---

### 1.2 Arsitektur Teknologi (Tech Stack)
* **Framework Utama:** Next.js (App Router) dengan pemisahan rute Publik dan Dashboard Internal.
* **Backend & API Layer:** Node.js (melalui Next.js Route Handlers & Server Actions).
* **Database & Autentikasi:** Firebase (Firestore Database & Firebase Authentication).
* **Integrasi Eksternal:** Google Sheets API & Google Form Webhook (khususnya untuk pencatatan data teks pendaftaran SPM & Event).
* **Hosting & Deployment:** Vercel.

---

### 1.3 Standar Desain UI/UX & Identitas Visual (Design System)

Untuk menciptakan kesan institusi pasar modal yang modern, energik, terpercaya, dan prestisius, seluruh antarmuka web wajib mengikuti sistem desain berikut:

#### A. Palet Warna Resmi & Proporsi Penggunaan (Aturan 60-30-10)
1. **Pure White (`#ffffff`) — Dominan Kanvas (60%):**
   * Digunakan sebagai latar belakang utama halaman, permukaan kartu konten (*card surface*), area baca artikel, dan ruang kosong (*whitespace*) agar tampilan terasa bersih, lega, dan profesional.
   * Dapat dipadukan dengan turunan permukaan halus bernuansa biru-sian sangat muda untuk membedakan bagian (*section*) tanpa merusak kesan dominan putih.
2. **Bright Cerulean Blue (`#29abe2`) & Vibrant Cyan (`#05c3d3`) — Identitas Primer & Interaktif (30%):**
   * **`#29abe2` (Cerulean Blue):** Digunakan untuk elemen struktural, tajuk penekanan, ikon kategori, batas kartu aktif, serta perpaduan gradasi modern dengan `#05c3d3` pada *Hero Banner* atau kartu sorotan.
   * **`#05c3d3` (Vibrant Cyan):** Digunakan untuk status menu aktif, indikator progres kuota SPM, tautan interaktif, efek sorot saat kursor diarahkan (*hover state*), dan aksen visual yang dinamis.
3. **Capital Market Gold (`#e0bd1e`) — Aksen Prestise & Konversi (10%):**
   * Digunakan secara selektif untuk menarik perhatian tertinggi: tombol ajakan bertindak utama (*Primary CTA* seperti **"Daftar SPM"** atau **"Buat Link Aktivasi"**), lencana (*badge*) peran tinggi (**Presidium** & **Creator**), sorotan pencapaian organisasi, serta garis aksen elegan.

#### B. Aturan Kontras & Tipografi (Keterbacaan & Aksesibilitas)
* **Kontras Teks Tinggi:** Karena `#05c3d3`, `#29abe2`, dan `#e0bd1e` merupakan warna cerah, teks di atas latar `#ffffff` harus menggunakan warna gelap netral pekat agar nyaman dibaca dalam waktu lama. Sebaliknya, teks di atas tombol atau lencana berwarna emas (`#e0bd1e`) wajib menggunakan teks gelap pekat agar memenuhi standar aksesibilitas kontras tinggi (WCAG AA/AAA).
* **Hierarki Tipografi:** Menggunakan pasangan huruf modern (*sans-serif* geometris/humanis yang bersih) dengan pembedaan ukuran dan ketebalan yang tegas antara judul utama, subjudul, angka statistik pasar modal/kuota, dan isi artikel.

#### C. Maksimalisasi Pengalaman Pengguna (UX Principles)
1. **Antarmuka Publik (Mobile-First & Konversi Tinggi):**
   * **Bilah Navigasi Mengambang (*Sticky Glass Header*):** Navigasi atas semi-transparan di atas latar `#ffffff` yang tetap terjangkau saat halaman digulir, dilengkapi menu laci (*drawer*) responsif di layar ponsel.
   * **Tata Letak *Bento Grid*:** Penyajian program unggulan, statistik anggota/SPM, dan highlight 6 divisi menggunakan kartu-kartu modular bergaya *Bento* dengan sudut membulat halus dan bayangan lembut (*soft elevation*).
   * **Kartu SPM & Event Interaktif:** Menampilkan status pendaftaran (Buka/Penuh/Selesai) dengan kode warna jelas, sisa kuota dalam bentuk bilah progres (`#05c3d3` ke `#29abe2`), serta tombol daftar emas (`#e0bd1e`) yang langsung membuka formulir ringkas berbasis teks.
   * **Filter Instan Tanpa Reload:** Halaman Struktur Kepengurusan (filter per Periode & Divisi) dan Galeri (filter per Divisi/Event) dirancang interaktif dengan transisi halus.
2. **Antarmuka Dashboard Internal (Efisiensi Operasional & Adaptif Peran):**
   * **Navigasi Samping (*Collapsible Sidebar*) Kontekstual:** Menu otomatis menyesuaikan 5 tingkatan *role* dan 6 divisi, dilengkapi lencana identitas warna (*Role Badge* emas `#e0bd1e` untuk Presidium/Creator, biru `#29abe2` untuk Kadiv, dan sian `#05c3d3` untuk Anggota).
   * **Umpan Balik Visual & Status Sistem:** Menerapkan *Skeleton Loading* saat mengambil data dari Firebase, notifikasi *Toast* instan setiap kali aksi berhasil atau gagal, tampilan *Empty State* yang ramah saat data belum tersedia, serta dialog konfirmasi sebelum menghapus data atau mencabut token aktivasi.

---

### 1.4 Struktur Organisasi & Pemetaan 6 Divisi Resmi
Sistem mengunci struktur entitas divisi resmi GIBEI UNIMED sebagai berikut:
0. **Presidium Inti** (Pemegang hak akses *Master Admin*)
1. **Divisi Kegiatan** (Pelaksanaan *event*, seminar, dan program kerja umum)
2. **Divisi Investasi** (Riset pasar modal, analisis emiten, dan edukasi investasi lanjutan)
3. **Divisi HRD** (Pengembangan SDM internal, database pengurus, dan distribusi link aktivasi anggota)
4. **Divisi Media** (Publikasi informasi, pengelolaan artikel berita, dan branding digital)
5. **Divisi Galeri** (Operasional harian Galeri Investasi BEI dan dokumentasi foto kegiatan)
6. **Divisi Edukasi** (Penyelenggaraan Sekolah Pasar Modal / SPM dan kurikulum literasi pasar modal)

---

### 1.5 Hirarki 5 Tingkatan Pengguna & Perbedaan Antarmuka

1. **Public (Mahasiswa Umum & Masyarakat — Tanpa Login)**
   * **Antarmuka:** Halaman Publik (*Landing Page*, Tentang, Struktur Kepengurusan, Event & SPM, Artikel, Galeri, Kontak).
   * **Wewenang:** Membaca seluruh informasi publik dan mengisi formulir pendaftaran Event/SPM berbasis data teks.
2. **User (Anggota GIBEI — Login via Aktivasi)**
   * **Antarmuka:** Halaman Publik + **Member Dashboard**.
   * **Wewenang:** Mengelola profil pribadi, menulis draf artikel edukasi/riset (status *Draft* / *Pending Review*), mengunggah foto dokumentasi ke antrean galeri, dan melihat agenda internal.
3. **Admin (Kepala Divisi / Kadiv — Login via Aktivasi)**
   * **Antarmuka:** Halaman Publik + **Division Admin Dashboard** (menu menyesuaikan 6 divisi yang dipimpin).
   * **Wewenang:** Melakukan CRUD program kerja/event divisinya, mengelola jadwal & kuota SPM (khusus divisi terkait), menyetujui (*Publish*) draf artikel dari anggota divisinya, serta mengelola galeri divisi.
4. **Master Admin (Presidium GIBEI — Login via Aktivasi)**
   * **Antarmuka:** Halaman Publik + **Executive Master Dashboard**.
   * **Wewenang:** Kendali penuh (*Full CRUD*) lintas seluruh divisi, membuat **Link Aktivasi** untuk Anggota dan Kadiv, mengatur periode kabinet & susunan kepengurusan, serta memantau seluruh data pendaftar SPM/Event.
5. **Creator (Developer / Superuser — Anda)**
   * **Antarmuka:** Seluruh tampilan + **Creator System Console**.
   * **Wewenang:** Akses tertinggi sistem, membuat **Link Aktivasi** untuk Presidium maupun role di bawahnya, melihat **Audit Log** aktivitas perubahan data, mengatur kredensial integrasi Google Spreadsheet/Firebase, dan mengatur mode pemeliharaan (*Maintenance Mode*).

---

### 1.6 Peta Rute Halaman (Sitemap Struktur Awal)

* **Area Publik:**
  * `/` — Beranda (*Hero section*, highlight SPM/Event, artikel terbaru, ringkasan 6 divisi dalam tata letak *Bento Grid*)
  * `/tentang` — Profil GIBEI UNIMED, Visi & Misi periode aktif
  * `/struktur` — Bagan & daftar kepengurusan (Presidium & 6 Divisi, mendukung filter periode)
  * `/kegiatan` — Daftar Event divisi & jadwal Sekolah Pasar Modal (SPM) + form pendaftaran teks
  * `/artikel` — Portal artikel edukasi & riset pasar modal
  * `/galeri` — Dokumentasi foto kegiatan per divisi/event
  * `/kontak` — Informasi kontak & lokasi Galeri Investasi
* **Area Autentikasi & Onboarding:**
  * `/login` — Halaman masuk khusus pengurus internal (Anggota, Kadiv, Presidium, Creator)
  * `/aktivasi/[token]` — Halaman pendaftaran khusus pengurus baru menggunakan Link Aktivasi unik sekali pakai
* **Area Dashboard Internal (Terproteksi Role Guard):**
  * `/dashboard` — Ringkasan otomatis yang menyesuaikan tampilan berdasarkan *role* pengguna
  * `/dashboard/profil` — Pengaturan biodata & foto pengurus
  * `/dashboard/aktivasi` — Generator & pelacakan status Link Aktivasi (Presidium, Creator, serta HRD untuk anggota)
  * `/dashboard/kepengurusan` — Manajemen periode kabinet, divisi, & daftar pengurus
  * `/dashboard/event-spm` — Manajemen Event, Batch SPM, kuota, & sinkronisasi Google Spreadsheet
  * `/dashboard/artikel` — Editor tulisan & alur persetujuan artikel (*Draft* $\rightarrow$ *Published*)
  * `/dashboard/galeri` — Unggah & moderasi album foto dokumentasi
  * `/dashboard/sistem` — *Audit Log*, pengaturan API Spreadsheet, & manajemen akses (Khusus Creator)

---

### 1.7 Tahapan Eksekusi Bertahap (Roadmap Pembangunan)

* **Tahap 1 — Fondasi Sistem, Design System & Autentikasi (Fokus Awalan):**
  1. Inisialisasi struktur proyek Next.js App Router, konfigurasi Firebase (Auth & Firestore), dan penerapan **Design System Palet Warna (`#05c3d3`, `#e0bd1e`, `#29abe2`, `#ffffff`)** beserta komponen UI/UX dasar yang responsif.
  2. Pembuatan *Role Guard* & sistem proteksi rute untuk 5 tingkatan akses.
  3. Pembuatan mekanisme akun awal **Creator** dan fitur **Generator Link Aktivasi** (`activation_invites`) beserta halaman `/aktivasi/[token]` yang langsung menyimpan profil pengurus ke database.
  4. Pembuatan antarmuka Publik modern dan kerangka *Sidebar Dashboard* yang dinamis menyesuaikan 5 *role* dan 6 divisi.
* **Tahap 2 — Modul Dinamis Inti (CRUD):**
  1. CRUD Periode & Kepengurusan (Presidium + 6 Divisi).
  2. CRUD Artikel & Riset (lengkap dengan alur persetujuan Anggota $\rightarrow$ Kadiv/Presidium).
  3. CRUD Galeri Dokumentasi.
* **Tahap 3 — Modul Event, SPM & Integrasi Google Ecosystem:**
  1. CRUD Event & Batch Sekolah Pasar Modal (SPM).
  2. Formulir pendaftaran SPM berbasis data teks dengan penyimpanan ganda ke Firestore dan Google Spreadsheet secara otomatis, serta opsi tautan Google Form.
  3. Penyelesaian *Audit Log* & pengaturan sistem di *Creator Console*.

---

## BAGIAN 2: ENTITY RELATIONSHIP DIAGRAM (ERD)

### 2.1 Diagram Relasi Koleksi (Firestore NoSQL)

```
[ACTIVATION_INVITES (Link Aktivasi)] ──(1x pakai)──► [USERS (Akun & Role)]
                                                             │
[PERIODS (Periode Kabinet)] 1 ──── * [DIVISIONS (6 Divisi)]  │ 1
         │                                   │               │
         │ 1                                 │ 1             ▼ *
         ▼ *                                 ▼ *      [AUDIT_LOGS (Log Sistem)]
[BOARD_MEMBERS (Profil Pengurus)] * ─────── 1 [USERS]
                                                │
                       ┌────────────────────────┼────────────────────────┐
                       │ 1                      │ 1                      │ 1
                       ▼ *                      ▼ *                      ▼ *
               [ARTICLES (Artikel)]     [EVENTS_AND_SPM]         [GALLERIES (Album)]
                                                │ 1
                                                ▼ *
                                    [REGISTRATIONS (Data Teks)]
                                                │
                                                └──► (Sync Otomatis ke Google Spreadsheet)
```

---

### 2.2 Kamus Data Koleksi (Data Dictionary)

#### 1. `activation_invites` (Token Undangan Pengurus)
* `token` *(PK, String)* — Kode token acak unik untuk URL aktivasi.
* `target_role` *(Enum)* — `member` | `admin_kadiv` | `master_presidium`.
* `period_id` *(FK $\rightarrow$ `periods.id`)* — Periode kabinet yang dituju.
* `division_id` *(FK $\rightarrow$ `divisions.id`)* — Salah satu dari 6 divisi resmi atau Presidium Inti.
* `assigned_position` *(String)* — Jabatan yang ditetapkan (misal: "Kepala Divisi Edukasi", "Staf Divisi Investasi").
* `recipient_name_hint` *(String)* — Catatan nama calon penerima link.
* `status` *(Enum)* — `PENDING` | `USED` | `EXPIRED` | `REVOKED`.
* `created_by` *(FK $\rightarrow$ `users.uid`)* — Pembuat link (Creator / Presidium / HRD untuk tingkat anggota).
* `used_by_uid` *(FK $\rightarrow$ `users.uid`, Nullable)* — UID akun yang memakai link.
* `expires_at` & `created_at` *(Timestamp)*.

#### 2. `users` (Akun & Hak Akses)
* `uid` *(PK, String)* — ID unik dari Firebase Authentication.
* `email` *(String)* — Alamat email aktif.
* `full_name` *(String)* — Nama lengkap pengurus.
* `nim` *(String)* — Nomor Induk Mahasiswa.
* `faculty_major` *(String)* — Fakultas dan Program Studi.
* `phone_whatsapp` *(String)* — Nomor WhatsApp.
* `avatar_url` *(String)* — Tautan foto profil.
* `role` *(Enum)* — `public` | `member` | `admin_kadiv` | `master_presidium` | `creator`.
* `division_id` *(FK $\rightarrow$ `divisions.id`, Nullable)* — Divisi pengurus.
* `is_active` *(Boolean)* — Status keaktifan akun.
* `created_at` & `last_login` *(Timestamp)*.

#### 3. `periods` (Periode Kepengurusan)
* `id` *(PK, String)* — Contoh: `2026-2027`.
* `cabinet_name` *(String)* — Nama kabinet kepengurusan.
* `year_range` *(String)* — Rentang tahun kepengurusan.
* `vision` *(Text)* — Visi kabinet.
* `missions` *(Array of Strings)* — Daftar misi kabinet.
* `is_current` *(Boolean)* — Menandakan periode aktif saat ini.

#### 4. `divisions` (Master 6 Divisi & Presidium)
* `id` *(PK, String)*
* `period_id` *(FK $\rightarrow$ `periods.id`)*
* `code` *(Enum)* — `PRESIDIUM` | `KEGIATAN` | `INVESTASI` | `HRD` | `MEDIA` | `GALERI` | `EDUKASI`.
* `name` *(String)* — Nama resmi divisi.
* `slug` *(String)* — Slug URL divisi.
* `description` *(Text)* — Deskripsi tugas pokok divisi.
* `head_user_id` *(FK $\rightarrow$ `users.uid`, Nullable)* — UID Kadiv yang memimpin.

#### 5. `board_members` (Data Tampil Struktur Kepengurusan)
* `id` *(PK, String)*
* `period_id` *(FK $\rightarrow$ `periods.id`)*
* `division_id` *(FK $\rightarrow$ `divisions.id`)*
* `user_id` *(FK $\rightarrow$ `users.uid`)* — Terisi otomatis saat aktivasi akun selesai.
* `full_name` *(String)* — Nama yang tampil di halaman struktur publik.
* `position_title` *(String)* — Jabatan organisasi.
* `order_index` *(Number)* — Urutan prioritas tampilan.
* `photo_url` *(String)* — URL foto resmi.
* `social_links` *(Map)* — Tautan LinkedIn / Instagram.

#### 6. `events_and_spm` (Data Event & Batch Sekolah Pasar Modal)
* `id` *(PK, String)*
* `category_type` *(Enum)* — `SPM` | `SEMINAR` | `COMPETITION` | `WORKPROGRAM`.
* `spm_level` *(Enum, Nullable)* — `NONE` | `LEVEL_1` | `LEVEL_2` | `LEVEL_3`.
* `division_id` *(FK $\rightarrow$ `divisions.id`)* — Divisi penyelenggara.
* `title` *(String)* — Judul kegiatan / Batch SPM.
* `slug` *(String)* — URL halaman detail.
* `description` *(Rich Text)* — Penjelasan detail kegiatan.
* `poster_url` *(String)* — URL poster kegiatan.
* `start_date` & `end_date` *(Timestamp)* — Jadwal kegiatan.
* `registration_deadline` *(Timestamp)* — Batas pendaftaran.
* `location_or_link` *(String)* — Lokasi kegiatan atau tautan pertemuan daring.
* `quota` *(Number)* — Batas maksimal peserta.
* `registered_count` *(Number)* — Jumlah pendaftar masuk.
* `registration_mode` *(Enum)* — `INTERNAL_FORM` | `EXTERNAL_GFORM`.
* `gform_url` *(String, Nullable)* — Tautan Google Form eksternal (opsional).
* `spreadsheet_id` *(String, Nullable)* — ID Google Spreadsheet untuk sinkronisasi data teks.
* `sheet_tab_name` *(String, Nullable)* — Nama lembar kerja (*tab*) tujuan.
* `status` *(Enum)* — `DRAFT` | `OPEN` | `CLOSED` | `COMPLETED`.
* `created_by` *(FK $\rightarrow$ `users.uid`)*.

#### 7. `registrations` (Pendaftar Event & SPM — Data Teks)
* `id` *(PK, String)*
* `event_id` *(FK $\rightarrow$ `events_and_spm.id`)*
* `participant_name` *(String)* — Nama lengkap peserta.
* `participant_email` *(String)* — Email peserta.
* `participant_nim` *(String)* — NIM / Identitas peserta.
* `participant_phone` *(String)* — Nomor WhatsApp aktif.
* `institution_faculty` *(String)* — Fakultas / Jurusan / Instansi.
* `has_rdn` *(Boolean)* — Status kepemilikan RDN (khusus SPM).
* `attendance_status` *(Enum)* — `REGISTERED` | `ATTENDED` | `ABSENT`.
* `synced_to_sheet` *(Boolean)* — Penanda status sinkronisasi ke Google Spreadsheet.
* `registered_at` *(Timestamp)*.

#### 8. `articles` (Artikel & Edukasi Pasar Modal)
* `id` *(PK, String)*
* `title` *(String)*
* `slug` *(String)*
* `thumbnail_url` *(String)*
* `content` *(Rich Text)*
* `category` *(String)*
* `tags` *(Array of Strings)*
* `author_id` *(FK $\rightarrow$ `users.uid`)*
* `division_id` *(FK $\rightarrow$ `divisions.id`)*
* `reviewer_id` *(FK $\rightarrow$ `users.uid`, Nullable)*
* `status` *(Enum)* — `DRAFT` | `PENDING_REVIEW` | `PUBLISHED` | `REJECTED`.
* `view_count` *(Number)*
* `published_at` & `updated_at` *(Timestamp)*.

#### 9. `galleries` (Dokumentasi Kegiatan)
* `id` *(PK, String)*
* `title` *(String)*
* `caption` *(Text)*
* `image_urls` *(Array of Strings)*
* `period_id` *(FK $\rightarrow$ `periods.id`)*
* `division_id` *(FK $\rightarrow$ `divisions.id`)*
* `event_id` *(FK $\rightarrow$ `events_and_spm.id`, Nullable)*
* `uploaded_by` *(FK $\rightarrow$ `users.uid`)*
* `status` *(Enum)* — `PENDING` | `PUBLISHED`.
* `activity_date` *(Timestamp)*.

#### 10. `audit_logs` (Log Keamanan & Aktivitas Sistem)
* `id` *(PK, String)*
* `actor_uid` *(FK $\rightarrow$ `users.uid`)*
* `actor_role` *(String)*
* `action` *(Enum)* — `CREATE` | `UPDATE` | `DELETE` | `PUBLISH` | `ROLE_CHANGE` | `INVITE_GENERATED` | `SYNC_SHEET`.
* `target_collection` *(String)*
* `target_id` *(String)*
* `summary` *(String)*
* `timestamp` *(Timestamp)*.