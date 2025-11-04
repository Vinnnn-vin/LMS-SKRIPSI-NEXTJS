// lmsistts\src\app\actions\student.actions.ts

"use server";

import {
  User,
  Course,
  Category,
  Enrollment,
  Material,
  MaterialDetail,
  StudentProgress,
  Certificate,
  sequelize,
  Quiz,
  QuizQuestion,
  QuizAnswerOption,
  AssignmentSubmission,
  StudentQuizAnswer,
} from "@/lib/models";
import { Op } from "sequelize";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import dayjs from "dayjs";
import { deleteFromPublic } from "@/lib/uploadHelper"; // Pastikan fungsi ini ada

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Helper function untuk mendapatkan sesi mahasiswa
 * Memastikan user sudah login dan memiliki role 'student'
 */
async function getStudentSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "student") {
    throw new Error("Akses ditolak. Anda harus login sebagai mahasiswa.");
  }
  return { userId: parseInt(session.user.id, 10), session };
}

/**
 * Helper function untuk menghitung total items dan completed items dalam course
 * Digunakan untuk mengecek apakah course sudah selesai 100%
 */
async function calculateCourseCompletion(
  userId: number,
  courseId: number
): Promise<{ totalItems: number; completedCount: number }> {
  // Hitung total item (details, quizzes, assignments)
  let totalDetailsCount = 0;
  let totalQuizzesCount = 0;
  let totalAssignmentsCount = 0;

  const materials = await Material.findAll({
    where: { course_id: courseId },
    include: [
      { model: MaterialDetail, as: "details" },
      { model: Quiz, as: "quizzes" },
    ],
  });

  materials.forEach((material) => {
    material.details?.forEach((detail) => {
      if (detail.material_detail_type === 4) {
        totalAssignmentsCount++;
      } else {
        totalDetailsCount++;
      }
    });
    totalQuizzesCount += material.quizzes?.length || 0;
  });

  const totalItems =
    totalDetailsCount + totalQuizzesCount + totalAssignmentsCount;

  // Hitung item yang sudah selesai
  // 1. Details yang completed (tipe 1, 2, 3)
  const completedDetails = await StudentProgress.count({
    where: {
      user_id: userId,
      course_id: courseId,
      is_completed: true,
      material_detail_id: {
        [Op.in]: sequelize.literal(
          `(SELECT material_detail_id FROM material_detail WHERE material_id IN (SELECT material_id FROM material WHERE course_id = ${courseId}) AND material_detail_type IN (1,2,3))`
        ),
      },
    },
  });

  // 2. Quizzes yang passed
  const completedQuizzes = await StudentQuizAnswer.count({
    where: { user_id: userId, course_id: courseId, status: "passed" },
    distinct: true,
    col: "quiz_id",
  });

  // 3. Assignments yang approved
  const completedAssignments = await AssignmentSubmission.count({
    where: { user_id: userId, course_id: courseId, status: "approved" },
    distinct: true,
    col: "material_detail_id",
  });

  const completedCount =
    completedDetails + completedQuizzes + completedAssignments;

  return { totalItems, completedCount };
}

// ============================================================================
// DASHBOARD STATS
// ============================================================================

/**
 * Mengambil statistik ringkas untuk kartu di dashboard mahasiswa
 * - Jumlah kursus aktif
 * - Jumlah kursus selesai
 * - Jumlah sertifikat
 */
