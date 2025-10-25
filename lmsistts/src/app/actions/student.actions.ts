// lmsistts\src\app\actions\student.actions.ts

'use server';

import { User, Course, Category, Enrollment, Material, MaterialDetail, StudentProgress, Certificate, sequelize, Quiz, AssignmentSubmission } from '@/lib/models';
import { Op } from 'sequelize';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';

// Helper function untuk mendapatkan sesi mahasiswa
async function getStudentSession() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'student') {
        throw new Error('Akses ditolak. Anda harus login sebagai mahasiswa.');
    }
    return { userId: parseInt(session.user.id, 10), session };
}

// 1. Mengambil statistik ringkas untuk kartu di bagian atas
export async function getStudentDashboardStats() {
    try {
        const { userId } = await getStudentSession();

        const activeCourses = await Enrollment.count({
            where: { user_id: userId, status: 'active' }
        });
        const completedCourses = await Enrollment.count({
            where: { user_id: userId, status: 'completed' }
        });
        const certificates = await Certificate.count({
            where: { user_id: userId }
        });

        return { success: true, data: { activeCourses, completedCourses, certificates } };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// 2. Mengambil semua kursus yang diikuti mahasiswa beserta progresnya
export async function getMyEnrolledCourses() {
    try {
        const { userId } = await getStudentSession();

        // Ambil semua kursus yang terdaftar
        const enrollments = await Enrollment.findAll({
            where: { user_id: userId, status: 'active' }, // Hanya ambil yang masih aktif
            include: [
                {
                    model: Course,
                    as: 'course',
                    required: true,
                    include: [
                        { model: Category, as: 'category', attributes: ['category_name'] }
                    ]
                }
            ],
            order: [['enrolled_at', 'DESC']]
        });

        if (enrollments.length === 0) {
            return { success: true, data: [] }; // Kembalikan array kosong jika belum ada kursus
        }

        const courseIds = enrollments.map(e => e.course_id);

        // Hitung total materi untuk setiap kursus
        const totalMaterialsResult = await Material.findAll({
            where: { course_id: { [Op.in]: courseIds } },
            include: [{ model: MaterialDetail, as: 'details', attributes: ['material_detail_id'] }],
        });
        
        // Buat map: { course_id: total_materi }
        const totalMaterialsMap = totalMaterialsResult.reduce((acc, material) => {
            const courseId = material.course_id;
            if (!acc[courseId]) acc[courseId] = 0;
            acc[courseId] += (material.details?.length || 0);
            return acc;
        }, {} as { [key: number]: number });


        // Hitung progres (materi selesai) untuk setiap kursus
        const progressResult = await StudentProgress.findAll({
            where: {
                user_id: userId,
                course_id: { [Op.in]: courseIds },
                is_completed: true
            },
            attributes: [
                'course_id',
                [sequelize.fn('COUNT', sequelize.col('progress_id')), 'completed_count'],
            ],
            group: ['course_id'],
            raw: true,
        });

        const progressMap = (progressResult as any[]).reduce((acc, item) => {
            acc[item.course_id] = parseInt(item.completed_count, 10);
            return acc;
        }, {} as { [key: number]: number });

        // Gabungkan data
        const coursesWithProgress = enrollments.map(enrollment => {
            const course = (enrollment.course as Course).toJSON();
            const total = totalMaterialsMap[course.course_id] || 0;
            const completed = progressMap[course.course_id] || 0;
            const progress = (total > 0) ? Math.round((completed / total) * 100) : 0;

            return {
                ...course,
                enrollment_id: enrollment.enrollment_id,
                progress: progress > 100 ? 100 : progress, // Pastikan tidak lebih dari 100
            };
        });

        return { success: true, data: coursesWithProgress };

    } catch (error: any) {
        console.error('[GET_MY_COURSES_ERROR]', error);
        return { success: false, error: error.message };
    }
}

export async function getMyEnrolledCoursesWithProgress() {
    try {
        const { userId } = await getStudentSession();

        // Ambil SEMUA kursus (aktif dan selesai)
        const enrollments = await Enrollment.findAll({
            where: { user_id: userId, status: { [Op.in]: ['active', 'completed'] } },
            include: [{ model: Course, as: 'course', required: true, include: [{ model: Category, as: 'category' }] }],
            order: [['enrolled_at', 'DESC']]
        });

        if (enrollments.length === 0) {
            return { success: true, data: { active: [], completed: [] } };
        }

        const courseIds = enrollments.map(e => e.course_id);

        // Hitung total materi (details + quizzes) untuk setiap kursus
        const materialsCount = await Material.findAll({
            where: { course_id: { [Op.in]: courseIds } },
            attributes: ['course_id', [sequelize.fn('COUNT', sequelize.col('details.material_detail_id')), 'detailCount']],
            include: [{ model: MaterialDetail, as: 'details', attributes: [], required: false }],
            group: ['Material.course_id'],
            raw: true,
        });
        const quizzesCount = await Material.findAll({
            where: { course_id: { [Op.in]: courseIds } },
            attributes: ['course_id', [sequelize.fn('COUNT', sequelize.col('quizzes.quiz_id')), 'quizCount']],
            include: [{ model: Quiz, as: 'quizzes', attributes: [], required: false }],
            group: ['Material.course_id'],
            raw: true,
        });

        const totalMap = new Map<number, number>();
        materialsCount.forEach((item: any) => totalMap.set(item.course_id, (totalMap.get(item.course_id) || 0) + parseInt(item.detailCount)));
        quizzesCount.forEach((item: any) => totalMap.set(item.course_id, (totalMap.get(item.course_id) || 0) + parseInt(item.quizCount)));

        // Hitung progres (materi selesai)
        const progressResult = await StudentProgress.findAll({
            where: { user_id: userId, course_id: { [Op.in]: courseIds }, is_completed: true },
            attributes: ['course_id', [sequelize.fn('COUNT', sequelize.col('progress_id')), 'completed_count']],
            group: ['course_id'], raw: true,
        });
        // TODO: Tambahkan progres dari StudentQuizAnswer
        const progressMap = (progressResult as any[]).reduce((acc, item) => {
            acc[item.course_id] = parseInt(item.completed_count, 10);
            return acc;
        }, {} as { [key: number]: number });

        // Gabungkan data
        const processedCourses = enrollments.map(enrollment => {
            const course = (enrollment.course as Course).toJSON();
            const total = totalMap.get(course.course_id) || 0;
            const completed = progressMap[course.course_id] || 0;
            const progress = (total > 0) ? Math.round((completed / total) * 100) : 0;
            return {
                ...course,
                enrollment_id: enrollment.enrollment_id,
                status: enrollment.status,
                progress: progress > 100 ? 100 : progress,
            };
        });

        return {
            success: true,
            data: {
                active: processedCourses.filter(c => c.status === 'active'),
                completed: processedCourses.filter(c => c.status === 'completed'),
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// --- FUNGSI UNTUK HALAMAN BELAJAR ---
export async function getCourseLearningData(courseId: number) {
    try {
        const { userId } = await getStudentSession();
        // Cek apakah user terdaftar
        const enrollment = await Enrollment.findOne({ where: { course_id: courseId, user_id: userId, status: 'active' } });
        if (!enrollment) {
            throw new Error('Anda tidak terdaftar di kursus ini atau kursus telah selesai.');
        }

        // 1. Ambil data kursus, bab, konten, dan quiz
        const course = await Course.findByPk(courseId, {
            include: [
                {
                    model: Material,
                    as: 'materials',
                    required: false,
                    include: [
                        { model: MaterialDetail, as: 'details', required: false },
                        { model: Quiz, as: 'quizzes', required: false }
                    ],
                }
            ],
            order: [
                [{ model: Material, as: 'materials' }, 'material_id', 'ASC'],
                [{ model: Material, as: 'materials' }, { model: MaterialDetail, as: 'details' }, 'material_detail_id', 'ASC'],
                // TODO: Urutkan quiz
            ]
        });
        if (!course) throw new Error('Kursus tidak ditemukan.');

        // 2. Ambil semua progres student di kursus ini
        const progress = await StudentProgress.findAll({
            where: { user_id: userId, course_id: courseId, is_completed: true },
            attributes: ['material_detail_id'], // Ambil ID materi yang selesai
            raw: true,
        });
        // TODO: Ambil progres quiz

        const completedSet = new Set(progress.map(p => p.material_detail_id));

        return { success: true, data: { course: course.toJSON(), completedSet, enrollment_id: enrollment.enrollment_id } };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// --- AKSI UNTUK SELESAIKAN MATERI & BUAT SERTIFIKAT ---
export async function markMaterialAsComplete(materialDetailId: number, courseId: number, enrollmentId: number) {
    try {
        const { userId } = await getStudentSession();

        // 1. Catat progres
        await StudentProgress.findOrCreate({
            where: {
                user_id: userId,
                course_id: courseId,
                material_detail_id: materialDetailId,
            },
            defaults: {
                user_id: userId,
                course_id: courseId,
                material_detail_id: materialDetailId,
                is_completed: true,
                completed_at: new Date(),
            }
        });

        // 2. Cek apakah kursus sudah selesai
        // Hitung total materi (details)
        const totalDetails = await MaterialDetail.count({
            include: [{ model: Material, as: 'material', where: { course_id: courseId } }]
        });
        // Hitung total quiz
        const totalQuizzes = await Quiz.count({ where: { course_id: courseId } });
        const totalItems = totalDetails + totalQuizzes;

        // Hitung progres selesai
        const completedDetails = await StudentProgress.count({
            where: { user_id: userId, course_id: courseId, is_completed: true }
        });
        // TODO: Hitung progres quiz yang lulus
        const completedQuizzes = 0; // Ganti dengan logika kuis
        
        const totalCompleted = completedDetails + completedQuizzes;

        let certificateGranted = false;

        // 3. Jika SEMUA item selesai
        if (totalItems > 0 && totalCompleted >= totalItems) {
            // Cek apakah sertifikat sudah ada
            const existingCert = await Certificate.findOne({ where: { user_id: userId, course_id: courseId } });
            
            if (!existingCert) {
                // Buat sertifikat baru
                const uniqueCertNumber = `CERT-${courseId}-${userId}-${Date.now()}`;
                await Certificate.create({
                    user_id: userId,
                    course_id: courseId,
                    enrollment_id: enrollmentId,
                    certificate_url: `/certificate/${uniqueCertNumber}`, // URL ke halaman sertifikat
                    certificate_number: uniqueCertNumber,
                    issued_at: new Date(),
                });
                // Update status enrollment
                await Enrollment.update({ status: 'completed', completed_at: new Date() }, { where: { enrollment_id: enrollmentId } });
                certificateGranted = true;
            }
        }
        
        revalidatePath(`/student/courses/${courseId}/learn`);
        return { success: true, certificateGranted };

    } catch (error: any) {
        return { error: error.message || 'Gagal menandai selesai.' };
    }
}

// --- FUNGSI UNTUK HALAMAN "SERTIFIKAT SAYA" ---
export async function getMyCertificates() {
    try {
        const { userId } = await getStudentSession();
        const certificates = await Certificate.findAll({
            where: { user_id: userId },
            include: [
                { model: Course, as: 'course', attributes: ['course_title', 'thumbnail_url'] }
            ],
            order: [['issued_at', 'DESC']]
        });
        return { success: true, data: certificates.map(c => c.toJSON()) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

//createAssignmentSubmission
export async function createAssignmentSubmission(assignmentId: number, courseId: number, fileUrl: string) {
    try {
        const { userId } = await getStudentSession();
        // Cek apakah user terdaftar di kursus
        const enrollment = await Enrollment.findOne({ where: { course_id: courseId, user_id: userId, status: 'active' } });
        if (!enrollment) {
            throw new Error('Anda tidak terdaftar di kursus ini atau kursus telah selesai.');
        }
        // Simpan submission (asumsi ada model AssignmentSubmission)
        await AssignmentSubmission.create({
            assignment_id: assignmentId,
            user_id: userId,
            file_url: fileUrl,
            submitted_at: new Date(),
        });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}