# Panduan & Kumpulan Prompt Eksekusi Antigravity — GIBEI UNIMED

Dokumen ini berisi rangkaian prompt lengkap dari awal hingga akhir (Tahap 1 s.d. Tahap 3) untuk diberikan secara bertahap kepada **Antigravity**:
* **Prompt Tahap 1:** Fondasi Sistem, Design System (`#05c3d3`, `#e0bd1e`, `#29abe2`, `#ffffff`), RBAC 5 Role, & Autentikasi Link Aktivasi.
* **Prompt Tahap 2:** Modul Konten Dinamis Inti (CRUD Kepengurusan Multi-Periode, CMS Artikel Berjenjang, & Galeri Dokumentasi).
* **Prompt Tahap 3:** Modul Event & Sekolah Pasar Modal (SPM), Integrasi Google Spreadsheet & Google Form, serta Creator System Console.

---

## Cara Menggunakan di Antigravity
1. Pastikan dokumen **PRD dan ERD Sistem Web Dinamis GIBEI UNIMED** tetap dilampirkan sebagai konteks acuan di ruang kerja Antigravity Anda.
2. Jalankan **Prompt Tahap 1** terlebih dahulu hingga fondasi, tampilan dasar, dan fitur *Link Aktivasi* berjalan stabil.
3. Setelah Tahap 1 selesai, salin **Prompt Tahap 2** untuk membangun fitur CRUD Kepengurusan, Artikel, dan Galeri.
4. Setelah Tahap 2 berjalan baik, salin **Prompt Tahap 3** untuk menyelesaikan fitur Event, SPM, integrasi Google Spreadsheet/Form, dan konsol kendali khusus Creator.
5. Selalu tinjau **Implementation Plan** yang diajukan Antigravity pada setiap tahap sebelum menyetujui eksekusi file.

---

## Prompt Tahap 1 (Fondasi Sistem, UI/UX Palet Resmi & Link Aktivasi)

> **Salin mulai dari paragraf di bawah ini untuk memulai Tahap 1 di Antigravity:**

Bertindaklah sebagai Senior Fullstack Architect sekaligus Lead UI/UX Designer yang ahli dalam Next.js (App Router), Node.js, Firebase (Auth & Firestore), dan sistem keamanan berbasis peran (RBAC). Kita akan membangun aplikasi web dinamis untuk organisasi pasar modal kampus bernama **GIBEI UNIMED** (Galeri Investasi Bursa Efek Indonesia Universitas Negeri Medan) yang nantinya di-hosting di Vercel.

Gunakan dokumen PRD dan ERD yang terlampir sebagai acuan utama arsitektur. Untuk tahap pertama ini, fokuslah membangun **Fondasi Sistem, Identitas Visual (Design System), dan Autentikasi Link Aktivasi (Tahap 1)** dengan kualitas desain premium dan arsitektur modular yang rapi.

Berikut adalah spesifikasi rinci yang harus kamu rancang dan bangun pada tahap awal ini:

1. **Penerapan Identitas Visual & Palet Warna Resmi (Wajib Konsisten):**
   * Gunakan secara eksklusif dan harmonis 4 palet warna utama berikut:
     * **Pure White (`#ffffff`)** sebagai latar belakang dominan (60%), permukaan kartu bersih (*clean card surface*), dan area baca yang lega.
     * **Bright Cerulean Blue (`#29abe2`)** sebagai warna identitas struktural (20%), tajuk penekanan, batas kartu aktif, dan perpaduan gradasi modern.
     * **Vibrant Cyan (`#05c3d3`)** sebagai warna interaktif utama (10%), indikator progres, status menu aktif, ikon, dan efek sorot (*hover*).
     * **Capital Market Gold (`#e0bd1e`)** sebagai aksen prestise dan konversi (10%) untuk tombol ajakan bertindak utama (*Primary CTA*), lencana peran tinggi (Presidium & Creator), serta penanda pencapaian penting.
   * **Aksesibilitas & Kontras:** Pastikan keterbacaan teks maksimal (standar WCAG AA/AAA). Gunakan teks gelap pekat yang tajam di atas permukaan putih (`#ffffff`) maupun di atas tombol atau lencana berwarna emas (`#e0bd1e`) agar tidak pernah terjadi teks putih pudar di atas warna cerah.