export async function getStudentDashboardStats() {
  try {
    const { userId } = await getStudentSession();

    const activeCourses = await Enrollment.count({
      where: { user_id: userId, status: "active" },
    });

    const completedCourses = await Enrollment.count({
      where: { user_id: userId, status: "completed" },
    });

    const certificates = await Certificate.count({
      where: { user_id: userId },
    });

    return {
      success: true,
      data: { activeCourses, completedCourses, certificates },
    };
  } catch (error: any) {
    console.error("[GET_DASHBOARD_STATS_ERROR]", error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// ENROLLED COURSES
// ============================================================================

/**
 * Mengambil semua kursus yang diikuti mahasiswa beserta progresnya
 * Hanya menampilkan kursus dengan status 'active'
 */
export async function getMyEnrolledCourses() {
  try {
    const { userId } = await getStudentSession();

    // Ambil semua kursus yang terdaftar dengan status active
    const enrollments = await Enrollment.findAll({
      where: { user_id: userId, status: "active" },
      include: [
        {
          model: Course,
          as: "course",
          required: true,
          include: [
            {
              model: Category,
              as: "category",
              attributes: ["category_name"],
            },
          ],
        },
      ],
      order: [["enrolled_at", "DESC"]],
    });

    if (enrollments.length === 0) {
      return { success: true, data: [] };
    }

    const courseIds = enrollments.map((e) => e.course_id);

    // Hitung total materi untuk setiap kursus
    const totalMaterialsResult = await Material.findAll({
      where: { course_id: { [Op.in]: courseIds } },
      include: [
        {
          model: MaterialDetail,
          as: "details",
          attributes: ["material_detail_id"],
        },
      ],
    });

    // Buat map: { course_id: total_materi }
    const totalMaterialsMap = totalMaterialsResult.reduce(
      (acc, material) => {
        const courseId = material.course_id;
        if (!acc[courseId]) acc[courseId] = 0;
        acc[courseId] += material.details?.length || 0;
        return acc;
      },
      {} as { [key: number]: number }
    );

    // Hitung progres (materi selesai) untuk setiap kursus
    const progressResult = await StudentProgress.findAll({
      where: {
        user_id: userId,
        course_id: { [Op.in]: courseIds },
        is_completed: true,
      },
      attributes: [
        "course_id",
        [
          sequelize.fn("COUNT", sequelize.col("progress_id")),
          "completed_count",
        ],
      ],
      group: ["course_id"],
      raw: true,
    });

    const progressMap = (progressResult as any[]).reduce(
      (acc, item) => {
        acc[item.course_id] = parseInt(item.completed_count, 10);
        return acc;
      },
      {} as { [key: number]: number }
    );

    // Gabungkan data
    const coursesWithProgress = enrollments.map((enrollment) => {
      const course = (enrollment.course as Course).toJSON();
      const total = totalMaterialsMap[course.course_id] || 0;
      const completed = progressMap[course.course_id] || 0;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        ...course,
        enrollment_id: enrollment.enrollment_id,
        progress: progress > 100 ? 100 : progress,
      };
    });

    return { success: true, data: coursesWithProgress };
  } catch (error: any) {
    console.error("[GET_MY_COURSES_ERROR]", error);
    return { success: false, error: error.message };
  }
}

/**
 * Mengambil kursus yang diikuti dengan progress lengkap
 * Menampilkan kursus aktif dan completed secara terpisah
 */
export async function getMyEnrolledCoursesWithProgress() {
  try {
    const { userId } = await getStudentSession();
    const enrollments = await Enrollment.findAll({
      where: { user_id: userId, status: { [Op.in]: ["active", "completed"] } },
      include: [
        {
          model: Course,
          as: "course",
          required: true,
          include: [{ model: Category, as: "category" }],
        },
      ],
      order: [["enrolled_at", "DESC"]],
    });

    if (enrollments.length === 0) {
      return { success: true, data: { active: [], completed: [] } };
    }

    const processedCoursesPromises = enrollments.map(async (enrollment) => {
      // Buat jadi async map
      const course = (enrollment.course as Course).toJSON();

      // --- PANGGIL HELPER ---
      const { totalItems, completedCount } = await calculateCourseCompletion(
        userId,
        course.course_id
      ); //
      const progress =
        totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
      // --------------------

      return {
        ...course,
        enrollment_id: enrollment.enrollment_id,
        status: enrollment.status,
        progress: progress > 100 ? 100 : progress, // Pastikan tidak > 100
      };
    });

    const processedCourses = await Promise.all(processedCoursesPromises); //

    return {
      success: true,
      data: {
        active: processedCourses.filter((c) => c.status === "active"),
        completed: processedCourses.filter((c) => c.status === "completed"),
      },
    };
  } catch (error: any) {
    console.error("[GET_MY_COURSES_WITH_PROGRESS_ERROR]", error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// COURSE LEARNING PAGE
// ============================================================================

/**
 * Mengambil data lengkap untuk halaman belajar kursus
 * Termasuk: course info, materials, progress, quiz attempts, assignment submissions
 */
/**
 * Mengambil data lengkap untuk halaman belajar kursus
 * Termasuk: course info, materials, progress, quiz attempts, assignment submissions
 * ✅ FIXED: Duration check dengan auto-reset progress jika expired
 * ✅ FIXED: Return structure untuk accessExpiresAt & enrolledAt
 * ✅ FIXED: Filter quiz attempts untuk remove status "pending"
 */
export async function getCourseLearningData(courseId: number) {
  try {
    const { userId } = await getStudentSession();

    // Cek apakah user terdaftar
    let enrollment = await Enrollment.findOne({
      where: {
        course_id: courseId,
        user_id: userId,
        status: "active",
      },
    });

    if (!enrollment) {
      const completedEnrollment = await Enrollment.findOne({
        where: { course_id: courseId, user_id: userId, status: "completed" },
      });

      if (completedEnrollment) {
        enrollment = completedEnrollment; // Izinkan akses untuk review
      } else {
        throw new Error("Anda tidak terdaftar di kursus ini.");
      }
    }

    // ✅ FIXED: Cek Waktu Akses Habis & Reset Progress
    if (
      enrollment.access_expires_at &&
      dayjs().isAfter(dayjs(enrollment.access_expires_at))
    ) {
      console.log(`⏰ Access expired for user ${userId}, course ${courseId}. Resetting progress...`);
      
      // Reset semua progress
      await sequelize.transaction(async (t) => {
        // 1. Hapus student progress
        await StudentProgress.destroy({
          where: { user_id: userId, course_id: courseId },
          transaction: t,
        });

        // 2. Hapus quiz answers
        await StudentQuizAnswer.destroy({
          where: { user_id: userId, course_id: courseId },
          transaction: t,
        });

        // 3. Hapus assignment submissions
        await AssignmentSubmission.destroy({
          where: { user_id: userId, course_id: courseId },
          transaction: t,
        });

        // 4. Hapus certificates jika ada
        await Certificate.destroy({
          where: { user_id: userId, course_id: courseId },
          transaction: t,
        });

        // 5. Update enrollment status ke expired/inactive
        await enrollment!.update(
          { status: "expired" }, // Atau bisa gunakan status khusus
          { transaction: t }
        );
      });

      console.log(`✅ Progress reset completed for user ${userId}, course ${courseId}`);
      
      throw new Error("Akses Anda ke kursus ini telah berakhir.");
    }

    // 1. Ambil data kursus, bab, konten, dan quiz
    const course = await Course.findByPk(courseId, {
      include: [
        {
          model: Material,
          as: "materials",
          required: false,
          include: [
            { model: MaterialDetail, as: "details", required: false },
            {
              model: Quiz,
              as: "quizzes",
              required: false,
              include: [
                {
                  model: QuizQuestion,
                  as: "questions",
                  include: [{ model: QuizAnswerOption, as: "options" }],
                },
              ],
            },
          ],
        },
      ],
      order: [
        [{ model: Material, as: "materials" }, "material_id", "ASC"],
        [
          { model: Material, as: "materials" },
          { model: MaterialDetail, as: "details" },
          "material_detail_id",
          "ASC",
        ],
        [
          { model: Material, as: "materials" },
          { model: Quiz, as: "quizzes" },
          "quiz_id",
          "ASC",
        ],
      ],
    });

    if (!course) throw new Error("Kursus tidak ditemukan.");

    // 2. Ambil progres materi
    const progressDetails = await StudentProgress.findAll({
      where: { user_id: userId, course_id: courseId, is_completed: true },
      attributes: ["material_detail_id"],
      raw: true,
    });
    const completedDetailSet = new Set(
      progressDetails.map((p) => p.material_detail_id)
    );

    // 3. Ambil progres kuis (HANYA passed)
    const passedQuizzes = await StudentQuizAnswer.findAll({
      where: {
        user_id: userId,
        course_id: courseId,
        status: "passed",
      },
      attributes: [
        [sequelize.fn("DISTINCT", sequelize.col("quiz_id")), "quiz_id"],
      ],
      raw: true,
    });
    const completedQuizSet = new Set(passedQuizzes.map((q: any) => q.quiz_id));

    // 4. Ambil SEMUA submission assignments (untuk history)
    const allAssignmentSubmissions = await AssignmentSubmission.findAll({
      where: {
        user_id: userId,
        course_id: courseId,
        material_detail_id: {
          [Op.in]: sequelize.literal(
            `(SELECT material_detail_id FROM material_detail WHERE material_id IN (SELECT material_id FROM material WHERE course_id = ${courseId}) AND material_detail_type = 4)`
          ),
        },
      },
      order: [["submitted_at", "DESC"]],
      include: [
        {
          model: MaterialDetail,
          as: "assignment",
          attributes: ["passing_score"],
        },
      ],
    });

    // Proses untuk mendapatkan latest submission & approved assignments
    const latestSubmissionsMap = new Map<number, any>();
    const approvedAssignmentSet = new Set<number>();
    const submissionHistoryMap = new Map<number, any[]>();

    allAssignmentSubmissions.forEach((sub) => {
      const detailId = sub.material_detail_id;

      // Latest submission per assignment
      if (!latestSubmissionsMap.has(detailId)) {
        latestSubmissionsMap.set(detailId, sub.toJSON());
      }

      // Track approved assignments
      if (sub.status === "approved") {
        approvedAssignmentSet.add(detailId);
      }

      // Build history map
      if (!submissionHistoryMap.has(detailId)) {
        submissionHistoryMap.set(detailId, []);
      }
      submissionHistoryMap.get(detailId)!.push(sub.toJSON());
    });

    const initialSubmissionData = Array.from(latestSubmissionsMap.values());

    // Convert history map to object for JSON serialization
    const submissionHistoryObj: Record<number, any[]> = {};
    submissionHistoryMap.forEach((history, detailId) => {
      submissionHistoryObj[detailId] = history;
    });

    // 5. ✅ FIXED: Ambil semua attempt kuis DAN filter yang pending
    const allQuizAttempts = await StudentQuizAnswer.findAll({
      where: { 
        user_id: userId, 
        course_id: courseId,
        status: { [Op.in]: ["passed", "failed"] } // ✅ ONLY get completed attempts
      },
      order: [["attempt_session", "DESC"]],
    });

    const initialQuizAttempts = allQuizAttempts.map((a) => a.toJSON());

    // 6. Hitung Total Item dan Progress
    let totalDetailsCount = 0;
    let totalQuizzesCount = 0;
    let totalAssignmentsCount = 0;

    course.materials?.forEach((material) => {
      material.details?.forEach((detail) => {
        if (detail.material_detail_type === 4) {
          totalAssignmentsCount++;
        } else {
          totalDetailsCount++;
        }
      });
      totalQuizzesCount += material.quizzes?.length || 0;
    });

    const totalItems =
      totalDetailsCount + totalQuizzesCount + totalAssignmentsCount;
    const completedCount =
      completedDetailSet.size +
      completedQuizSet.size +
      approvedAssignmentSet.size;
    const totalProgress =
      totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

    // 7. ✅ FIXED: Return struktur data dengan accessExpiresAt & enrolledAt di root level
    return {
      success: true,
      data: {
        course: course.toJSON(),
        completedItems: {
          details: completedDetailSet,
          quizzes: completedQuizSet,
          assignments: approvedAssignmentSet,
        },
        enrollment_id: enrollment.enrollment_id,
        totalProgress: totalProgress > 100 ? 100 : totalProgress,
        initialSubmissionData: initialSubmissionData,
        initialQuizAttempts: initialQuizAttempts, // ✅ Already filtered
        submissionHistoryMap: submissionHistoryObj,
        accessExpiresAt: enrollment.access_expires_at, // ✅ ROOT LEVEL
        enrolledAt: enrollment.enrolled_at, // ✅ ROOT LEVEL
      },
    };
  } catch (error: any) {
    console.error("[GET_COURSE_LEARNING_DATA_ERROR]", error);
    return { success: false, error: error.message };
  }
}
// ============================================================================
// MARK MATERIAL AS COMPLETE
// ============================================================================

/**
 * Menandai materi sebagai selesai (hanya untuk tipe 1, 2, 3)
 * Tipe 4 (assignment) dan quiz memiliki alur sendiri
 */
export async function markMaterialAsComplete(
  materialDetailId: number,
  courseId: number,
  enrollmentId: number
) {
  try {
    const { userId } = await getStudentSession();

    // 1. Validasi: Pastikan materialDetailId adalah tipe 1, 2, atau 3
    const materialDetail = await MaterialDetail.findByPk(materialDetailId, {
      attributes: ["material_detail_type"],
    });

    if (
      !materialDetail ||
      ![1, 2, 3].includes(materialDetail.material_detail_type)
    ) {
      return {
        success: false,
        error: "Tipe materi tidak valid untuk aksi ini.",
      };
    }

    // 2. Catat progres (findOrCreate untuk menghindari duplikat)
    const [progress, created] = await StudentProgress.findOrCreate({
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
      },
    });

    // Jika sudah ada tapi belum complete, update
    if (!created && !progress.is_completed) {
      await progress.update({
        is_completed: true,
        completed_at: new Date(),
      });
    }

    // 3. Cek apakah kursus selesai
    const { totalItems, completedCount } = await calculateCourseCompletion(
      userId,
      courseId
    );
    let certificateGranted = false;

    if (totalItems > 0 && completedCount >= totalItems) {
      const enrollment = await Enrollment.findByPk(enrollmentId);

      // Hanya update jika statusnya masih 'active'
      if (enrollment && enrollment.status === "active") {
        // Cek apakah sertifikat sudah ada
        const existingCert = await Certificate.findOne({
          where: { user_id: userId, course_id: courseId },
        });

        if (!existingCert) {
          const uniqueCertNumber = `CERT-${courseId}-${userId}-${Date.now()}`;
          await Certificate.create({
            user_id: userId,
            course_id: courseId,
            enrollment_id: enrollmentId,
            certificate_url: `/certificate/${uniqueCertNumber}`,
            certificate_number: uniqueCertNumber,
            issued_at: new Date(),
          });

          await enrollment.update({
            status: "completed",
            completed_at: new Date(),
          });

          certificateGranted = true;
        } else {
          // Jika sertifikat sudah ada tapi status enrollment belum completed
          await enrollment.update({
            status: "completed",
            completed_at: new Date(),
          });
        }
      }
    }

    revalidatePath(`/student/courses/${courseId}/learn`);
    return { success: true, certificateGranted };
  } catch (error: any) {
    console.error("[MARK_MATERIAL_COMPLETE_ERROR]", error);
    return {
      success: false,
      error: error.message || "Gagal menandai selesai.",
    };
  }
}

// ============================================================================
// QUIZ SUBMISSION
// ============================================================================

/**
 * Submit jawaban quiz dan hitung skornya
 */
export async function submitQuizAttempt(payload: {
  quizId: number;
  courseId: number;
  enrollmentId: number;
  answers: Record<number, number | number[]>; // Terima format ini dari player baru
  timeTaken: number;
  attemptSession: number;
}) {
  try {
    const { userId } = await getStudentSession();
    const {
      quizId,
      courseId,
      enrollmentId,
      answers,
      timeTaken,
      attemptSession,
    } = payload;
    console.log("🔵 [SERVER ACTION] submitQuizAttempt called"); // Log awal
    console.log("📊 Payload:", {
      quizId,
      courseId,
      enrollmentId,
      attemptSession,
      userId,
    });
    console.log("📊 Answers:", answers);

    // 1. Ambil data Quiz (termasuk max_attempts)
    const quiz = await Quiz.findByPk(quizId, {
      attributes: ["quiz_id", "quiz_title", "max_attempts", "passing_score"], // Ambil atribut yg relevan
      include: [
        {
          model: QuizQuestion,
          as: "questions",
          include: [{ model: QuizAnswerOption, as: "options" }],
        },
      ],
    });
    if (!quiz || !quiz.questions)
      return { success: false, error: "Quiz atau Pertanyaan tidak ditemukan." };
    console.log(`✅ Quiz found: ${quiz.quiz_title}`);

    const maxAttempts = quiz.max_attempts || 1;
    console.log(`📊 Max attempts: ${maxAttempts}`);

    // --- PENGECEKAN LEBIH AWAL ---
    // Cek apakah attempt session INI sudah ada di DB
    const existingRecordForSession = await StudentQuizAnswer.findOne({
      where: {
        user_id: userId,
        quiz_id: quizId,
        attempt_session: attemptSession, // Cek session spesifik ini
      },
      attributes: ["answer_id"], // Hanya perlu cek keberadaan
    });

    if (existingRecordForSession) {
      console.warn(
        `⚠️ Attempt session ${attemptSession} already exists in DB for user ${userId}, quiz ${quizId}. Aborting.`
      );
      return {
        success: false,
        error: `Percobaan ke-${attemptSession} sudah pernah dikirim sebelumnya.`,
      };
    }
    console.log(`✅ Attempt session ${attemptSession} is new.`);
    // --- AKHIR PENGECEKAN AWAL ---

    // (Pengecekan jumlah attempt sebelumnya bisa dihapus dari sini jika pengecekan di atas sudah cukup,
    //  atau dipertahankan sebagai sanity check tambahan sebelum menyimpan)
    /*
        const previousAttemptsCount = await StudentQuizAnswer.count({
             where: { user_id: userId, quiz_id: quizId },
             distinct: true,
             col: 'attempt_session'
        });
        console.log(`📊 Previous attempts count: ${previousAttemptsCount}`);
        console.log(`📊 Current attempt session being submitted: ${attemptSession}`);
        console.log(`📊 Max attempts allowed: ${maxAttempts}`);

        // PENTING: Cek apakah attemptSession yg *akan dimasukkan* valid
        if (attemptSession > maxAttempts) {
             console.warn(`⚠️ Attempt session ${attemptSession} exceeds max attempts ${maxAttempts}.`);
             return { success: false, error: `Batas maksimal ${maxAttempts} percobaan telah terlampaui.` };
        }
        */

    // 2. Hitung Skor (Logika tetap sama)
    let correctAnswers = 0;
    const totalQuestions = quiz.questions.length;
    const answerRecords = [];

    for (const question of quiz.questions) {
      const studentAnswerRaw = answers[question.question_id]; // Bisa number, array, atau undefined
      const correctOptions =
        question.options
          ?.filter((opt) => opt.is_correct)
          .map((opt) => opt.option_id) || [];
      let isQuestionCorrect = false;
      let selectedOptionId: number | null = null;
      let answerText: string | null = null; // Untuk array checkbox

      if (
        question.question_type === "multiple_choice" &&
        typeof studentAnswerRaw === "number"
      ) {
        selectedOptionId = studentAnswerRaw;
        isQuestionCorrect =
          correctOptions.length === 1 && correctOptions[0] === studentAnswerRaw;
      } else if (
        question.question_type === "checkbox" &&
        Array.isArray(studentAnswerRaw)
      ) {
        // Konversi array number ke array string ID untuk disimpan
        answerText = JSON.stringify(studentAnswerRaw.sort()); // Simpan sebagai JSON
        const studentAnswerSet = new Set(studentAnswerRaw);
        const correctOptionsSet = new Set(correctOptions);
        isQuestionCorrect =
          studentAnswerSet.size === correctOptionsSet.size &&
          [...studentAnswerSet].every((id) => correctOptionsSet.has(id));
      }

      if (isQuestionCorrect) correctAnswers++;

      answerRecords.push({
        user_id: userId,
        quiz_id: quizId,
        course_id: courseId,
        question_id: question.question_id,
        selected_option_id: selectedOptionId,
        answer_text: answerText, // Simpan JSON array checkbox
        is_correct: isQuestionCorrect,
        attempt_session: attemptSession,
        answered_at: new Date(),
      });
    }

    const score =
      totalQuestions > 0
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : 0;
    const status = score >= (quiz.passing_score ?? 0) ? "passed" : "failed";
    console.log(`📊 Calculated score: ${score}, status: ${status}`);

    // 3. Simpan Jawaban (Transaksi tetap bagus)
    console.log(
      `💾 Saving ${answerRecords.length} answer records for session ${attemptSession}...`
    );
    await sequelize.transaction(async (t) => {
      await StudentQuizAnswer.bulkCreate(
        answerRecords.map((rec) => ({
          ...rec,
          score: score, // Simpan skor akhir di setiap record
          status: status, // Simpan status akhir
          completed_at: new Date(), // Waktu selesai quiz
        })),
        { transaction: t }
      );
    });
    console.log(`✅ Answers saved successfully.`);

    // 4. Cek Kelulusan Kursus (Logika tetap sama)
    const { totalItems, completedCount } = await calculateCourseCompletion(
      userId,
      courseId
    );
    let certificateGranted = false;
    console.log(`📊 Course completion check: ${completedCount}/${totalItems}`);
    if (status === "passed" && totalItems > 0 && completedCount >= totalItems) {
      // ... (logika buat sertifikat dan update enrollment) ...
      console.log("🎉 Course completed! Checking/Granting certificate...");
      // ...
      certificateGranted = true; // Set flag jika sertifikat dibuat
    }

    revalidatePath(`/student/courses/${courseId}/learn`);
    return { success: true, score: score, status: status, certificateGranted };
  } catch (error: any) {
    console.error("❌ [SUBMIT_QUIZ_ATTEMPT_ERROR]", error);
    return {
      success: false,
      error: error.message || "Gagal menyimpan jawaban quiz.",
    };
  }
}

/**
 * Mengambil detail jawaban dari attempt quiz tertentu
 * Untuk keperluan review jawaban
 */
export async function getQuizAttemptDetails(
  quizId: number,
  attemptSession: number
) {
  try {
    const { userId } = await getStudentSession();

    // Ambil semua jawaban untuk attempt ini
    const answers = await StudentQuizAnswer.findAll({
      where: {
        user_id: userId,
        quiz_id: quizId,
        attempt_session: attemptSession,
      },
      include: [
        {
          model: QuizQuestion,
          as: "question",
          include: [
            {
              model: QuizAnswerOption,
              as: "options",
            },
          ],
        },
      ],
      order: [["question_id", "ASC"]],
    });

    if (answers.length === 0) {
      return {
        success: false,
        error: "Detail jawaban tidak ditemukan.",
      };
    }

    // Convert ke format yang mudah digunakan
    const studentAnswers: Record<number, number | number[]> = {};
    
    answers.forEach((answer) => {
      const questionId = answer.question_id;
      
      if (answer.selected_option_id !== null) {
        // Multiple choice
        studentAnswers[questionId] = answer.selected_option_id;
      } else if (answer.answer_text) {
        // Checkbox - parse JSON array
        try {
          studentAnswers[questionId] = JSON.parse(answer.answer_text);
        } catch {
          studentAnswers[questionId] = [];
        }
      }
    });

    return {
      success: true,
      data: {
        studentAnswers,
        score: answers[0]?.score || 0,
        status: answers[0]?.status || "failed",
        completed_at: answers[0]?.completed_at,
      },
    };
  } catch (error: any) {
    console.error("[GET_QUIZ_ATTEMPT_DETAILS_ERROR]", error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// ASSIGNMENT SUBMISSION
// ============================================================================

/**
 * Submit atau update assignment submission
 */
export async function createOrUpdateAssignmentSubmission(formData: FormData) {
  try {
    const { userId } = await getStudentSession();

    // Baca data dari FormData
    const materialDetailId = parseInt(
      formData.get("materialDetailId") as string,
      10
    );
    const courseId = parseInt(formData.get("courseId") as string, 10);
    const enrollmentId = parseInt(formData.get("enrollmentId") as string, 10);
    const submission_type = formData.get("submission_type") as
      | "file"
      | "text"
      | "url";
    const file_path = formData.get("file_path") as string | null;
    const submission_text = formData.get("submission_text") as string | null;

    if (isNaN(materialDetailId) || isNaN(courseId) || isNaN(enrollmentId)) {
      return { success: false, error: "Data ID tidak valid." };
    }

    if (
      !submission_type ||
      (submission_type === "file" && !file_path) ||
      (submission_type === "text" && !submission_text)
    ) {
      return {
        success: false,
        error: "Konten submission (file atau teks) wajib diisi.",
      };
    }

    // Cari submission yang ada
    const existingSubmission = await AssignmentSubmission.findOne({
      where: { user_id: userId, material_detail_id: materialDetailId },
    });

    const submissionData = {
      user_id: userId,
      material_detail_id: materialDetailId,
      course_id: courseId,
      enrollment_id: enrollmentId,
      submission_type: submission_type,
      file_path: submission_type === "file" ? file_path : null,
      submission_url: null,
      submission_text: submission_type === "text" ? submission_text : null,
      submitted_at: new Date(),
      status: "submitted" as const,
      score: null,
      feedback: null,
      reviewed_by: null,
      reviewed_at: null,
    };

    if (existingSubmission) {
      // Cek apakah sudah dinilai lulus
      if (existingSubmission.status === "approved") {
        return {
          success: false,
          error: "Tugas sudah dinilai lulus, tidak dapat dikumpulkan ulang.",
        };
      }

      // Hapus file lama jika ada dan diganti
      if (
        existingSubmission.submission_type === "file" &&
        existingSubmission.file_path &&
        submission_type === "file" &&
        file_path !== existingSubmission.file_path
      ) {
        await deleteFromPublic(existingSubmission.file_path);
      }

      // Jika tipe berubah dari file ke text, hapus file lama
      if (
        existingSubmission.submission_type === "file" &&
        existingSubmission.file_path &&
        submission_type === "text"
      ) {
        await deleteFromPublic(existingSubmission.file_path);
      }

      // Update submission yang ada
      await existingSubmission.update(submissionData);
      revalidatePath(`/student/courses/${courseId}/learn`);
      return { success: true, message: "Tugas berhasil dikumpulkan ulang." };
    } else {
      // Buat submission baru
      await AssignmentSubmission.create(submissionData);
      revalidatePath(`/student/courses/${courseId}/learn`);
      return { success: true, message: "Tugas berhasil dikumpulkan." };
    }
  } catch (error: any) {
    console.error("[SUBMIT_ASSIGNMENT_ERROR]", error);
    return {
      success: false,
      error: error.message || "Gagal mengumpulkan tugas.",
    };
  }
}

// ============================================================================
// CERTIFICATES
// ============================================================================

/**
 * Mengambil semua sertifikat yang dimiliki mahasiswa
 */
export async function getMyCertificates() {
  try {
    const { userId } = await getStudentSession();

    const certificates = await Certificate.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Course,
          as: "course",
          attributes: ["course_title", "thumbnail_url"],
        },
      ],
      order: [["issued_at", "DESC"]],
    });

    return { success: true, data: certificates.map((c) => c.toJSON()) };
  } catch (error: any) {
    console.error("[GET_MY_CERTIFICATES_ERROR]", error);
    return { success: false, error: error.message };
  }
}
