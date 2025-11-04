// lmsistts\src\app\actions\lecturer.actions.ts

"use server";

import {
  Course,
  Material,
  Quiz,
  QuizQuestion,
  QuizAnswerOption,
  sequelize,
  MaterialDetail,
  Enrollment,
  Payment,
  Category,
  User,
  StudentProgress,
  AssignmentSubmission,
} from "@/lib/models";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  lecturerCreateCourseSchema,
  lecturerUpdateCourseSchema,
  LecturerCreateCourseInput,
  LecturerUpdateCourseInput,
} from "@/lib/schemas/course.schema";
import { Op } from "sequelize";
import {
  CreateMaterialInput,
  createMaterialSchema,
  UpdateMaterialInput,
  updateMaterialSchema,
} from "@/lib/schemas/material.schema";
import {
  createMaterialDetailSchema,
  updateMaterialDetailSchema,
} from "@/lib/schemas/materialDetail.schema";
import {
  CreateQuizInput,
  createQuizSchema,
  UpdateQuizInput,
  updateQuizSchema,
} from "@/lib/schemas/quiz.schema";
import {
  CreateQuestionInput,
  createQuestionSchema,
} from "@/lib/schemas/quizQuestion.schema";
import { deleteCourseThumbnailFolder, deleteFromPublic, uploadCourseThumbnail, uploadToPublic } from "@/lib/uploadHelper";
import { base64ToBuffer, sanitizeFilename } from "@/lib/fileUtils";
import path from "path";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import {
  ReviewAssignmentInput,
  reviewAssignmentSchema,
} from "@/lib/schemas/assignmentSubmission.schema";

// Helper function untuk memeriksa sesi dosen
async function getLecturerSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "lecturer") {
    throw new Error("Akses ditolak. Anda harus login sebagai dosen.");
  }
  return { userId: parseInt(session.user.id, 10), session };
}

// --- FUNGSI BARU UNTUK MENGAMBIL TUGAS YANG PERLU DIREVIEW ---
export async function getAssignmentsToReviewByLecturer(options?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  statusFilter?: string;
}) {
  try {
    const { userId } = await getLecturerSession();

    // 1. Ambil ID kursus milik dosen
    const lecturerCourseIds = await Course.findAll({
      where: { user_id: userId },
      attributes: ["course_id"],
      raw: true,
    }).then((courses) => courses.map((c) => c.course_id));

    if (lecturerCourseIds.length === 0) {
      return { success: true, data: [], total: 0 }; // Tidak ada kursus, tidak ada tugas
    }

    // 2. Siapkan kondisi pencarian
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const offset = (page - 1) * limit;
    const sortBy = options?.sortBy || "submitted_at";
    const sortOrder = options?.sortOrder || "DESC";

    const whereClause: any = {
      course_id: { [Op.in]: lecturerCourseIds },
      // Prioritaskan yang belum direview atau sedang direview
      status: { [Op.in]: ["submitted", "under_review"] },
    };

    // Tambahkan filter status jika ada
    if (
      options?.statusFilter &&
      ["submitted", "under_review", "approved", "rejected"].includes(
        options.statusFilter
      )
    ) {
      whereClause.status = options.statusFilter;
    }

    // 3. Ambil data submission
    const { count, rows: submissions } =
      await AssignmentSubmission.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: "student",
            attributes: ["user_id", "first_name", "last_name", "email"],
          },
          {
            model: MaterialDetail,
            as: "assignment",
            attributes: ["material_detail_id", "material_detail_name"],
          },
          {
            model: Course,
            as: "course",
            attributes: ["course_id", "course_title"],
          },
          // Bisa tambahkan 'reviewer' jika ingin menampilkan siapa yg mereview
          // { model: User, as: 'reviewer', attributes: ['user_id', 'first_name', 'last_name']}
        ],
        order: [[sortBy, sortOrder]],
        limit: limit,
        offset: offset,
      });

    return {
      success: true,
      data: submissions.map((s) => s.toJSON()),
      total: count,
    };
  } catch (error: any) {
    console.error("[GET_ASSIGNMENTS_TO_REVIEW_ERROR]", error);
    return {
      success: false,
      error: error.message || "Gagal mengambil data tugas.",
    };
  }
}

// --- FUNGSI BARU UNTUK MENILAI TUGAS ---
export async function gradeAssignmentByLecturer(
  submissionId: number,
  values: ReviewAssignmentInput
) {
  try {
    const { userId } = await getLecturerSession();

    // 1. Validasi input penilaian
    const validatedFields = reviewAssignmentSchema.safeParse(values);
    if (!validatedFields.success) {
      const firstError = Object.values(
        validatedFields.error.flatten().fieldErrors
      )[0]?.[0];
      return {
        success: false,
        error: firstError || "Input penilaian tidak valid!",
      };
    }
    const { status, score, feedback } = validatedFields.data;

    // 2. Cari submission dan validasi kepemilikan kursus
    const submission = await AssignmentSubmission.findOne({
      where: { submission_id: submissionId },
      include: [
        {
          model: Course,
          as: "course",
          where: { user_id: userId },
          attributes: [],
        },
      ], // Cek kepemilikan via course
    });

    if (!submission) {
      return {
        success: false,
        error: "Submission tidak ditemukan atau Anda tidak berhak menilainya.",
      };
    }

    // Optional: Validasi skor hanya jika status 'approved'
    if (
      status === "approved" &&
      (score === null || score === undefined || score < 0 || score > 100)
    ) {
      return {
        success: false,
        error: "Skor harus diisi (0-100) jika status Approved.",
      };
    }
    // Optional: Set skor jadi null jika ditolak
    const finalScore = status === "rejected" ? null : score;

    // 3. Update data submission
    await submission.update({
      status: status,
      score: finalScore,
      feedback: feedback || null, // Pastikan feedback bisa null
      reviewed_by: userId,
      reviewed_at: new Date(),
    });

    // Revalidate path halaman review tugas (jika diperlukan refresh otomatis)
    revalidatePath("/lecturer/dashboard/assignments");

    // TODO: Kirim notifikasi ke mahasiswa (jika ada sistem notifikasi)

    return { success: true, message: "Tugas berhasil dinilai." };
  } catch (error: any) {
    console.error("[GRADE_ASSIGNMENT_ERROR]", error);
    return {
      success: false,
      error: error.message || "Gagal menyimpan penilaian.",
    };
  }
}