2. **Inisialisasi & Struktur Folder Next.js App Router:**
   * Gunakan pemisahan Route Groups yang tegas antara area publik, area autentikasi/aktivasi, dan area dashboard internal.
   * Siapkan struktur layanan terpusat untuk konfigurasi Firebase Client SDK, Firebase Admin SDK (untuk verifikasi sesi server dan operasi sensitif), serta definisi struktur data untuk seluruh entitas di ERD.
   * Siapkan berkas templat variabel lingkungan yang dibutuhkan untuk kredensial Firebase dan persiapan integrasi Google Sheets API.

3. **Sistem 5 Tingkatan Role & Proteksi Rute (RBAC):**
   * Terapkan 5 tingkatan akses: Publik (tanpa login), User/Anggota, Admin/Kadiv, Master Admin/Presidium, dan Creator (Superuser).
   * Kunci daftar 6 divisi resmi organisasi beserta Presidium Inti: Presidium, Kegiatan, Investasi, HRD, Media, Galeri, dan Edukasi.
   * Buat penjaga keamanan rute (Middleware & Server Guard) yang memastikan pengguna tanpa hak akses tidak dapat membuka halaman dashboard internal, serta mengarahkan setiap pengguna ke tampilan dashboard yang sesuai dengan perannya masing-masing.
   * Sediakan mekanisme inisialisasi awal yang aman (melalui variabel lingkungan email Creator) agar saat akun dengan email tersebut pertama kali masuk, sistem otomatis menetapkannya sebagai role tertinggi (Creator) dan membuatkan data periode serta 6 divisi awal secara otomatis jika database masih kosong.

4. **Alur Pendaftaran Khusus Pengurus melalui Link Aktivasi:**
   * Jangan sediakan tombol pendaftaran bebas untuk pengurus di halaman publik. Akun internal hanya bisa dibuat melalui Link Aktivasi unik sekali pakai.
   * Bangun halaman khusus aktivasi dengan rute dinamis berdasarkan token undangan dengan tampilan bersih berlatar `#ffffff`, aksen `#29abe2`/`#05c3d3`, dan tombol konfirmasi emas `#e0bd1e`. Saat tautan dibuka, sistem memvalidasi status token dari koleksi undangan di database. Jika valid, calon pengurus diminta membuat akun (Email/Password atau Google Sign-In) dan mengisi biodata dasar (Nama Lengkap, NIM, Fakultas/Prodi, Nomor WhatsApp, serta tautan foto).
   * Setelah selesai, sistem mengunci peran dan divisi pengguna sesuai data undangan, menandai token menjadi terpakai agar tidak bisa digunakan ulang, sekaligus otomatis menambahkan data pengurus tersebut ke koleksi struktur kepengurusan publik.
   * Bangun antarmuka Generator Link Aktivasi di dalam area dashboard bagi Creator dan Presidium (serta opsi khusus HRD untuk membuat link tingkat anggota) lengkap dengan tabel riwayat undangan, lencana status token berwarna jelas, dan tombol salin tautan instan dengan notifikasi umpan balik.

5. **Maksimalisasi UI/UX Area Publik & Kerangka Dashboard Dinamis:**
   * **Area Publik:** Bangun desain antarmuka modern yang responsif untuk perangkat seluler maupun desktop. Terapkan bilah navigasi mengambang semi-transparan di atas layar (*sticky glass header*), tata letak *Bento Grid* untuk menonjolkan program kerja dan 6 divisi, kartu kegiatan/SPM dengan bilah progres kuota sian-biru dan tombol daftar emas `#e0bd1e`, serta kerangka halaman lengkap untuk Beranda, Tentang, Struktur Kepengurusan (yang sudah bisa membaca data pengurus hasil aktivasi beserta filter divisi), Kegiatan & SPM, Artikel, Galeri, dan Kontak.
   * **Area Dashboard Internal:** Bangun tata letak dashboard profesional berlatar bersih dengan bilah navigasi samping (*collapsible sidebar*) yang menu-menunya berubah secara dinamis menyesuaikan 5 tingkatan peran dan 6 divisi pengguna. Lengkapi dengan lencana identitas peran berwarna sesuai palet, kartu ringkasan statistik, komponen *Skeleton Loading* saat memuat data, notifikasi *Toast* interaktif, dan tampilan *Empty State* yang informatif.

