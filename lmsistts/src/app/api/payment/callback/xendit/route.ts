// lmsistts\src\app\api\payment\callback\xendit\route.ts

import { NextRequest, NextResponse } from "next/server";
import { Payment, Enrollment, sequelize } from "@/lib/models";
import { Op } from "sequelize";

const xenditCallbackToken = process.env.XENDIT_CALLBACK_TOKEN;

export async function POST(req: NextRequest) {
  console.log("🔔 Xendit Callback Received");

  const receivedToken = req.headers.get("x-callback-token");
  if (!xenditCallbackToken || receivedToken !== xenditCallbackToken) {
    console.error("❌ Invalid Xendit Callback Token. Received:", receivedToken);
    return NextResponse.json(
      { success: false, error: "Invalid callback token" },
      { status: 401 }
    );
  }
  console.log("✅ Xendit Callback Token Verified");

  const t = await sequelize.transaction();

  try {
    const body = await req.json();
    console.log("Callback Body:", body);

    const {
      external_id,
      status,
      paid_amount,
      amount,
      paid_at,
      id: invoice_id,
    } = body;

    const payment = await Payment.findOne({
      where: { gateway_external_id: external_id, status: "pending" },
      transaction: t,
    });

    if (!payment) {
      console.warn(
        `⚠️ Payment record not found or already processed for external_id: ${external_id}`
      );

      await t.commit();
      return NextResponse.json({
        success: true,
        message: "Payment not found or already processed",
      });
    }
    console.log(`✅ Payment record found: ID ${payment.payment_id}`);

    if (status === "PAID") {
      console.log("Processing PAID status...");

      if (paid_amount !== payment.amount) {
        console.error(
          `❌ Amount mismatch for ${external_id}. Expected: ${payment.amount}, Received: ${paid_amount}`
        );
        await payment.update(
          { status: "failed", updated_at: new Date() },
          { transaction: t }
        );
        await t.commit();
        return NextResponse.json(
          { success: false, error: "Amount mismatch" },
          { status: 400 }
        );
      }
      console.log("✅ Amount verified.");

      payment.status = "paid";
      payment.paid_at = paid_at ? new Date(paid_at) : new Date();
      payment.gateway_invoice_id = invoice_id;
      payment.updated_at = new Date();
      await payment.save({ transaction: t });
      console.log(`✅ Payment ${payment.payment_id} status updated to PAID.`);

      const [enrollment, created] = await Enrollment.findOrCreate({
        where: { user_id: payment.user_id, course_id: payment.course_id },
        defaults: {
          user_id: payment.user_id,
          course_id: payment.course_id,
          status: "active",
          enrolled_at: new Date(),
          created_at: new Date(),
        },
        transaction: t,
      });

      if (!created && enrollment.status !== "active") {
        enrollment.status = "active";
        enrollment.enrolled_at = new Date();
        enrollment.updated_at = new Date();
        await enrollment.save({ transaction: t });
        console.log(
          `✅ Existing Enrollment ${enrollment.enrollment_id} reactivated.`
        );
      } else if (created) {
        console.log(`✅ New Enrollment ${enrollment.enrollment_id} created.`);
        payment.enrollment_id = enrollment.enrollment_id;
        await payment.save({ transaction: t });
      }
    } else if (status === "EXPIRED" || status === "FAILED") {
      console.log(`Processing ${status} status...`);
      payment.status = status.toLowerCase() as "expired" | "failed";
      payment.updated_at = new Date();
      await payment.save({ transaction: t });
      console.log(
        `✅ Payment ${payment.payment_id} status updated to ${status}.`
      );
    } else {
      console.log(`Ignoring status: ${status}`);
    }

    await t.commit();
    console.log("✅ Database transaction committed.");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    await t.rollback();
    console.error("❌ Xendit Callback Processing Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
