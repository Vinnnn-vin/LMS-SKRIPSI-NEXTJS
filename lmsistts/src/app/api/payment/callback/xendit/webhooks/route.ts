// lmsistts\src\app\api\payment\callback\xendit\webhooks\route.ts

import { NextRequest, NextResponse } from 'next/server';
// import { Payment, Enrollment, User, Course } from '@/models';
import { sequelize } from '@/lib/db';
import { Course, Enrollment, Payment, User } from '@/lib/models';
// import NotificationService from '@/lib/notificationService';

// const notificationService = new NotificationService();

// Helper function to parse form data
async function parseFormData(req: NextRequest) {
  const formData = await req.formData();
  const payload: any = {};
  
  for (const [key, value] of formData.entries()) {
    payload[key] = value;
  }
  
  return payload;
}

export async function POST(req: NextRequest) {
    const transaction = await sequelize.transaction();
    
    try {
        // 1. Verifikasi Webhook Token dari Xendit
        const xenditCallbackToken = req.headers.get('x-callback-token');
        const expectedToken = process.env.XENDIT_CALLBACK_TOKEN;
        
        console.log('Received callback token:', xenditCallbackToken);
        console.log('Expected token:', expectedToken);
        
        if (!expectedToken) {
            console.error('XENDIT_CALLBACK_TOKEN not configured');
            await transaction.rollback();
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        if (xenditCallbackToken !== expectedToken) {
            console.error('Invalid callback token received');
            await transaction.rollback();
            return NextResponse.json({ error: 'Invalid callback token' }, { status: 401 });
        }

        // 2. Parse data berdasarkan content type
        const contentType = req.headers.get('content-type');
        let payload: any;

        if (contentType?.includes('application/json')) {
            payload = await req.json();
        } else if (contentType?.includes('application/x-www-form-urlencoded')) {
            payload = await parseFormData(req);
        } else {
            console.error('Unsupported content type:', contentType);
            await transaction.rollback();
            return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 });
        }

        console.log('Webhook received:', payload);

        // 3. Cek jika event adalah 'invoice.paid'
        if (payload.status === 'PAID' || payload.event === 'invoice.paid') {
            const externalId = payload.external_id;

            if (!externalId) {
                console.error('No external_id in webhook payload');
                await transaction.rollback();
                return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
            }

            // 4. Cari record pembayaran di database (HANYA attributes yang diperlukan)
            const payment = await Payment.findOne({ 
                where: { 
                    gateway_external_id: externalId
                },
                attributes: ['payment_id', 'user_id', 'course_id', 'status', 'enrollment_id'],
                transaction
            });

            if (!payment) {
                console.error(`Payment not found for external_id: ${externalId}`);
                await transaction.rollback();
                return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
            }

            const paymentData = payment.toJSON() as any;
            console.log('Payment data:', paymentData);

            // Validasi user_id dan course_id
            if (!paymentData.user_id || !paymentData.course_id) {
                console.error('Invalid payment data - missing user_id or course_id:', paymentData);
                await transaction.rollback();
                return NextResponse.json({ error: 'Invalid payment data' }, { status: 400 });
            }

            if (paymentData.status === 'paid') {
                console.log('Payment already processed');
                await transaction.commit();
                return NextResponse.json({ message: 'Payment already processed' }, { status: 200 });
            }

            // 5. Update status pembayaran menjadi 'paid'
            await payment.update({ 
                status: 'paid',
                paid_at: new Date(),
                payment_method: payload.payment_method || 'Xendit',
                gateway_invoice_id: payload.id || externalId
            }, { transaction });

            // 6. Cek apakah enrollment sudah ada
            const existingEnrollment = await Enrollment.findOne({
                where: {
                    user_id: paymentData.user_id,
                    course_id: paymentData.course_id
                },
                transaction
            });

            let enrollmentId: number | null = existingEnrollment?.enrollment_id || null;

            if (!existingEnrollment) {
                // 7. Daftarkan siswa ke kursus jika belum ada
                const newEnrollment = await Enrollment.create({
                    user_id: paymentData.user_id,
                    course_id: paymentData.course_id,
                    status: 'active',
                    enrolled_at: new Date()
                }, { transaction });

                enrollmentId = newEnrollment.enrollment_id;
                console.log('New enrollment created:', enrollmentId);
            } else {
                console.log('Existing enrollment found:', enrollmentId);
            }

            // 8. Update enrollment_id di payment
            if (enrollmentId !== null) {
                await payment.update({ 
                    enrollment_id: enrollmentId
                }, { transaction });
                console.log('Payment enrollment_id updated to:', enrollmentId);
            }

            await transaction.commit();

            // 9. KIRIM NOTIFIKASI EMAIL (Ambil data lengkap untuk notifikasi)
            try {
                const paymentForNotification = await Payment.findByPk(paymentData.payment_id, {
                    include: [
                        {
                            model: User,
                            attributes: ['user_id', 'first_name', 'last_name', 'email'],
                            as: 'user'
                        },
                        {
                            model: Course,
                            attributes: ['course_id', 'course_title'],
                            as: 'course'
                        },
                    ]
                });

                // if (paymentForNotification) {
                //     const notificationResult = await notificationService.handlePaymentSuccess(paymentData.payment_id);
                //     console.log('Notification result:', notificationResult);
                // }
            } catch (emailError) {
                console.error('Error sending notification after payment success:', emailError);
            }

            console.log(`Payment processed successfully for payment ID: ${paymentData.payment_id}`);
        }
        
        return NextResponse.json({ message: 'Webhook processed successfully' }, { status: 200 });

    } catch (error: any) {
        await transaction.rollback();
        console.error("Xendit Webhook Error:", error);
        return NextResponse.json({ 
            error: 'Internal Server Error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}