Sebelum mulai menulis atau mengubah file apa pun, susun terlebih dahulu **Rencana Implementasi (Implementation Plan)** secara terperinci mencakup penerapan token palet warna, struktur folder, alur autentikasi sesi, skema keamanan Firestore, dan daftar halaman yang akan dibuat agar dapat saya tinjau terlebih dahulu.

---

## Prompt Tahap 2 (Modul Konten Dinamis Inti: CRUD Kepengurusan, Artikel & Galeri)

> **Gunakan prompt di bawah ini setelah Tahap 1 selesai. Salin mulai dari paragraf berikut ke Antigravity:**

Lanjutkan pengembangan proyek **GIBEI UNIMED** ke **Tahap 2: Modul Konten Dinamis Inti (CRUD Kepengurusan Multi-Periode, CMS Artikel Berjenjang, dan Galeri Dokumentasi)**. Tetap patuhi seluruh acuan pada dokumen PRD dan ERD serta pertahankan konsistensi **Design System** (`#ffffff` dominan, `#29abe2` Cerulean Blue, `#05c3d3` Vibrant Cyan, dan `#e0bd1e` Capital Market Gold dengan kontras keterbacaan tinggi).

Fokus pada tahap kedua ini adalah menghidupkan fitur pengelolaan data dinamis (CRUD) di dalam Dashboard Internal sesuai wewenang 5 tingkatan *role* dan 6 divisi resmi, serta menghubungkannya secara langsung ke halaman-halaman Publik.

Berikut adalah spesifikasi fungsional dan UI/UX yang harus kamu rancang dan bangun pada Tahap 2 ini:

1. **Modul Manajemen Periode Kabinet & Struktur Kepengurusan Dinamis:**
   * **Kelola Periode Kabinet (Khusus Presidium & Creator):**
     * Bangun antarmuka CRUD di dashboard untuk mengelola periode kepengurusan (Nama Kabinet, Rentang Tahun, Visi, daftar Misi, dan saklar penanda Periode Aktif Saat Ini).
     * Terapkan logika pergantian kabinet yang aman: ketika satu periode diatur menjadi aktif, periode lainnya otomatis beralih menjadi arsip historis tanpa menghapus data pengurus di dalamnya.
   * **Kelola Data Pengurus & 6 Divisi (Sesuai Tingkatan Role):**
     * **Presidium & Creator:** Memiliki akses penuh (Tambah, Edit, Ubah Urutan Tampil, Hapus/Nonaktifkan) untuk seluruh profil pengurus lintas Presidium Inti dan 6 Divisi (Kegiatan, Investasi, HRD, Media, Galeri, Edukasi), serta dapat menetapkan Kepala Divisi pada masing-masing divisi.
     * **Kadiv (Admin Divisi) & Divisi HRD:** Dapat memperbarui data jabatan, urutan tampil, foto, dan tautan media sosial pengurus di dalam divisinya (serta HRD dapat membantu merapikan database anggota lintas divisi).
   * **Integrasi Halaman Publik (`/tentang` & `/struktur`):**
     * Hubungkan halaman Tentang GIBEI agar otomatis menampilkan Nama Kabinet, Visi, dan Misi dari periode yang sedang aktif.
     * Bangun ulang halaman Struktur Kepengurusan agar sepenuhnya dinamis membaca dari database, dilengkapi **Pemilih Periode Kabinet** (agar pengunjung bisa melihat kepengurusan aktif maupun arsip periode terdahulu) serta **Tab Filter 6 Divisi** yang berpindah secara mulus tanpa memuat ulang halaman.