// --- FUNGSI BARU UNTUK OVERVIEW DASHBOARD LECTURER ---
export async function getLecturerDashboardStats() {
  try {
    const { userId } = await getLecturerSession();

    // 1. Hitung total kursus milik dosen (tetap sama)
    const totalCourses = await Course.count({ where: { user_id: userId } });

    // --- PERBAIKAN: Ambil ID Kursus Dosen Terlebih Dahulu ---
    const lecturerCourseIds = await Course.findAll({
      where: { user_id: userId },
      attributes: ["course_id"], // Hanya ambil ID
      raw: true, // Hasilnya array objek biasa { course_id: ... }
    }).then((courses) => courses.map((c) => c.course_id)); // Ubah menjadi array ID [1, 5, 10]

    // 2. Hitung total siswa unik yang terdaftar di kursus-kursus tersebut
    const totalStudents = await Enrollment.count({
      distinct: true,
      col: "user_id",
      // Gunakan ID kursus yang sudah didapat
      where: {
        course_id: {
          [Op.in]: lecturerCourseIds, // Filter berdasarkan array ID kursus
        },
      },
    });

    // 3. Hitung total pendapatan dari kursus-kursus tersebut
    const totalSales = await Payment.sum("amount", {
      // Gunakan ID kursus yang sudah didapat
      where: {
        status: "paid",
        course_id: {
          [Op.in]: lecturerCourseIds, // Filter berdasarkan array ID kursus
        },
      },
    });
    // --- AKHIR PERBAIKAN ---

    return {
      success: true,
      data: {
        totalCourses,
        totalStudents,
        totalSales: totalSales || 0,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal mengambil statistik dashboard.",
    };
  }
}

// Mengambil kursus milik dosen yang login
export async function getCoursesByLecturer() {
  try {
    const { userId } = await getLecturerSession();
    const courses = await Course.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["category_name"],
        },
        // ✅ TAMBAHKAN INI: Include materials dan details
        {
          model: Material,
          as: "materials",
          required: false,
          include: [
            {
              model: MaterialDetail,
              as: "details",
              required: false,
              attributes: ["material_detail_id", "material_detail_name"],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });
    return { success: true, data: courses.map((c) => c.toJSON()) };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal mengambil data kursus.",
    };
  }
}

export async function createCourseByLecturer(formData: FormData) {
  try {
    const { userId } = await getLecturerSession();
    const rawData = Object.fromEntries(formData.entries());
    
    const validatedFields = lecturerCreateCourseSchema.safeParse({
      ...rawData,
      thumbnail_file:
        formData.get("thumbnail_file") instanceof File
          ? formData.get("thumbnail_file")
          : undefined,
    });

    if (!validatedFields.success) {
      const firstError = Object.values(
        validatedFields.error.flatten().fieldErrors
      )[0]?.[0];
      return { error: firstError || "Input data tidak valid!" };
    }

    const { thumbnail_file, ...courseData } = validatedFields.data;

    // ✅ PERBAIKAN 1: Buat course dulu untuk dapat courseId
    const newCourse = await Course.create({
      ...courseData,
      user_id: userId,
      publish_status: 0,
      publish_request_status: "none",
      thumbnail_url: null, // Set null dulu
    });

    // ✅ PERBAIKAN 2: Upload thumbnail setelah course dibuat
    let thumbnailUrl = null;
    if (thumbnail_file) {
      const uploadResult = await uploadCourseThumbnail(
        thumbnail_file,
        courseData.course_title,
        newCourse.course_id
      );

      if (!uploadResult.success) {
        // Rollback: hapus course jika upload gagal
        await newCourse.destroy();
        return { error: uploadResult.error || "Gagal mengupload thumbnail." };
      }

      thumbnailUrl = uploadResult.url;

      // Update course dengan thumbnail URL
      await newCourse.update({ thumbnail_url: thumbnailUrl });
    }

    revalidatePath("/lecturer/dashboard/courses");
    
    return { 
      success: "Kursus berhasil dibuat sebagai draft!",
      courseId: newCourse.course_id 
    };
  } catch (error: any) {
    console.error("[CREATE_COURSE_BY_LECTURER_ERROR]", error);
    return { error: error.message || "Gagal membuat kursus." };
  }
}

