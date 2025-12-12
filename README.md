# 🎓 LMS Platform (Learning Management System)

Platform pembelajaran daring (LMS) modern yang dibangun menggunakan **Next.js 15**, **Sequelize (MySQL)**, dan **Mantine UI**. Sistem ini dirancang untuk memfasilitasi proses belajar mengajar yang interaktif, mulai dari pembuatan kursus, transaksi pembayaran, pengerjaan tugas, hingga penerbitan sertifikat otomatis.

![Project Banner](public/thumbnail_course.jpg)

## 🚀 Fitur Utama

### 👨‍💼 Administrator
* **Dashboard Statistik:** Ringkasan total user, kursus, penjualan, dan enrollment.
* **Manajemen User:** Mengelola akun Dosen dan Mahasiswa.
* **Approval Kursus:** Memverifikasi kursus yang diajukan dosen sebelum tayang (Quality Control).
* **Verifikasi Pembayaran:** Fitur konfirmasi pembayaran manual untuk transaksi siswa.
* **Manajemen Kategori:** Membuat dan mengelola kategori kursus.

### 👨‍🏫 Dosen (Lecturer)
* **Course Builder:** Membuat kursus dengan kurikulum terstruktur (Bab & Materi).
* **Manajemen Materi:** Upload Video (Embed Youtube) dan Dokumen PDF (Cloud Storage).
* **Evaluasi:** Membuat Kuis (Pilihan Ganda) dan Tugas (Assignment).
* **Penilaian Tugas:** Mereview file tugas mahasiswa, memberikan nilai, dan feedback.
* **Request Publish:** Mengajukan kursus untuk disetujui admin.

### 👨‍🎓 Mahasiswa (Student)
* **Katalog Kursus:** Pencarian dan filter kursus berdasarkan kategori/harga/level.
* **Payment Gateway:** Integrasi pembayaran via **Xendit** (Invoice) dengan fallback verifikasi manual.
* **Learning Experience:** Progress tracking otomatis, materi video/PDF, dan *Auto-advance* ke materi berikutnya.
* **Upload Tugas:** Mengunggah file jawaban (disimpan aman di Vercel Blob).
* **Sertifikat Otomatis:** Download sertifikat digital setelah menyelesaikan 100% materi.

---

## 🛠️ Teknologi yang Digunakan

* **Framework:** [Next.js 15](https://nextjs.org/) (App Router & Server Actions)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Database:** MySQL
* **ORM:** [Sequelize](https://sequelize.org/)
* **Styling:** [Mantine UI](https://mantine.dev/) & Tailwind CSS
* **Authentication:** [NextAuth.js](https://next-auth.js.org/)
* **Cloud Storage:** [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) (Untuk file tugas & gambar)
* **Payment:** [Xendit API](https://www.xendit.co/)
* **Deployment:** Vercel

---

## ⚙️ Instalasi & Menjalankan Local

Ikuti langkah berikut untuk menjalankan project ini di komputer Anda:

### 1. Clone Repository
```bash
git clone [https://github.com/Vinnnn-vin/LMS-SKRIPSI-NEXTJS.git](https://github.com/Vinnnn-vin/LMS-SKRIPSI-NEXTJS.git)
cd LMS-SKRIPSI-NEXTJS
````

### 2\. Install Dependencies

```bash
npm install
```

### 3\. Konfigurasi Environment Variables

Buat file `.env` di root folder dan isi dengan konfigurasi berikut:

```env
# Database (MySQL)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password_db_anda
DB_NAME=lms_db
DB_PORT=3306

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=rahasia_super_secure_string

# Xendit (Payment Gateway)
XENDIT_SECRET_KEY=xnd_development_...

# Vercel Blob (Storage)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...

# Email Server (Untuk Forgot Password - Opsional)
EMAIL_SERVER_USER=email@gmail.com
EMAIL_SERVER_PASSWORD=app_password_gmail
```

### 4\. Setup Database

Pastikan MySQL sudah berjalan, lalu jalankan sinkronisasi Sequelize (biasanya otomatis saat server jalan pertama kali, atau gunakan script migrasi jika ada).

### 5\. Seeding Data (Isi Data Dummy)

Agar tidak mulai dari nol, jalankan script seeding yang sudah disediakan untuk membuat Admin, Dosen, Mahasiswa, dan Kursus contoh.

1.  Jalankan server: `npm run dev`
2.  Buka browser akses: `http://localhost:3000/api/seed`
3.  Tunggu hingga muncul pesan JSON "Database seeded successfully".

**Akun Demo Hasil Seeding:**
| Role | Email | Password |
|Data |---|---|
| **Admin** | `admin@lms.com` | `password123` |
| **Dosen** | `budi@lms.com` | `password123` |
| **Siswa** | `siswa@lms.com` | `password123` |

### 6\. Jalankan Server

```bash
npm run dev
```

Buka [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) di browser Anda.

-----

## 📂 Struktur Project

```
src/
├── app/
│   ├── (admin)/        # Route khusus Admin
│   ├── (lecturer)/     # Route khusus Dosen
│   ├── (student)/      # Route khusus Mahasiswa
│   ├── (public)/       # Landing page & Katalog
│   ├── actions/        # Server Actions (Backend Logic)
│   └── api/            # API Routes (Upload, Auth, Seeding)
├── components/         # Reusable UI Components
├── lib/
│   ├── db.ts           # Koneksi Database
│   ├── models/         # Definisi Model Sequelize
│   ├── schemas/        # Validasi Zod
│   └── uploadHelperBlob.ts # Helper Vercel Blob
└── ...
```

-----

## 🧪 Pengujian & Demo

Project ini telah melalui pengujian fungsional meliputi:

1.  **CRUD Kursus & Materi:** Berhasil menyimpan data relasi kompleks.
2.  **Upload File:** Menggunakan Vercel Blob untuk skalabilitas (Bebas error `EROFS`).
3.  **Transaksi:** Flow pembayaran Xendit hingga konfirmasi manual Admin.
4.  **Keamanan:** Middleware role-based protection pada setiap route.

-----

## 📝 Lisensi

Project ini dibuat untuk keperluan Skripsi/Tugas Akhir.
Hak Cipta © 2025 Andreas Calvin Gunawan.

```

---

### Tips Tambahan untuk README:

1.  **Ganti Placeholder:** Pastikan Anda mengganti `username-anda`, `nama-repo-lms`, dan `[Nama Anda]` dengan data asli.
2.  **Tambahkan Screenshot:** Jika sempat, ambil screenshot halaman *Landing Page*, *Dashboard Admin*, dan *Halaman Belajar Siswa*, lalu taruh di folder `/public` dan tautkan di README. Visual sangat membantu orang memahami project Anda dengan cepat.
3.  **Deploy Link:** Jika project sudah live di Vercel, tambahkan baris `**Demo Live:** [https://nama-project.vercel.app](https://nama-project.vercel.app)` di bagian atas.
```