2. **Modul CMS Artikel & Edukasi Pasar Modal dengan Alur Persetujuan (Approval Workflow):**
   * **Alur Kerja Berjenjang Berbasis Role:**
     * **Anggota (User):** Dapat membuat artikel baru, menyimpan sebagai *Draft*, atau mengirimkannya ke status *Pending Review*. Anggota hanya dapat mengedit atau menghapus draf miliknya sendiri yang belum diterbitkan.
     * **Kadiv (Admin Divisi):** Dapat menulis artikel sekaligus memiliki panel kurasi untuk meninjau artikel berstatus *Pending Review* dari anggota divisinya, kemudian memilih untuk **Menerbitkan (*Published*)** atau **Menolak/Meminta Revisi (*Rejected*)** disertai catatan umpan balik.
     * **Presidium (Master Admin) & Creator:** Memiliki kendali penuh untuk membuat, mengedit, langsung menerbitkan, menarik kembali publikasi (*Unpublish*), atau menghapus artikel dari seluruh divisi.
   * **Antarmuka Editor & Manajemen Artikel di Dashboard:**
     * Sediakan editor penulisan yang rapi dan nyaman digunakan, dilengkapi input Judul, Slug URL otomatis, Kategori (Edukasi Dasar, Analisis Emiten, Berita GIBEI, Opini Ekonomi), Tagar (*Tags*), pratinjau gambar sampul, serta filter tabel berdasarkan status (*Draft*, *Pending Review*, *Published*, *Rejected*) dengan lencana warna yang tegas.
   * **Integrasi Halaman Publik (`/artikel` dan `/artikel/[slug]`):**
     * Halaman daftar artikel hanya menampilkan tulisan berstatus *Published*, dilengkapi bilah pencarian kata kunci instan, filter kategori, kartu artikel unggulan (*featured*), dan penghitung jumlah pembaca.
     * Halaman baca detail artikel dirancang fokus pada kenyamanan literasi di atas kanvas putih (`#ffffff`), menampilkan profil singkat pengurus penulis beserta divisinya, tanggal terbit, waktu baca, dan rekomendasi artikel terkait di bagian bawah.

3. **Modul Galeri & Dokumentasi Kegiatan Dinamis:**
   * **Alur Unggah & Moderasi Dokumentasi:**
     * **Anggota (User):** Dapat mengunggah dokumentasi foto kegiatan (mendukung banyak tautan foto dalam satu album kegiatan, judul, deskripsi singkat, tanggal pelaksanaan, serta pilihan divisi dan periode) yang masuk dengan status awal *Pending*.
     * **Kadiv (khususnya Divisi Galeri/Media & Kadiv terkait), Presidium, dan Creator:** Dapat langsung menerbitkan album dokumentasi baru, mengedit detail album, serta menyetujui unggahan anggota agar tampil ke publik (*Published*).
   * **Integrasi Halaman Publik (`/galeri` & Sorotan Beranda):**
     * Tampilkan album dokumentasi berstatus *Published* dalam tata letak *Bento / Masonry Grid* yang estetis dengan efek transisi halus.
     * Sediakan fitur filter instan berdasarkan **6 Divisi** dan **Periode Kabinet**, serta fitur jendela pratinjau layar penuh (*Lightbox Modal*) saat kartu galeri diklik untuk melihat seluruh foto dalam satu kegiatan beserta keterangan lengkapnya.
     * Perbarui halaman Beranda (`/`) agar bagian artikel terbaru dan momen kegiatan/galeri otomatis menarik data *Published* paling mutakhir dari database.

4. **Pencatatan Audit Log & Standar Pengalaman Pengguna (UX):**
   * Setiap tindakan krusial pada Tahap 2 ini (mengubah periode aktif, menyetujui/menolak artikel, menghapus pengurus, atau menghapus album galeri) wajib dicatat secara otomatis ke dalam koleksi log audit sistem agar dapat dipantau oleh Creator.
   * Pastikan seluruh formulir CRUD memiliki validasi input yang jelas, indikator pemuatan (*Skeleton* / *Spinner*), notifikasi *Toast* saat aksi berhasil/gagal, serta dialog konfirmasi sebelum menghapus data.

Sebelum mengeksekusi pembuatan atau perubahan file, susunlah **Rencana Implementasi (Implementation Plan) Tahap 2** terlebih dahulu yang merinci alur layanan data, aturan validasi hak akses di sisi server, dan daftar komponen yang akan dibangun atau diperbarui untuk saya tinjau.

---

## Prompt Tahap 3 (Event, Sekolah Pasar Modal, Integrasi Google Ecosystem & Creator Console)

> **Gunakan prompt di bawah ini setelah Tahap 2 selesai. Salin mulai dari paragraf berikut ke Antigravity:**

Lanjutkan pengembangan proyek **GIBEI UNIMED** ke tahap penyelesaian akhir, yaitu **Tahap 3: Modul Event & Sekolah Pasar Modal (SPM), Integrasi Otomatis Google Spreadsheet & Google Form, serta Creator System Console**. Tetap patuhi seluruh acuan pada dokumen PRD dan ERD serta pertahankan konsistensi **Design System** (`#ffffff` dominan, `#29abe2` Cerulean Blue, `#05c3d3` Vibrant Cyan, dan `#e0bd1e` Capital Market Gold dengan kontras keterbacaan tinggi).