// ============= UPDATE COURSE =============
export async function updateCourseByLecturer(
  courseId: number,
  formData: FormData
) {
  try {
    const { userId } = await getLecturerSession();
    const rawData = Object.fromEntries(formData.entries());

    const validatedFields = lecturerUpdateCourseSchema.safeParse({
      ...rawData,
      thumbnail_file:
        formData.get("thumbnail_file") instanceof File
          ? formData.get("thumbnail_file")
          : rawData.thumbnail_file === ""
            ? null
            : undefined,
    });

    if (!validatedFields.success) {
      const firstError = Object.values(
        validatedFields.error.flatten().fieldErrors
      )[0]?.[0];
      return { error: firstError || "Input data tidak valid!" };
    }

    const course = await Course.findOne({
      where: { course_id: courseId, user_id: userId },
    });

    if (!course) {
      return {
        error: "Kursus tidak ditemukan atau Anda tidak berhak mengeditnya.",
      };
    }

    const { thumbnail_file, course_title, ...restCourseData } = validatedFields.data;
    let newThumbnailUrl: string | null | undefined = undefined;

    // ✅ PERBAIKAN: Handle upload thumbnail dengan benar
    if (thumbnail_file instanceof File) {
      // 1. Hapus thumbnail lama jika ada
      if (course.thumbnail_url) {
        await deleteFromPublic(course.thumbnail_url);
      }

      // 2. Upload thumbnail baru
      const courseTitleForUpload = course_title || course.course_title;
      const uploadResult = await uploadCourseThumbnail(
        thumbnail_file,
        courseTitleForUpload,
        courseId
      );

      if (!uploadResult.success) {
        return { error: uploadResult.error || "Gagal mengupload thumbnail." };
      }

      newThumbnailUrl = uploadResult.url;
    } else if (thumbnail_file === null) {
      // User explicitly cleared the thumbnail
      if (course.thumbnail_url) {
        await deleteFromPublic(course.thumbnail_url);
      }
      newThumbnailUrl = null;
    }
    // else: undefined = tidak ada perubahan, gunakan nilai lama

    // 3. Prepare update data
    const updateData: any = { ...restCourseData };
    
    if (course_title !== undefined) {
      updateData.course_title = course_title;
    }
    
    if (newThumbnailUrl !== undefined) {
      updateData.thumbnail_url = newThumbnailUrl;
    }

    // 4. Update course
    await course.update(updateData);

    revalidatePath("/lecturer/dashboard/courses");
    revalidatePath(`/lecturer/dashboard/courses/${courseId}`);

    return { success: "Kursus berhasil diperbarui!" };
  } catch (error: any) {
    console.error("[UPDATE_COURSE_BY_LECTURER_ERROR]", error);
    return { error: error.message || "Gagal memperbarui kursus." };
  }
}

// ============= DELETE COURSE =============
export async function deleteCourseByLecturer(courseId: number) {
  try {
    const { userId } = await getLecturerSession();
    const course = await Course.findOne({
      where: { course_id: courseId, user_id: userId },
    });
    
    if (!course) {
      return {
        error: "Kursus tidak ditemukan atau Anda tidak berhak menghapusnya.",
      };
    }

    const enrollmentCount = await Enrollment.count({
      where: { course_id: courseId },
    });
    
    if (enrollmentCount > 0) {
      return {
        error: `Tidak dapat menghapus. Ada ${enrollmentCount} siswa terdaftar.`,
      };
    }

    // ✅ PERBAIKAN: Hapus thumbnail dan folder course sebelum hapus course
    if (course.thumbnail_url) {
      await deleteFromPublic(course.thumbnail_url);
    }

    // Hapus seluruh folder course thumbnail
    await deleteCourseThumbnailFolder(courseId, course.course_title);

    await course.destroy();
    revalidatePath("/lecturer/dashboard/courses");
    
    return { success: "Kursus berhasil dihapus!" };
  } catch (error: any) {
    console.error("[DELETE_COURSE_BY_LECTURER_ERROR]", error);
    return { error: error.message || "Gagal menghapus kursus." };
  }
}
// Dosen meminta publish kursus
export async function requestCoursePublish(courseId: number) {
  try {
    const { userId } = await getLecturerSession();
    const course = await Course.findOne({
      where: { course_id: courseId, user_id: userId },
    });

    if (!course) return { error: "Kursus tidak ditemukan." };

    if (course.publish_status === 1) {
      return { error: "Kursus sudah dipublikasikan." };
    }

    if (course.publish_request_status === "pending") {
      return { error: "Permintaan publish sudah dikirim." };
    }

    // ✅ PERBAIKAN 1: Cek apakah ada material (Bab)
    const materialCount = await Material.count({
      where: { course_id: courseId },
    });

    if (materialCount === 0) {
      return {
        error:
          "Gagal: Kursus belum memiliki Bab materi. Silakan tambahkan minimal 1 Bab terlebih dahulu.",
      };
    }

    // ✅ PERBAIKAN 2: Cek apakah setiap material memiliki konten (MaterialDetail)
    const materialsWithoutContent = await Material.findAll({
      where: { course_id: courseId },
      include: [
        {
          model: MaterialDetail,
          as: "details",
          required: false,
        },
      ],
    });

    const emptyMaterials = materialsWithoutContent.filter(
      (mat) => !mat.details || mat.details.length === 0
    );

    if (emptyMaterials.length > 0) {
      const emptyMaterialNames = emptyMaterials
        .map((m) => `"${m.material_name}"`)
        .join(", ");

      return {
        error: `Gagal: Beberapa Bab belum memiliki konten: ${emptyMaterialNames}. Silakan tambahkan minimal 1 konten (video, PDF, link, atau tugas) untuk setiap Bab.`,
      };
    }

    // ✅ PERBAIKAN 3: Cek apakah ada minimal 1 konten yang bukan gratis (untuk monetisasi)
    const paidContentCount = await MaterialDetail.count({
      include: [
        {
          model: Material,
          as: "material",
          where: { course_id: courseId },
          required: true,
        },
      ],
      where: { is_free: false },
    });

    if (paidContentCount === 0) {
      return {
        error:
          "Gagal: Semua konten bersifat gratis. Silakan set minimal 1 konten sebagai berbayar agar kursus dapat dipublikasikan.",
      };
    }

    // Semua validasi lolos, set status pending
    course.publish_request_status = "pending";
    await course.save();

    revalidatePath("/lecturer/dashboard/courses");

    return {
      success:
        "Permintaan publikasi kursus berhasil dikirim ke admin untuk direview.",
    };
  } catch (error: any) {
    console.error("[REQUEST_COURSE_PUBLISH_ERROR]", error);
    return { error: error.message || "Gagal mengirim permintaan publish." };
  }
}

