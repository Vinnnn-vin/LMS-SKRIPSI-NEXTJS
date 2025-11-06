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
import { deleteFromPublic } from "@/lib/uploadHelper";

async function getStudentSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "student") {
    throw new Error("Akses ditolak. Anda harus login sebagai mahasiswa.");
  }
  return { userId: parseInt(session.user.id, 10), session };
}

async function calculateCourseCompletion(
  userId: number,
  courseId: number
): Promise<{ totalItems: number; completedCount: number }> {
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

  const completedQuizzes = await StudentQuizAnswer.count({
    where: { user_id: userId, course_id: courseId, status: "passed" },
    distinct: true,
    col: "quiz_id",
  });

  const completedAssignments = await AssignmentSubmission.count({
    where: { user_id: userId, course_id: courseId, status: "approved" },
    distinct: true,
    col: "material_detail_id",
  });

  const completedCount =
    completedDetails + completedQuizzes + completedAssignments;

  return { totalItems, completedCount };
}

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

export async function getMyEnrolledCourses() {
  try {
    const { userId } = await getStudentSession();

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

    const totalMaterialsMap = totalMaterialsResult.reduce(
      (acc, material) => {
        const courseId = material.course_id;
        if (!acc[courseId]) acc[courseId] = 0;
        acc[courseId] += material.details?.length || 0;
        return acc;
      },
      {} as { [key: number]: number }
    );

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
      const course = (enrollment.course as Course).toJSON();

      const { totalItems, completedCount } = await calculateCourseCompletion(
        userId,
        course.course_id
      );
      const progress =
        totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

      return {
        ...course,
        enrollment_id: enrollment.enrollment_id,
        status: enrollment.status,
        progress: progress > 100 ? 100 : progress,
      };
    });

    const processedCourses = await Promise.all(processedCoursesPromises);

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

export async function getCourseLearningData(courseId: number) {
  try {
    const { userId } = await getStudentSession();

    let enrollment = await Enrollment.findOne({
      where: {
        course_id: courseId,
        user_id: userId,
        status: "active",
      },
      include: [
        {
          model: Course,
          as: "course",
          attributes: ["course_duration"], // Tambahkan ini
        },
      ],
    });

    if (!enrollment) {
      const completedEnrollment = await Enrollment.findOne({
        where: { course_id: courseId, user_id: userId, status: "completed" },
      });

      if (completedEnrollment) {
        enrollment = completedEnrollment;
      } else {
        throw new Error("Anda tidak terdaftar di kursus ini.");
      }
    }

    // ✅ CEK EXPIRED - TAPI JANGAN LANGSUNG RESET DI SINI
    // Biarkan client yang handle dengan GlobalTimer
    const isAccessExpired =
      enrollment.access_expires_at &&
      dayjs().isAfter(dayjs(enrollment.access_expires_at));

    // Jika expired, kembalikan flag tapi tetap load data
    // (Client akan tampilkan modal/alert)
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

    // Load progress data seperti biasa...
    const progressDetails = await StudentProgress.findAll({
      where: { user_id: userId, course_id: courseId, is_completed: true },
      attributes: ["material_detail_id"],
      raw: true,
    });
    const completedDetailSet = new Set(
      progressDetails.map((p) => p.material_detail_id)
    );

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
          attributes: [
            "material_detail_id",
            "material_detail_name",
            "passing_score",
          ],
        },
      ],
    });

    const latestSubmissionsMap = new Map<number, any>();
    const approvedAssignmentSet = new Set<number>();
    const submissionHistoryMap = new Map<number, any[]>();

    allAssignmentSubmissions.forEach((sub) => {
      const detailId = sub.material_detail_id;

      if (!latestSubmissionsMap.has(detailId)) {
        latestSubmissionsMap.set(detailId, sub.toJSON());
      }

      if (sub.status === "approved") {
        approvedAssignmentSet.add(detailId);
      }

      if (!submissionHistoryMap.has(detailId)) {
        submissionHistoryMap.set(detailId, []);
      }
      submissionHistoryMap.get(detailId)!.push(sub.toJSON());
    });

    const initialSubmissionData = Array.from(latestSubmissionsMap.values());

    const submissionHistoryObj: Record<number, any[]> = {};
    submissionHistoryMap.forEach((history, detailId) => {
      submissionHistoryObj[detailId] = history;
    });

    const allQuizAttempts = await StudentQuizAnswer.findAll({
      where: {
        user_id: userId,
        course_id: courseId,
        status: { [Op.in]: ["passed", "failed"] },
      },
      order: [["attempt_session", "DESC"]],
    });

    const initialQuizAttempts = allQuizAttempts.map((a) => a.toJSON());

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
        initialQuizAttempts: initialQuizAttempts,
        submissionHistoryMap: submissionHistoryObj,
        accessExpiresAt: enrollment.access_expires_at,
        enrolledAt: enrollment.enrolled_at,
        learningStartedAt: enrollment.learning_started_at, // ✅ Tambahkan ini
        courseDuration: (course as any).course_duration || 0, // ✅ Tambahkan ini
        isAccessExpired: isAccessExpired, // ✅ Flag expired
        lastCheckpoint: enrollment.checkpoint_id
          ? {
              type: enrollment.checkpoint_type!,
              id: enrollment.checkpoint_id,
              updatedAt: enrollment.checkpoint_updated_at!,
            }
          : null, // ✅ NEW: Checkpoint data
      },
    };
  } catch (error: any) {
    console.error("[GET_COURSE_LEARNING_DATA_ERROR]", error);
    return { success: false, error: error.message };
  }
}