Fokus pada tahap ketiga ini adalah membangun sistem pendaftaran kegiatan berbasis data teks yang terhubung langsung ke Google Spreadsheet/Google Form, manajemen kuota peserta otomatis, serta ruang kendali penuh (*System Console*) khusus untuk *role* Creator.

Berikut adalah spesifikasi fungsional dan UI/UX yang harus kamu rancang dan bangun pada Tahap 3 ini:

1. **Modul Manajemen Event & Sekolah Pasar Modal (SPM) Dinamis (`/dashboard/event-spm`):**
   * **Pembagian Wewenang Berdasarkan Role & Divisi:**
     * **Kadiv Edukasi:** Memiliki akses fokus untuk membuat dan mengelola jadwal **Sekolah Pasar Modal (SPM)** (Level 1, Level 2, Level 3), mengatur kuota kursi, tenggat waktu pendaftaran, lokasi/tautan ruang daring, serta memantau pendaftar SPM.
     * **Kadiv Divisi Lainnya (Kegiatan, Investasi, HRD, Media, Galeri):** Dapat melakukan CRUD untuk program kerja, seminar, atau kompetisi yang diselenggarakan oleh divisinya masing-masing.
     * **Presidium (Master Admin) & Creator:** Memiliki kendali penuh (*Full CRUD*) atas seluruh Event dan Batch SPM lintas divisi, termasuk membuka/menutup paksa status pendaftaran dan mengelola konfigurasi Spreadsheet tujuan.
     * **Anggota (User):** Dapat melihat jadwal agenda internal dan membantu menandai daftar kehadiran (*absensi*) peserta pada kegiatan divisinya.
   * **Manajemen Kuota & Status Otomatis:**
     * Setiap kegiatan memiliki batas maksimal peserta (`quota`), jumlah pendaftar saat ini (`registered_count`), dan batas waktu pendaftaran (`registration_deadline`).
     * Sistem wajib otomatis menolak pendaftaran baru dan menampilkan status **"Kuota Penuh"** atau **"Pendaftaran Ditutup"** apabila jumlah pendaftar sudah mencapai kuota maksimal atau telah melewati batas waktu pendaftaran.

2. **Sistem Pendaftaran Berbasis Data Teks & Integrasi Google Spreadsheet / Google Form:**
   * **Dua Mode Pendaftaran yang Fleksibel per Kegiatan:**
     * **Mode 1 — Formulir Internal Terintegrasi (`INTERNAL_FORM`):** Pengunjung mendaftar langsung di dalam website GIBEI melalui jendela formulir elegan beraksen `#29abe2`/`#05c3d3` dengan tombol konfirmasi emas `#e0bd1e`. Input hanya berupa **data teks** (Nama Lengkap, Email, NIM, Nomor WhatsApp, Fakultas/Program Studi/Instansi, serta pilihan status kepemilikan rekening RDN khusus untuk pendaftaran SPM). Terapkan validasi anti-duplikat agar NIM atau Email yang sama tidak dapat mendaftar dua kali pada satu kegiatan yang sama.
     * **Mode 2 — Tautan & Sinkronisasi Google Form Eksternal (`EXTERNAL_GFORM`):** Jika panitia memilih menggunakan Google Form luar, tombol daftar akan mengarahkan peserta ke tautan Google Form terkait. Sediakan pula *endpoint webhook* aman di sisi server agar apabila panitia memasang pemicu dari Google Form/Spreadsheet, setiap ada responden baru yang mengisi Google Form, data teks dan angka kuota di website GIBEI ikut bertambah secara otomatis.
   * **Sinkronisasi Otomatis & Manual ke Google Spreadsheet (Google Sheets API):**
     * Pada formulir pembuatan/edit Event & SPM di dashboard, sediakan kolom input untuk memasukkan **ID Google Spreadsheet (`spreadsheet_id`)** dan **Nama Tab Lembar Kerja (`sheet_tab_name`)**.
     * Setiap kali ada peserta yang berhasil mendaftar melalui Formulir Internal, server otomatis menyimpan data ke database (`registrations`) sekaligus langsung menambahkan baris baru (*append row*) berisi data teks peserta tersebut ke Google Spreadsheet tujuan secara *real-time*.
     * Jika pengiriman ke Google Spreadsheet gagal sesaat (misalnya karena ID Sheet belum diisi atau kendala jaringan), tandai status sinkronisasi peserta (`synced_to_sheet` = `false`) tanpa menggagalkan pendaftarannya di database.
     * Sediakan tombol **"Sinkronkan Ulang ke Google Sheet"** (untuk mendorong seluruh data peserta yang belum tersinkronisasi tanpa menimbulkan baris ganda), fitur **Manajemen Kehadiran (Registered / Attended / Absent)** yang ikut memperbarui status di Spreadsheet, serta tombol **Unduh CSV** sebagai cadangan di dashboard Kadiv, Presidium, dan Creator.