export async function cancelPublishRequest(courseId: number) {
  try {
    const { userId } = await getLecturerSession();
    const course = await Course.findOne({
      where: { course_id: courseId, user_id: userId },
    });

    if (!course) return { error: "Kursus tidak ditemukan." };

    if (course.publish_request_status !== "pending") {
      return { error: "Tidak ada permintaan publikasi yang sedang pending." };
    }

    course.publish_request_status = "none";
    await course.save();

    revalidatePath("/lecturer/dashboard/courses");
    return { success: "Permintaan publikasi berhasil dibatalkan." };
  } catch (error: any) {
    return { error: error.message || "Gagal membatalkan permintaan." };
  }
}

// --- FUNGSI BARU UNTUK CRUD MATERIAL ---

// Mengambil semua material untuk satu kursus
export async function getMaterialsByCourseId(courseId: number) {
  try {
    const { userId } = await getLecturerSession();
    const course = await Course.findOne({
      where: { course_id: courseId, user_id: userId },
    });
    if (!course) throw new Error("Kursus tidak ditemukan.");

    const materials = await Material.findAll({
      where: { course_id: courseId },
      include: [
        { model: MaterialDetail, as: "details", required: false },
        {
          model: Quiz,
          as: "quizzes",
          attributes: ["quiz_id", "quiz_title"],
          required: false,
        },
      ],
      order: [["material_id", "ASC"]],
    });
    return { success: true, data: materials.map((m) => m.toJSON()) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createMaterial(
  courseId: number,
  values: CreateMaterialInput
) {
  try {
    const { userId } = await getLecturerSession();
    const course = await Course.findOne({
      where: { course_id: courseId, user_id: userId },
    });
    if (!course) throw new Error("Kursus tidak ditemukan.");

    // Validasi objek 'values'
    const validatedFields = createMaterialSchema.safeParse(values);
    if (!validatedFields.success) {
      const firstError = Object.values(
        validatedFields.error.flatten().fieldErrors
      )[0]?.[0];
      return { error: firstError || "Input data materi tidak valid!" };
    }

    await Material.create({
      ...validatedFields.data,
      course_id: courseId,
    });

    revalidatePath(`/lecturer/dashboard/courses/${courseId}/materials`);
    return { success: "Bab materi berhasil ditambahkan!" };
  } catch (error: any) {
    return { error: error.message || "Gagal menambahkan materi." };
  }
}

export async function updateMaterial(
  materialId: number,
  values: UpdateMaterialInput
) {
  try {
    const { userId } = await getLecturerSession();
    const material = await Material.findOne({
      where: { material_id: materialId },
      include: [
        {
          model: Course,
          as: "course",
          where: { user_id: userId },
          attributes: ["course_id"],
        },
      ],
    });
    if (!material) throw new Error("Materi tidak ditemukan.");

    // Validasi objek 'values'
    const validatedFields = updateMaterialSchema.safeParse(values);
    if (!validatedFields.success) {
      const firstError = Object.values(
        validatedFields.error.flatten().fieldErrors
      )[0]?.[0];
      return { error: firstError || "Input data materi tidak valid!" };
    }

    await material.update(validatedFields.data);
    revalidatePath(
      `/lecturer/dashboard/courses/${material.course_id}/materials`
    );
    return { success: "Bab materi berhasil diperbarui!" };
  } catch (error: any) {
    return { error: error.message || "Gagal memperbarui materi." };
  }
}

// Dosen menghapus material
export async function deleteMaterial(materialId: number) {
  try {
    const { userId } = await getLecturerSession();
    const material = await Material.findOne({
      where: { material_id: materialId },
      include: [
        {
          model: Course,
          as: "course",
          where: { user_id: userId },
          attributes: ["course_id"],
        },
      ], // Ambil course_id untuk revalidate
    });
    if (!material)
      throw new Error(
        "Materi tidak ditemukan atau Anda tidak berhak menghapusnya."
      );

    // TODO: Tambahkan validasi jika materi sudah punya detail/konten?
    // const detailCount = await MaterialDetail.count({ where: { material_id: materialId } });
    // if (detailCount > 0) return { error: 'Hapus dulu semua konten di dalam bab ini.' };

    const courseId = material.course?.course_id; // Simpan course_id sebelum destroy
    await material.destroy();

    if (courseId)
      revalidatePath(`/lecturer/dashboard/courses/${courseId}/materials`);
    return { success: "Bab materi berhasil dihapus!" };
  } catch (error: any) {
    return { error: error.message || "Gagal menghapus materi." };
  }
}

// Mengambil semua MaterialDetail untuk satu Material (Bab)
export async function getMaterialDetailsForLecturer(materialId: number) {
  try {
    const { userId } = await getLecturerSession();
    const material = await Material.findOne({
      where: { material_id: materialId },
      include: [
        {
          model: Course,
          as: "course",
          where: { user_id: userId },
          attributes: ["course_id", "course_title"],
        },
        { model: MaterialDetail, as: "details", required: false },
        {
          model: Quiz,
          as: "quizzes",
          attributes: ["quiz_id", "quiz_title"],
          required: false,
        },
      ],
    });
    if (!material)
      throw new Error("Bab tidak ditemukan atau Anda tidak berhak.");

    const details = material.details?.map((d) => d.toJSON()) || [];
    const quizzes = material.quizzes?.map((q) => q.toJSON()) || [];

    return {
      success: true,
      data: { material: material.toJSON(), details, quizzes },
    }; // Kembalikan details dan quizzes
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal mengambil konten materi.",
    };
  }
}

// KEMUDIAN GANTI createMaterialDetail dengan ini:
export async function createMaterialDetail(
  materialId: number,
  values: {
    material_detail_name: string;
    material_detail_description: string;
    material_detail_type: string;
    is_free: boolean;
    materi_detail_url: string | null;
    assignment_template_url?: string | null;
    passing_score?: number | null;
  }
) {
  try {
    const { userId } = await getLecturerSession();
    const material = await Material.findOne({
      where: { material_id: materialId },
      include: [
        {
          model: Course,
          as: "course",
          where: { user_id: userId },
          attributes: ["course_id"],
        },
      ],
    });

    if (!material) throw new Error("Bab tidak ditemukan.");

    // Validasi
    if (
      !values.material_detail_name ||
      values.material_detail_name.length < 3
    ) {
      return { error: "Nama konten minimal 3 karakter" };
    }

    if (
      !values.material_detail_description ||
      values.material_detail_description.length < 10
    ) {
      return { error: "Deskripsi minimal 10 karakter" };
    }

    const detailType = parseInt(values.material_detail_type, 10);
    if (isNaN(detailType) || detailType < 1 || detailType > 4) {
      return { error: "Tipe konten tidak valid." };
    }

    if (
      (detailType === 1 || detailType === 2 || detailType === 3) &&
      !values.materi_detail_url
    ) {
      return { error: "URL konten wajib diisi." };
    }

    if (
      detailType === 4 &&
      values.passing_score !== null &&
      values.passing_score !== undefined
    ) {
      if (values.passing_score < 0 || values.passing_score > 100) {
        return { error: "Skor lulus harus antara 0-100." };
      }
    }

    await MaterialDetail.create({
      material_detail_name: values.material_detail_name,
      material_detail_description: values.material_detail_description,
      material_detail_type: detailType,
      is_free: values.is_free,
      materi_detail_url: values.materi_detail_url || "",
      assignment_template_url: values.assignment_template_url || null,
      passing_score: detailType === 4 ? (values.passing_score ?? null) : null,
      material_id: materialId,
    });

    // ✅ PERBAIKAN: Revalidate semua path terkait
    const courseId = material.course?.course_id;
    if (courseId) {
      revalidatePath(`/lecturer/dashboard/courses/${courseId}/materials`);
      revalidatePath(
        `/lecturer/dashboard/courses/${courseId}/materials/${materialId}`
      );
    }

    return { success: "Konten berhasil ditambahkan!" };
  } catch (error: any) {
    console.error("❌ Create MaterialDetail action error:", error);
    return { error: error.message || "Gagal menambahkan konten." };
  }
}

export async function updateMaterialDetail(
  materialDetailId: number,
  values: {
    material_detail_name?: string;
    material_detail_description?: string;
    material_detail_type?: string;
    is_free?: boolean;
    materi_detail_url?: string | null;
    assignment_template_url?: string | null;
    passing_score?: number | null;
  }
) {
  try {
    const { userId } = await getLecturerSession();
    const detail = await MaterialDetail.findOne({
      where: { material_detail_id: materialDetailId },
      include: [
        {
          model: Material,
          as: "material",
          required: true,
          include: [
            {
              model: Course,
              as: "course",
              where: { user_id: userId },
              required: true,
              attributes: ["course_id"],
            },
          ],
        },
      ],
    });

    if (!detail) {
      throw new Error("Konten tidak ditemukan atau Anda tidak berhak.");
    }

    const updateData: any = {};

    if (values.material_detail_name !== undefined) {
      if (values.material_detail_name.length < 3) {
        return { error: "Nama minimal 3 karakter." };
      }
      updateData.material_detail_name = values.material_detail_name;
    }

    if (values.material_detail_description !== undefined) {
      if (values.material_detail_description.length < 10) {
        return { error: "Deskripsi minimal 10 karakter." };
      }
      updateData.material_detail_description =
        values.material_detail_description;
    }

    let detailType = detail.material_detail_type;
    if (values.material_detail_type !== undefined) {
      const newType = parseInt(values.material_detail_type, 10);
      if (isNaN(newType) || newType < 1 || newType > 4) {
        return { error: "Tipe konten tidak valid." };
      }
      updateData.material_detail_type = newType;
      detailType = newType;
    }

    if (values.is_free !== undefined) {
      updateData.is_free = values.is_free;
    }

    // ✅ PERBAIKAN: Handle URL dengan benar - jika undefined, gunakan nilai lama
    if (values.materi_detail_url !== undefined) {
      if (
        (detailType === 1 || detailType === 2 || detailType === 3) &&
        !values.materi_detail_url
      ) {
        return { error: "URL konten wajib diisi." };
      }
      updateData.materi_detail_url = values.materi_detail_url || "";
    }

    if (detailType === 4 && values.assignment_template_url !== undefined) {
      updateData.assignment_template_url =
        values.assignment_template_url || null;
    }

    if (detailType === 4 && values.passing_score !== undefined) {
      if (
        values.passing_score !== null &&
        (values.passing_score < 0 || values.passing_score > 100)
      ) {
        return { error: "Skor lulus tidak valid (0-100)." };
      }
      updateData.passing_score = values.passing_score ?? null;
    }

    await detail.update(updateData);

    // ✅ PERBAIKAN: Revalidate semua path terkait
    const courseId = detail.material?.course?.course_id;
    const materialId = detail.material_id;
    if (courseId && materialId) {
      revalidatePath(`/lecturer/dashboard/courses/${courseId}/materials`);
      revalidatePath(
        `/lecturer/dashboard/courses/${courseId}/materials/${materialId}`
      );
    }

    return { success: "Konten berhasil diperbarui!" };
  } catch (error: any) {
    console.error("❌ Update MaterialDetail action error:", error);
    return { error: error.message || "Gagal memperbarui konten." };
  }
}
// Dosen menghapus MaterialDetail
export async function deleteMaterialDetail(materialDetailId: number) {
  try {
    const { userId } = await getLecturerSession();
    const detail = await MaterialDetail.findOne({
      where: { material_detail_id: materialDetailId },
      include: [
        {
          model: Material,
          as: "material",
          required: true,
          include: [
            {
              model: Course,
              as: "course",
              where: { user_id: userId },
              required: true,
              attributes: ["course_id"],
            },
          ],
        },
      ],
    });
    if (!detail)
      throw new Error("Konten tidak ditemukan atau Anda tidak berhak.");

    // TODO: Hapus file terkait dari Cloudinary/storage jika ada

    const courseId = detail.material?.course?.course_id;
    const materialId = detail.material_id;
    await detail.destroy();

    if (courseId && materialId)
      revalidatePath(
        `/lecturer/dashboard/courses/${courseId}/materials/${materialId}`
      );
    return { success: "Konten berhasil dihapus!" };
  } catch (error: any) {
    return { error: error.message || "Gagal menghapus konten." };
  }
}

export async function createQuiz(
  courseId: number,
  materialId: number,
  values: CreateQuizInput
) {
  try {
    const { userId } = await getLecturerSession();
    // Validasi kepemilikan kursus
    const course = await Course.findOne({
      where: { course_id: courseId, user_id: userId },
    });
    if (!course)
      throw new Error("Kursus tidak ditemukan atau Anda tidak berhak.");

    const validatedFields = createQuizSchema.safeParse(values);
    if (!validatedFields.success) {
      const firstError = Object.values(
        validatedFields.error.flatten().fieldErrors
      )[0]?.[0];
      return { error: firstError || "Input data quiz tidak valid!" };
    }

    const newQuiz = await Quiz.create({
      ...validatedFields.data,
      course_id: courseId,
      material_id: materialId,
    });

    // Revalidate halaman daftar materi (tempat quiz muncul di accordion)
    revalidatePath(`/lecturer/dashboard/courses/${courseId}/materials`);

    // Kembalikan ID quiz baru agar bisa redirect ke halaman edit
    return { success: true, data: { quiz_id: newQuiz.quiz_id } };
  } catch (error: any) {
    return { error: error.message || "Gagal membuat quiz." };
  }
}

export async function getQuizForEditPage(quizId: number) {
  try {
    const { userId } = await getLecturerSession();

    const quiz = await Quiz.findOne({
      where: { quiz_id: quizId },
      include: [
        {
          model: Course, // Pastikan dosen pemilik kursus
          as: "course",
          where: { user_id: userId },
          attributes: ["course_id", "course_title"],
          required: true,
        },
        {
          model: Material, // Ambil info Bab
          as: "material",
          attributes: ["material_id", "material_name"],
        },
        {
          model: QuizQuestion, // Ambil semua pertanyaan
          as: "questions",
          required: false,
          include: [
            {
              model: QuizAnswerOption, // Ambil semua pilihan jawaban
              as: "options",
              required: false,
            },
          ],
        },
      ],
      order: [
        // Urutkan pertanyaan dan jawaban berdasarkan ID
        [{ model: QuizQuestion, as: "questions" }, "question_id", "ASC"],
        [
          { model: QuizQuestion, as: "questions" },
          { model: QuizAnswerOption, as: "options" },
          "option_id",
          "ASC",
        ],
      ],
    });

    if (!quiz)
      throw new Error(
        "Quiz tidak ditemukan atau Anda tidak berhak mengaksesnya."
      );

    return { success: true, data: quiz.toJSON() };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal mengambil data quiz.",
    };
  }
}

export async function addQuestionToQuiz(
  quizId: number,
  values: CreateQuestionInput
) {
  const t = await sequelize.transaction();

  try {
    const { userId } = await getLecturerSession();

    const quiz = await Quiz.findOne({
      where: { quiz_id: quizId },
      include: [
        {
          model: Course,
          as: "course",
          where: { user_id: userId },
          attributes: ["course_id"],
        },
      ],
      transaction: t,
    });

    if (!quiz) throw new Error("Quiz tidak ditemukan.");

    const validatedFields = createQuestionSchema.safeParse(values);
    if (!validatedFields.success) {
      const firstError = Object.values(
        validatedFields.error.flatten().fieldErrors
      )[0]?.[0];
      return { error: firstError || "Input pertanyaan tidak valid!" };
    }

    const { question_text, question_type, options } = validatedFields.data;

    // 1. Buat Pertanyaan
    const newQuestion = await QuizQuestion.create(
      {
        quiz_id: quizId,
        question_text,
        question_type,
      },
      { transaction: t }
    );

    const questionId = newQuestion.question_id;

    // 2. Buat Pilihan Jawaban
    const newOptions = await Promise.all(
      options.map((opt) => {
        return QuizAnswerOption.create(
          {
            quiz_id: quizId,
            question_id: questionId,
            option_text: opt.option_text,
            is_correct: opt.is_correct,
          },
          { transaction: t }
        );
      })
    );

    await t.commit();

    // ✅ PERBAIKAN: Return data lengkap pertanyaan yang baru dibuat
    const createdQuestion = {
      question_id: questionId,
      question_text,
      question_type,
      options: newOptions.map((opt) => ({
        option_id: opt.option_id,
        option_text: opt.option_text,
        is_correct: opt.is_correct,
      })),
    };

    revalidatePath(
      `/lecturer/dashboard/courses/${quiz.course?.course_id}/quizzes/${quizId}/edit`
    );

    return {
      success: "Pertanyaan berhasil ditambahkan!",
      data: createdQuestion, // ✅ Tambahkan data
    };
  } catch (error: any) {
    await t.rollback();
    return { error: error.message || "Gagal menambahkan pertanyaan." };
  }
}

export async function updateQuestionInQuiz(
  questionId: number,
  values: CreateQuestionInput
) {
  const t = await sequelize.transaction();

  try {
    const { userId } = await getLecturerSession();

    const question = await QuizQuestion.findOne({
      where: { question_id: questionId },
      include: [
        {
          model: Quiz,
          as: "quiz",
          include: [
            {
              model: Course,
              as: "course",
              where: { user_id: userId },
              attributes: ["course_id"],
            },
          ],
        },
      ],
      transaction: t,
    });

    if (!question)
      throw new Error(
        "Pertanyaan tidak ditemukan atau Anda tidak berhak mengeditnya."
      );

    const validatedFields = createQuestionSchema.safeParse(values);
    if (!validatedFields.success) {
      const firstError = Object.values(
        validatedFields.error.flatten().fieldErrors
      )[0]?.[0];
      return { error: firstError || "Input pertanyaan tidak valid!" };
    }

    const { question_text, question_type, options } = validatedFields.data;

    // Update pertanyaan
    await question.update({ question_text, question_type }, { transaction: t });

    // Hapus semua pilihan lama
    await QuizAnswerOption.destroy({
      where: { question_id: questionId },
      transaction: t,
    });

    // Tambahkan pilihan baru
    const newOptions = await Promise.all(
      options.map((opt) =>
        QuizAnswerOption.create(
          {
            quiz_id: question.quiz_id,
            question_id: questionId,
            option_text: opt.option_text,
            is_correct: opt.is_correct,
          },
          { transaction: t }
        )
      )
    );

    await t.commit();

    // ✅ PERBAIKAN: Return data lengkap yang sudah di-update
    const updatedQuestion = {
      question_id: questionId,
      question_text,
      question_type,
      options: newOptions.map((opt) => ({
        option_id: opt.option_id,
        option_text: opt.option_text,
        is_correct: opt.is_correct,
      })),
    };

    revalidatePath(
      `/lecturer/dashboard/courses/${question.quiz?.course?.course_id}/quizzes/${question.quiz_id}/edit`
    );

    return {
      success: "Pertanyaan berhasil diperbarui!",
      data: updatedQuestion, // ✅ Tambahkan data
    };
  } catch (error: any) {
    await t.rollback();
    console.error("updateQuestionInQuiz error:", error);
    return { error: error.message || "Gagal memperbarui pertanyaan quiz." };
  }
}

export async function deleteQuestionFromQuiz(questionId: number) {
  const t = await sequelize.transaction(); // Mulai transaksi

  try {
    const { userId } = await getLecturerSession();

    // Ambil pertanyaan dan quiz-nya
    const question = await QuizQuestion.findOne({
      where: { question_id: questionId },
      include: [
        {
          model: Quiz,
          as: "quiz",
          include: [
            {
              model: Course,
              as: "course",
              where: { user_id: userId },
              attributes: ["course_id"],
            },
          ],
        },
      ],
      transaction: t,
    });

    if (!question)
      throw new Error(
        "Pertanyaan tidak ditemukan atau Anda tidak berhak menghapusnya."
      );

    const quizId = question.quiz_id;
    const courseId = question.quiz?.course?.course_id;

    // Hapus semua opsi terkait
    await QuizAnswerOption.destroy({
      where: { question_id: questionId },
      transaction: t,
    });

    // Hapus pertanyaan
    await question.destroy({ transaction: t });

    await t.commit();

    revalidatePath(
      `/lecturer/dashboard/courses/${courseId}/quizzes/${quizId}/edit`
    );
    return { success: "Pertanyaan berhasil dihapus!" };
  } catch (error: any) {
    await t.rollback();
    console.error("deleteQuestionFromQuiz error:", error);
    return { error: error.message || "Gagal menghapus pertanyaan quiz." };
  }
}

export async function deleteQuiz(quizId: number) {
  try {
    const { userId } = await getLecturerSession();
    // Validasi kepemilikan quiz
    const quiz = await Quiz.findOne({
      where: { quiz_id: quizId },
      include: [
        {
          model: Course,
          as: "course",
          where: { user_id: userId },
          attributes: ["course_id"],
        },
      ],
    });
    if (!quiz)
      throw new Error(
        "Quiz tidak ditemukan atau Anda tidak berhak menghapusnya."
      );
    const courseId = quiz.course?.course_id;

    await quiz.destroy();
    if (courseId)
      revalidatePath(`/lecturer/dashboard/courses/${courseId}/materials`);
    return { success: "Quiz berhasil dihapus!" };
  } catch (error: any) {
    return { error: error.message || "Gagal menghapus quiz." };
  }
}

export async function updateQuizDetails(
  quizId: number,
  values: UpdateQuizInput
) {
  try {
    const { userId } = await getLecturerSession();

    // Validasi kepemilikan quiz
    const quiz = await Quiz.findOne({
      where: { quiz_id: quizId },
      include: [
        {
          model: Course,
          as: "course",
          where: { user_id: userId },
          attributes: ["course_id"],
        },
      ],
    });

    if (!quiz) {
      throw new Error(
        "Quiz tidak ditemukan atau Anda tidak berhak mengeditnya."
      );
    }

    // Validasi input
    const validatedFields = updateQuizSchema.safeParse(values);
    if (!validatedFields.success) {
      const firstError = Object.values(
        validatedFields.error.flatten().fieldErrors
      )[0]?.[0];
      return { error: firstError || "Input data quiz tidak valid!" };
    }

    // Update quiz
    await quiz.update(validatedFields.data);

    // Revalidate page
    revalidatePath(
      `/lecturer/dashboard/courses/${quiz.course?.course_id}/quizzes/${quizId}/edit`
    );

    return {
      success: "Detail quiz berhasil diperbarui!",
      data: {
        quiz_title: quiz.quiz_title,
        quiz_description: quiz.quiz_description,
        passing_score: quiz.passing_score,
        time_limit: quiz.time_limit,
        max_attempts: quiz.max_attempts,
      },
    };
  } catch (error: any) {
    console.error("updateQuizDetails error:", error);
    return { error: error.message || "Gagal memperbarui detail quiz." };
  }
}

export async function getCourseEnrollmentsForLecturer(courseId: number) {
  try {
    const { userId } = await getLecturerSession();

    // 1. Verifikasi dosen memiliki kursus ini
    const course = await Course.findOne({
      where: { course_id: courseId, user_id: userId },
    });
    if (!course) {
      throw new Error(
        "Kursus tidak ditemukan atau Anda tidak berhak mengaksesnya."
      );
    }

    // 2. Ambil semua pendaftaran
    const enrollments = await Enrollment.findAll({
      where: { course_id: courseId },
      include: [
        {
          model: User,
          as: "student",
          attributes: ["user_id", "first_name", "last_name", "email"],
          required: true,
        },
      ],
      order: [["enrolled_at", "DESC"]],
    });

    // 3. Ambil total materi (sama seperti admin action)
    const totalMaterials = await MaterialDetail.count({
      include: [
        {
          model: Material,
          as: "material",
          where: { course_id: courseId },
          attributes: [],
        },
      ],
    });
    if (totalMaterials === 0) {
      return {
        success: true,
        data: enrollments.map((e) => ({
          ...e.toJSON(),
          student: (e.student as User).toJSON(),
          progress: 0,
        })),
      };
    }

    // 4. Ambil data progres (sama seperti admin action)
    const userIds = enrollments
      .map((e) => e.user_id)
      .filter((id) => id !== null) as number[];
    const progressData = await StudentProgress.findAll({
      where: {
        course_id: courseId,
        user_id: { [Op.in]: userIds },
        is_completed: true,
      },
      attributes: [
        "user_id",
        [
          sequelize.fn("COUNT", sequelize.col("progress_id")),
          "completed_count",
        ],
      ],
      group: ["user_id"],
      raw: true,
    });
    const progressMap = (progressData as any[]).reduce(
      (acc, item) => {
        acc[item.user_id] = item.completed_count;
        return acc;
      },
      {} as { [key: number]: number }
    );

    // 5. Gabungkan data (sama seperti admin action)
    const combinedData = enrollments.map((enrollment) => {
      const user = (enrollment.student as User).toJSON();
      const completedCount = progressMap[user.user_id] || 0;
      const progress = Math.round((completedCount / totalMaterials) * 100);
      return {
        ...enrollment.toJSON(),
        student: user,
        progress: progress > 100 ? 100 : progress,
      };
    });

    return { success: true, data: combinedData };
  } catch (error: any) {
    console.error("[GET_COURSE_ENROLLMENTS_LECTURER_ERROR]", error);
    return {
      success: false,
      error: error.message || "Gagal mengambil data pendaftaran.",
    };
  }
}