export async function markMaterialAsComplete(
  materialDetailId: number,
  courseId: number,
  enrollmentId: number
) {
  try {
    const { userId } = await getStudentSession();

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

    if (!created && !progress.is_completed) {
      await progress.update({
        is_completed: true,
        completed_at: new Date(),
      });
    }

    const { totalItems, completedCount } = await calculateCourseCompletion(
      userId,
      courseId
    );
    let certificateGranted = false;

    if (totalItems > 0 && completedCount >= totalItems) {
      const enrollment = await Enrollment.findByPk(enrollmentId);

      if (enrollment && enrollment.status === "active") {
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

export async function submitQuizAttempt(payload: {
  quizId: number;
  courseId: number;
  enrollmentId: number;
  answers: Record<number, number | number[]>;
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
    console.log("🔵 [SERVER ACTION] submitQuizAttempt called");
    console.log("📊 Payload:", {
      quizId,
      courseId,
      enrollmentId,
      attemptSession,
      userId,
    });
    console.log("📊 Answers:", answers);

    const quiz = await Quiz.findByPk(quizId, {
      attributes: ["quiz_id", "quiz_title", "max_attempts", "passing_score"],
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

    const existingRecordForSession = await StudentQuizAnswer.findOne({
      where: {
        user_id: userId,
        quiz_id: quizId,
        attempt_session: attemptSession,
      },
      attributes: ["answer_id"],
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

    let correctAnswers = 0;
    const totalQuestions = quiz.questions.length;
    const answerRecords = [];

    for (const question of quiz.questions) {
      const studentAnswerRaw = answers[question.question_id];
      const correctOptions =
        question.options
          ?.filter((opt) => opt.is_correct)
          .map((opt) => opt.option_id) || [];
      let isQuestionCorrect = false;
      let selectedOptionId: number | null = null;
      let answerText: string | null = null;

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
        answerText = JSON.stringify(studentAnswerRaw.sort());
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
        answer_text: answerText,
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

    console.log(
      `💾 Saving ${answerRecords.length} answer records for session ${attemptSession}...`
    );
    await sequelize.transaction(async (t) => {
      await StudentQuizAnswer.bulkCreate(
        answerRecords.map((rec) => ({
          ...rec,
          score: score,
          status: status,
          completed_at: new Date(),
        })),
        { transaction: t }
      );
    });
    console.log(`✅ Answers saved successfully.`);

    const { totalItems, completedCount } = await calculateCourseCompletion(
      userId,
      courseId
    );
    let certificateGranted = false;
    console.log(`📊 Course completion check: ${completedCount}/${totalItems}`);
    if (status === "passed" && totalItems > 0 && completedCount >= totalItems) {
      console.log("🎉 Course completed! Checking/Granting certificate...");
      certificateGranted = true;
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

export async function getQuizAttemptDetails(
  quizId: number,
  attemptSession: number
) {
  try {
    const { userId } = await getStudentSession();

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

    const studentAnswers: Record<number, number | number[]> = {};

    answers.forEach((answer) => {
      const questionId = answer.question_id;

      if (answer.selected_option_id !== null) {
        studentAnswers[questionId] = answer.selected_option_id;
      } else if (answer.answer_text) {
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

export async function createOrUpdateAssignmentSubmission(formData: FormData) {
  try {
    const { userId } = await getStudentSession();

    const materialDetailId = parseInt(
      formData.get("materialDetailId") as string,
      10
    );
    const courseId = parseInt(formData.get("courseId") as string, 10);
    const enrollmentId = parseInt(formData.get("enrollmentId") as string, 10);

    const submission_type = formData.get("submission_type") as
      | "file"
      | "text"
      | "both"
      | "url";

    const file_path = formData.get("file_path") as string | null;
    const submission_text = formData.get("submission_text") as string | null;

    if (isNaN(materialDetailId) || isNaN(courseId) || isNaN(enrollmentId)) {
      return { success: false, error: "Data ID tidak valid." };
    }

    if (!submission_type) {
      return {
        success: false,
        error: "Tipe submission wajib diisi.",
      };
    }

    if (submission_type === "file" && !file_path) {
      return {
        success: false,
        error: "File wajib diupload untuk tipe submission 'file'.",
      };
    }

    if (submission_type === "text" && !submission_text?.trim()) {
      return {
        success: false,
        error: "Teks jawaban wajib diisi untuk tipe submission 'text'.",
      };
    }

    if (submission_type === "both") {
      if (!file_path || !submission_text?.trim()) {
        return {
          success: false,
          error: "File dan teks wajib diisi untuk tipe submission 'both'.",
        };
      }
    }

    if (!file_path && !submission_text?.trim()) {
      return {
        success: false,
        error: "Minimal file atau teks jawaban harus diisi.",
      };
    }

    const existingSubmission = await AssignmentSubmission.findOne({
      where: { user_id: userId, material_detail_id: materialDetailId },
    });

    const submissionData = {
      user_id: userId,
      material_detail_id: materialDetailId,
      course_id: courseId,
      enrollment_id: enrollmentId,
      submission_type: submission_type,
      file_path:
        submission_type === "file" || submission_type === "both"
          ? file_path
          : null,
      submission_url: null,
      submission_text:
        submission_type === "text" || submission_type === "both"
          ? submission_text?.trim()
          : null,
      submitted_at: new Date(),
      status: "submitted" as const,
      score: null,
      feedback: null,
      reviewed_by: null,
      reviewed_at: null,
    };

    if (existingSubmission) {
      if (existingSubmission.status === "approved") {
        return {
          success: false,
          error: "Tugas sudah dinilai lulus, tidak dapat dikumpulkan ulang.",
        };
      }

      const oldHasFile =
        existingSubmission.submission_type === "file" ||
        existingSubmission.submission_type === "both";

      const newHasFile =
        submission_type === "file" || submission_type === "both";

      if (oldHasFile && existingSubmission.file_path) {
        const shouldDeleteFile =
          (newHasFile && file_path !== existingSubmission.file_path) ||
          !newHasFile;

        if (shouldDeleteFile) {
          try {
            await deleteFromPublic(existingSubmission.file_path);
            console.log("✅ Old file deleted:", existingSubmission.file_path);
          } catch (deleteError) {
            console.error("⚠️ Failed to delete old file:", deleteError);
          }
        }
      }

      await existingSubmission.update(submissionData);
      revalidatePath(`/student/courses/${courseId}/learn`);
      return { success: true, message: "Tugas berhasil dikumpulkan ulang." };
    } else {
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

export async function resetCourseProgressAndExtendAccess(
  courseId: number,
  enrollmentId: number
) {
  try {
    const { userId } = await getStudentSession();

    // Validasi enrollment
    const enrollment = await Enrollment.findOne({
      where: {
        enrollment_id: enrollmentId,
        user_id: userId,
        course_id: courseId,
      },
      include: [
        {
          model: Course,
          as: "course",
          attributes: ["course_duration"], // Asumsi ada field ini dalam jam
        },
      ],
    });

    if (!enrollment) {
      throw new Error("Enrollment tidak ditemukan.");
    }

    const course = enrollment.course as any;
    const courseDuration = course?.course_duration || 0; // dalam jam

    await sequelize.transaction(async (t) => {
      // 1. Hapus semua progress
      await StudentProgress.destroy({
        where: { user_id: userId, course_id: courseId },
        transaction: t,
      });

      // 2. Hapus semua quiz attempts
      await StudentQuizAnswer.destroy({
        where: { user_id: userId, course_id: courseId },
        transaction: t,
      });

      // 3. Hapus semua assignment submissions
      await AssignmentSubmission.destroy({
        where: { user_id: userId, course_id: courseId },
        transaction: t,
      });

      // 4. Hapus certificate jika ada
      await Certificate.destroy({
        where: { user_id: userId, course_id: courseId },
        transaction: t,
      });

      // 5. Update enrollment - EXTEND ACCESS, bukan hapus
      const updateData: any = {
        status: "active", // Tetap active
        completed_at: null, // Reset completion
        learning_started_at: new Date(), // Reset learning start time
        // ✅ Reset checkpoint
        checkpoint_type: null,
        checkpoint_id: null,
        checkpoint_updated_at: null,
      };

      // Set new access_expires_at jika ada durasi
      if (courseDuration > 0) {
        updateData.access_expires_at = dayjs()
          .add(courseDuration, "hour")
          .toDate();
      } else {
        updateData.access_expires_at = null; // Unlimited
      }

      await enrollment.update(updateData, { transaction: t });
    });

    console.log(
      `✅ Progress reset & access extended for user ${userId}, course ${courseId}`
    );

    return {
      success: true,
      message: "Progress direset. Anda dapat memulai pembelajaran kembali!",
    };
  } catch (error: any) {
    console.error("[RESET_PROGRESS_ERROR]", error);
    return {
      success: false,
      error: error.message || "Gagal mereset progress.",
    };
  }
}


export async function saveCheckpoint(payload: {
  courseId: number;
  enrollmentId: number;
  contentType: "detail" | "quiz";
  contentId: number; // material_detail_id atau quiz_id
}) {
  try {
    const { userId } = await getStudentSession();
    const { courseId, enrollmentId, contentType, contentId } = payload;

    // Validasi enrollment
    const enrollment = await Enrollment.findOne({
      where: {
        enrollment_id: enrollmentId,
        user_id: userId,
        course_id: courseId,
        status: { [Op.in]: ["active", "completed"] },
      },
    });

    if (!enrollment) {
      throw new Error("Enrollment tidak valid.");
    }

    // Update checkpoint di enrollment
    // CATATAN: Perlu tambah field di model Enrollment:
    // - checkpoint_type: "detail" | "quiz" | null
    // - checkpoint_id: number | null
    // - checkpoint_updated_at: Date | null
    
    await enrollment.update({
      checkpoint_type: contentType,
      checkpoint_id: contentId,
      checkpoint_updated_at: new Date(),
    });

    console.log(
      `✅ Checkpoint saved: user ${userId}, course ${courseId}, ${contentType} ${contentId}`
    );

    return { success: true };
  } catch (error: any) {
    console.error("[SAVE_CHECKPOINT_ERROR]", error);
    return { success: false, error: error.message };
  }
}

export async function getLastCheckpoint(
  courseId: number,
  enrollmentId: number
) {
  try {
    const { userId } = await getStudentSession();

    const enrollment = await Enrollment.findOne({
      where: {
        enrollment_id: enrollmentId,
        user_id: userId,
        course_id: courseId,
      },
      attributes: [
        "checkpoint_type",
        "checkpoint_id",
        "checkpoint_updated_at",
      ],
    });

    if (!enrollment || !enrollment.checkpoint_id) {
      return { success: true, data: null };
    }

    return {
      success: true,
      data: {
        type: enrollment.checkpoint_type,
        id: enrollment.checkpoint_id,
        updatedAt: enrollment.checkpoint_updated_at,
      },
    };
  } catch (error: any) {
    console.error("[GET_CHECKPOINT_ERROR]", error);
    return { success: false, error: error.message };
  }
}

export async function getNextIncompleteContent(
  courseId: number,
  enrollmentId: number
) {
  try {
    const { userId } = await getStudentSession();

    // Ambil course dengan semua materials
    const course = await Course.findByPk(courseId, {
      include: [
        {
          model: Material,
          as: "materials",
          include: [
            {
              model: MaterialDetail,
              as: "details",
              required: false,
            },
            {
              model: Quiz,
              as: "quizzes",
              required: false,
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

    if (!course || !course.materials || course.materials.length === 0) {
      return { success: false, error: "Course tidak memiliki materi." };
    }

    // Ambil completed items
    const completedDetails = await StudentProgress.findAll({
      where: { user_id: userId, course_id: courseId, is_completed: true },
      attributes: ["material_detail_id"],
      raw: true,
    });
    const completedDetailSet = new Set(
      completedDetails.map((p: any) => p.material_detail_id)
    );

    const passedQuizzes = await StudentQuizAnswer.findAll({
      where: { user_id: userId, course_id: courseId, status: "passed" },
      attributes: [
        [sequelize.fn("DISTINCT", sequelize.col("quiz_id")), "quiz_id"],
      ],
      raw: true,
    });
    const completedQuizSet = new Set(
      passedQuizzes.map((q: any) => q.quiz_id)
    );

    const approvedAssignments = await AssignmentSubmission.findAll({
      where: { user_id: userId, course_id: courseId, status: "approved" },
      attributes: [
        [
          sequelize.fn("DISTINCT", sequelize.col("material_detail_id")),
          "material_detail_id",
        ],
      ],
      raw: true,
    });
    const completedAssignmentSet = new Set(
      approvedAssignments.map((a: any) => a.material_detail_id)
    );

    // Cari first incomplete content
    for (const material of course.materials) {
      // Check details
      if (material.details && material.details.length > 0) {
        for (const detail of material.details) {
          const isCompleted =
            detail.material_detail_type === 4
              ? completedAssignmentSet.has(detail.material_detail_id)
              : completedDetailSet.has(detail.material_detail_id);

          if (!isCompleted) {
            return {
              success: true,
              data: {
                type: "detail",
                id: detail.material_detail_id,
                name: detail.material_detail_name,
                materialName: material.material_name,
              },
            };
          }
        }
      }

      // Check quizzes
      if (material.quizzes && material.quizzes.length > 0) {
        for (const quiz of material.quizzes) {
          if (!completedQuizSet.has(quiz.quiz_id)) {
            return {
              success: true,
              data: {
                type: "quiz",
                id: quiz.quiz_id,
                name: quiz.quiz_title,
                materialName: material.material_name,
              },
            };
          }
        }
      }
    }

    // Semua sudah selesai
    return {
      success: true,
      data: null, // null = course completed
    };
  } catch (error: any) {
    console.error("[GET_NEXT_INCOMPLETE_ERROR]", error);
    return { success: false, error: error.message };
  }
}