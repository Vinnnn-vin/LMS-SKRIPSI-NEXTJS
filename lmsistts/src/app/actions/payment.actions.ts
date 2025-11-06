// lmsistts\src\app\actions\payment.actions.ts
"use server";

import { Course, User, Payment, Enrollment, sequelize } from "@/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Xendit } from "xendit-node"; // Install: npm install xendit-node
import { redirect } from 'next/navigation';
import { Op } from "sequelize";

// --- Ambil Kunci API dari Environment Variables ---
const xenditSecretKey = process.env.XENDIT_SECRET_KEY; // Ambil dari .env.local
if (!xenditSecretKey) {
    console.error("❌ ERROR: XENDIT_SECRET_KEY is not set in environment variables!");
    throw new Error("Konfigurasi Xendit tidak lengkap."); // Hentikan jika kunci tidak ada
}
const xenditClient = new Xendit({ secretKey: xenditSecretKey || 'dummy_key_for_init' });
const invoiceClient = xenditClient.Invoice;
// ----------------------------------------------------


// --- Action untuk Mengecek Status Pendaftaran ---
export async function CheckEnrollmentStatus(courseId: number, userId: number) {
    try {
        const existingEnrollment = await Enrollment.findOne({
            where: { course_id: courseId, user_id: userId, status: { [Op.in]: ['active', 'completed'] } }
        });
        return { isEnrolled: !!existingEnrollment };
    } catch (error) {
        console.error("[CHECK_ENROLLMENT_ERROR]", error);
        return { isEnrolled: false, error: "Gagal memeriksa status pendaftaran." };
    }
}

// --- Action untuk Membuat Invoice Xendit ---
export async function createXenditInvoice(payload: {
    courseId: number;
    userId: number;
    amount: number;
    email: string;
    name: string;
}) {
     if (!xenditSecretKey) {
        return { success: false, error: 'Konfigurasi pembayaran tidak lengkap. Hubungi admin.' };
    }

    const { courseId, userId, amount, email, name } = payload;
    const timestamp = Date.now();
    const externalId = `inv_${courseId}_${userId}_${timestamp}`; // ID unik untuk invoice

    // Dapatkan judul kursus untuk deskripsi
    const course = await Course.findByPk(courseId, { attributes: ['course_title'] });
    if (!course) {
        return { success: false, error: 'Kursus tidak ditemukan.' };
    }

    const t = await sequelize.transaction(); // Mulai transaksi DB

    try {
        // 1. Buat record payment dengan status 'pending'
        const payment = await Payment.create({
            user_id: userId,
            course_id: courseId,
            enrollment_id: null, // Enrollment dibuat setelah bayar lunas
            amount: amount,
            status: 'pending',
            payment_method: 'Xendit', // Atau metode spesifik jika tahu
            gateway_external_id: externalId, // Simpan external_id
            created_at: new Date(),
        }, { transaction: t });

        // 2. Buat Invoice di Xendit
        const invoiceData = {
            externalId: externalId,
            amount: amount,
            payerEmail: email,
            description: `Pembelian Kursus: ${course.course_title}`,
            // --- URL Redirect (Ganti dengan URL production Anda nanti) ---
            successRedirectUrl: `${process.env.NEXTAUTH_URL}/student/dashboard/my-courses?payment=success&courseId=${courseId}`,
            failureRedirectUrl: `${process.env.NEXTAUTH_URL}/courses/${courseId}/checkout?payment=failed`,
            // -----------------------------------------------------------
            customer: { // Info customer (opsional tapi bagus)
                given_names: name.split(' ')[0] || 'User', // Ambil nama depan
                surname: name.split(' ').slice(1).join(' ') || email, // Sisa nama atau email
                email: email,
            },
            // currency: 'IDR', // Default IDR
            // paymentMethods: ['BCA', 'BNI', 'BRI', 'MANDIRI', 'OVO', 'DANA'], // Pilih metode
        };

        console.log("Creating Xendit Invoice with data:", invoiceData);
        const xenditInvoice = await invoiceClient.createInvoice({ data: invoiceData });
        console.log("Xendit Invoice Response:", xenditInvoice);


        // 3. Update record payment dengan invoice_id dari Xendit
        await payment.update({
            gateway_invoice_id: xenditInvoice.id // Simpan ID Invoice Xendit
        }, { transaction: t });

        // 4. Commit transaksi DB
        await t.commit();

        // 5. Kembalikan URL Invoice Xendit ke client
        return { success: true, invoiceUrl: xenditInvoice.invoiceUrl };

    } catch (error: any) {
        await t.rollback(); // Rollback jika ada error
        console.error("[CREATE_XENDIT_INVOICE_ERROR]", error);
        // Tangani error spesifik dari Xendit jika ada
        const errorMessage = error?.message || 'Gagal membuat invoice pembayaran.';
        const errorCode = error?.errorCode; // Kode error Xendit
        return { success: false, error: `[${errorCode || 'XDT'}] ${errorMessage}` };
    }
}