3. **Integrasi Halaman Publik (`/kegiatan`, `/kegiatan/[slug]`, `/kontak`, & Beranda):**
   * **Halaman Kegiatan & SPM (`/kegiatan`):**
     * Sediakan navigasi tab yang memisahkan dengan jelas antara **Sekolah Pasar Modal (SPM)** (lengkap dengan lencana Level 1, 2, atau 3) dan **Event & Program Kerja Divisi**.
     * Setiap kartu menampilkan poster, tanggal pelaksanaan, divisi penyelenggara, bilah progres sisa kuota berwarna gradasi `#05c3d3` ke `#29abe2`, lencana status pendaftaran, dan tombol daftar berwarna emas `#e0bd1e`.
   * **Halaman Detail Kegiatan (`/kegiatan/[slug]`):**
     * Menampilkan deskripsi lengkap kegiatan, rincian waktu & tempat, hitung mundur penutupan pendaftaran, indikator sisa kursi secara *real-time*, serta formulir pendaftaran teks langsung (atau tombol Google Form sesuai mode yang dipilih).
   * **Halaman Kontak & Pusat Informasi (`/kontak`) serta Beranda (`/`):**
     * Sempurnakan halaman Kontak dengan informasi resmi lokasi Galeri Investasi BEI UNIMED, jam operasional layanan literasi/pembukaan RDN, tautan media sosial aktif, serta bagian tanya-jawab singkat (FAQ) seputar pendaftaran SPM dan keanggotaan GIBEI.
     * Pastikan bagian sorotan Event/SPM terdekat di halaman Beranda (`/`) terhubung langsung dengan data kegiatan berstatus `OPEN` dari database.

4. **Modul Creator System Console (`/dashboard/sistem` — Khusus Role Creator):**
   * Bangun pusat kendali tertinggi yang hanya dapat diakses oleh *role* **Creator**:
     * **Audit Log Explorer:** Tabel pemantauan seluruh riwayat aktivitas dari koleksi `audit_logs` dengan fitur pencarian dan filter berdasarkan *role* pelaku, jenis tindakan (`CREATE`, `UPDATE`, `DELETE`, `PUBLISH`, `ROLE_CHANGE`, `INVITE_GENERATED`, `SYNC_SHEET`), serta urutan waktu.
     * **Manajemen Akun & Override Hak Akses:** Tabel seluruh pengguna terdaftar di mana Creator dapat mengubah *role* (termasuk mengangkat/menurunkan Presidium dan Kadiv), memindahkan divisi, atau menonaktifkan/mengaktifkan kembali akun pengurus (`is_active`).
     * **Panel Konfigurasi Sistem & Integrasi:** Antarmuka untuk menguji status koneksi akun layanan Google Sheets API, mengatur ID Spreadsheet *default* organisasi, melihat ringkasan total dokumen di setiap koleksi database, serta saklar **Maintenance Mode** (jika diaktifkan oleh Creator, pengunjung publik akan melihat halaman pemeliharaan resmi GIBEI UNIMED yang rapi, sementara Creator dan pengurus tetap dapat masuk ke dalam dashboard).

Sebelum mengeksekusi pembuatan atau perubahan file, susunlah **Rencana Implementasi (Implementation Plan) Tahap 3** secara lengkap yang merinci arsitektur layanan Google Sheets API di sisi server, mekanisme pencegahan duplikasi pendaftar, alur *webhook* Google Form, serta struktur halaman Creator Console untuk saya tinjau terlebih dahulu.