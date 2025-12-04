// lmsistts\src\app\actions\payment.actions.ts
"use server";

import { Course, User, Payment, Enrollment, sequelize } from "@/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Xendit } from "xendit-node";
import { redirect } from "next/navigation";
import { Op } from "sequelize";

const xenditSecretKey = process.env.XENDIT_SECRET_KEY;
if (!xenditSecretKey) {
  console.error(
    "❌ ERROR: XENDIT_SECRET_KEY is not set in environment variables!"
  );
  throw new Error("Konfigurasi Xendit tidak lengkap.");
}
const xenditClient = new Xendit({
  secretKey: xenditSecretKey || "dummy_key_for_init",
});
const invoiceClient = xenditClient.Invoice;

export async function CheckEnrollmentStatus(courseId: number, userId: number) {
  try {
    const existingEnrollment = await Enrollment.findOne({
      where: {
        course_id: courseId,
        user_id: userId,
        status: { [Op.in]: ["active", "completed"] },
      },
    });
    return { isEnrolled: !!existingEnrollment };
  } catch (error) {
    console.error("[CHECK_ENROLLMENT_ERROR]", error);
    return { isEnrolled: false, error: "Gagal memeriksa status pendaftaran." };
  }
}

export async function createXenditInvoice(payload: {
  courseId: number;
  userId: number;
  amount: number;
  email: string;
  name: string;
}) {
  if (!xenditSecretKey) {
    return {
      success: false,
      error: "Konfigurasi pembayaran tidak lengkap. Hubungi admin.",
    };
  }

  const { courseId, userId, amount, email, name } = payload;
  const timestamp = Date.now();
  const externalId = `inv_${courseId}_${userId}_${timestamp}`;

  const course = await Course.findByPk(courseId, {
    attributes: ["course_title"],
  });
  if (!course) {
    return { success: false, error: "Kursus tidak ditemukan." };
  }

  const t = await sequelize.transaction();

  try {
    const payment = await Payment.create(
      {
        user_id: userId,
        course_id: courseId,
        enrollment_id: null,
        amount: amount,
        status: "pending",
        payment_method: "Xendit",
        gateway_external_id: externalId,
        created_at: new Date(),
      },
      { transaction: t }
    );

    const invoiceData = {
      externalId: externalId,
      amount: amount,
      payerEmail: email,
      description: `Pembelian Kursus: ${course.course_title}`,
      successRedirectUrl: `${process.env.NEXTAUTH_URL}/student/dashboard/my-courses?payment=success&courseId=${courseId}`,
      failureRedirectUrl: `${process.env.NEXTAUTH_URL}/courses/${courseId}/checkout?payment=failed`,
      customer: {
        given_names: name.split(" ")[0] || "User",
        surname: name.split(" ").slice(1).join(" ") || email,
        email: email,
      },
      currency: "IDR",
      paymentMethods: ["BCA", "BNI", "BRI", "MANDIRI", "OVO", "DANA"],
      invoiceDuration: 7200,
    };

    console.log("Creating Xendit Invoice with data:", invoiceData);
    const xenditInvoice = await invoiceClient.createInvoice({
      data: invoiceData,
    });
    console.log("Xendit Invoice Response:", xenditInvoice);

    await payment.update(
      {
        gateway_invoice_id: xenditInvoice.id,
      },
      { transaction: t }
    );

    await t.commit();

    return { success: true, invoiceUrl: xenditInvoice.invoiceUrl };
  } catch (error: any) {
    await t.rollback();
    console.error("[CREATE_XENDIT_INVOICE_ERROR]", error);
    const errorMessage = error?.message || "Gagal membuat invoice pembayaran.";
    const errorCode = error?.errorCode;
    return { success: false, error: `[${errorCode || "XDT"}] ${errorMessage}` };
  }
}
