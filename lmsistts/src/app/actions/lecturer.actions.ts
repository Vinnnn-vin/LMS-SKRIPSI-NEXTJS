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
import {
  deleteCourseThumbnailFolder,
  deleteFromPublic,
  uploadCourseThumbnail,
  uploadToPublic,
} from "@/lib/uploadHelper";
import { base64ToBuffer, sanitizeFilename } from "@/lib/fileUtils";
import path from "path";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";

// Blob
import {
  deleteCourseThumbnailFolderBlob,
  deleteFromBlob,
  uploadCourseThumbnailToBlob,
  uploadBase64ToBlob,
} from "@/lib/uploadHelperBlob";

import {
  ReviewAssignmentInput,
  reviewAssignmentSchema,
} from "@/lib/schemas/assignmentSubmission.schema";
import { uploadBase64ToPublic } from "@/lib/uploadHelper";

async function getLecturerSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "lecturer") {
    throw new Error("Akses ditolak. Anda harus login sebagai dosen.");
  }
  return { userId: parseInt(session.user.id, 10), session };
}

export async function getAssignmentsToReviewByLecturer(options: {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  statusFilter?: string;
}) {
  try {
    const { userId } = await getLecturerSession();
    const {
      page,
      limit,
      sortBy = "submitted_at",
      sortOrder = "DESC",
      statusFilter,
    } = options;

    const lecturerCourses = await Course.findAll({
      where: { user_id: userId },
      attributes: ["course_id"],
      raw: true,
    });
    const courseIds = lecturerCourses.map((c) => c.course_id);

    if (courseIds.length === 0) {
      return { success: true, data: [], total: 0 };
    }

    const whereClause: any = {
      course_id: { [Op.in]: courseIds },
    };

    if (statusFilter) {
      whereClause.status = statusFilter;
    }

    const total = await AssignmentSubmission.count({ where: whereClause });

    const offset = (page - 1) * limit;
    const submissions = await AssignmentSubmission.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "student",
          attributes: ["user_id", "first_name", "last_name", "email"],
          required: true,
        },
        {
          model: MaterialDetail,
          as: "assignment",
          attributes: [
            "material_detail_id",
            "material_detail_name",
            "passing_score",
          ],
          required: true,
        },
        {
          model: Course,
          as: "course",
          attributes: ["course_id", "course_title"],
          required: true,
        },
      ],
      order: [[sortBy, sortOrder]],
      limit,
      offset,
    });

    return {
      success: true,
      data: submissions.map((s) => s.toJSON()),
      total,
    };
  } catch (error: any) {
    console.error("[GET_ASSIGNMENTS_TO_REVIEW_ERROR]", error);
    return {
      success: false,
      error: error.message || "Gagal mengambil data tugas.",
      data: [],
      total: 0,
    };
  }
}

export async function gradeAssignmentByLecturer(
  submissionId: number,
  values: ReviewAssignmentInput
) {
  try {
    const { userId } = await getLecturerSession();

    const submission = await AssignmentSubmission.findOne({
      where: { submission_id: submissionId },
      include: [
        {
          model: Course,
          as: "course",
          where: { user_id: userId },
          attributes: ["course_id"],
          required: true,
        },
        {
          model: MaterialDetail,
          as: "assignment",
          attributes: ["passing_score"],
          required: true,
        },
      ],
    });

    if (!submission) {
      return { error: "Tugas tidak ditemukan atau Anda tidak berhak menilai." };
    }

    const passingScore = submission.assignment?.passing_score || 70;

    const validatedFields = reviewAssignmentSchema.safeParse(values);

    if (!validatedFields.success) {
      const firstError = Object.values(
        validatedFields.error.flatten().fieldErrors
      )[0]?.[0];
      return { error: firstError || "Input data tidak valid!" };
    }

    const { status, score, feedback } = validatedFields.data;

    if (status === "approved" && score !== null && score !== undefined) {
      if (score < passingScore) {
        return {
          error: `Skor harus minimal ${passingScore} untuk status disetujui.`,
        };
      }
    }

    if (status === "rejected" && score !== null && score !== undefined) {
      if (score >= passingScore) {
        return {
          error: `Skor harus di bawah ${passingScore} untuk status ditolak.`,
        };
      }
    }

    await submission.update({
      status,
      score,
      feedback: feedback || null,
      reviewed_by: userId,
      reviewed_at: new Date(),
    });

    revalidatePath("/lecturer/dashboard/assignments");

    return {
      success: true,
      message: "Penilaian berhasil disimpan!",
    };
  } catch (error: any) {
    console.error("[GRADE_ASSIGNMENT_ERROR]", error);
    return {
      error: error.message || "Gagal menyimpan penilaian.",
    };
  }
}

export async function getLecturerDashboardStats() {
  try {
    const { userId } = await getLecturerSession();

    const totalCourses = await Course.count({ where: { user_id: userId } });

    const lecturerCourseIds = await Course.findAll({
      where: { user_id: userId },
      attributes: ["course_id"],
      raw: true,
    }).then((courses) => courses.map((c) => c.course_id));

    const totalStudents = await Enrollment.count({
      distinct: true,
      col: "user_id",
      where: {
        course_id: {
          [Op.in]: lecturerCourseIds,
        },
      },
    });

    const totalSales = await Payment.sum("amount", {
      where: {
        status: "paid",
        course_id: {
          [Op.in]: lecturerCourseIds,
        },
      },
    });

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

    const newCourse = await Course.create({
      ...courseData,
      user_id: userId,
      publish_status: 0,
      publish_request_status: "none",
      thumbnail_url: null,
    });

    let thumbnailUrl = null;
    if (thumbnail_file) {
      // const uploadResult = await uploadCourseThumbnail(
      //   thumbnail_file,
      //   courseData.course_title,
      //   newCourse.course_id
      // );

      const uploadResult = await uploadCourseThumbnailToBlob(
        thumbnail_file,
        courseData.course_title,
        newCourse.course_id
      );

      if (!uploadResult.success) {
        await newCourse.destroy();
        return { error: uploadResult.error || "Gagal mengupload thumbnail." };
      }

      thumbnailUrl = uploadResult.url;

      await newCourse.update({ thumbnail_url: thumbnailUrl });
    }

    revalidatePath("/lecturer/dashboard/courses");

    return {
      success: "Kursus berhasil dibuat sebagai draft!",
      courseId: newCourse.course_id,
    };
  } catch (error: any) {
    console.error("[CREATE_COURSE_BY_LECTURER_ERROR]", error);
    return { error: error.message || "Gagal membuat kursus." };
  }
}

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

    const { thumbnail_file, course_title, ...restCourseData } =
      validatedFields.data;
    let newThumbnailUrl: string | null | undefined = undefined;

    if (thumbnail_file instanceof File) {
      // if (course.thumbnail_url) {
      //   await deleteFromPublic(course.thumbnail_url);
      // }

      // const courseTitleForUpload = course_title || course.course_title;
      // const uploadResult = await uploadCourseThumbnail(
      //   thumbnail_file,
      //   courseTitleForUpload,
      //   courseId
      // );

      if (course.thumbnail_url) {
        await deleteFromBlob(course.thumbnail_url);
      }
      
      const courseTitleForUpload = course_title || course.course_title;
      const uploadResult = await uploadCourseThumbnailToBlob(
        thumbnail_file,
        courseTitleForUpload,
        courseId
      );

      if (!uploadResult.success) {
        return { error: uploadResult.error || "Gagal mengupload thumbnail." };
      }

      newThumbnailUrl = uploadResult.url;
    } else if (thumbnail_file === null) {
      // if (course.thumbnail_url) {
      //   await deleteFromPublic(course.thumbnail_url);
      // }

      if (course.thumbnail_url) {
        await deleteFromBlob(course.thumbnail_url);
      }
      newThumbnailUrl = null;
    }
    const updateData: any = { ...restCourseData };

    if (course_title !== undefined) {
      updateData.course_title = course_title;
    }

    if (newThumbnailUrl !== undefined) {
      updateData.thumbnail_url = newThumbnailUrl;
    }

    delete updateData.publish_status;
    delete updateData.publish_request_status;
    delete updateData.rejection_reason;

    await course.update(updateData);

    revalidatePath("/lecturer/dashboard/courses");
    revalidatePath(`/lecturer/dashboard/courses/${courseId}`);

    return { success: "Kursus berhasil diperbarui!" };
  } catch (error: any) {
    console.error("[UPDATE_COURSE_BY_LECTURER_ERROR]", error);
    return { error: error.message || "Gagal memperbarui kursus." };
  }
}

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

    // if (course.thumbnail_url) {
    //   await deleteFromPublic(course.thumbnail_url);
    // }

    // await deleteCourseThumbnailFolder(courseId, course.course_title);

    if (course.thumbnail_url) {
      await deleteFromBlob(course.thumbnail_url);
    }
    await deleteCourseThumbnailFolderBlob(courseId, course.course_title);

    await course.destroy();
    revalidatePath("/lecturer/dashboard/courses");

    return { success: "Kursus berhasil dihapus!" };
  } catch (error: any) {
    console.error("[DELETE_COURSE_BY_LECTURER_ERROR]", error);
    return { error: error.message || "Gagal menghapus kursus." };
  }
}
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

    const materialCount = await Material.count({
      where: { course_id: courseId },
    });

    if (materialCount === 0) {
      return {
        error:
          "Gagal: Kursus belum memiliki Bab materi. Silakan tambahkan minimal 1 Bab terlebih dahulu.",
      };
    }

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
      ],
    });
    if (!material)
      throw new Error(
        "Materi tidak ditemukan atau Anda tidak berhak menghapusnya."
      );

    const detailCount = await MaterialDetail.count({
      where: { material_id: materialId },
    });
    if (detailCount > 0)
      return { error: "Hapus dulu semua konten di dalam bab ini." };

    const courseId = material.course?.course_id;
    await material.destroy();

    if (courseId)
      revalidatePath(`/lecturer/dashboard/courses/${courseId}/materials`);
    return { success: "Bab materi berhasil dihapus!" };
  } catch (error: any) {
    return { error: error.message || "Gagal menghapus materi." };
  }
}

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
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal mengambil konten materi.",
    };
  }
}

// async function uploadBase64ToPublic(
//   base64Data: string,
//   originalFilename: string,
//   subFolder: "videos" | "pdfs" | "assignments"
// ): Promise<{ success: boolean; url?: string; error?: string }> {
//   try {
//     const buffer = base64ToBuffer(base64Data);
//     const timestamp = Date.now();
//     const sanitized = sanitizeFilename(originalFilename);
//     const fileName = `${timestamp}_${sanitized}`;

//     const publicDir = path.join(process.cwd(), "public", subFolder);

//     if (!existsSync(publicDir)) {
//       await mkdir(publicDir, { recursive: true });
//     }

//     const filePath = path.join(publicDir, fileName);
//     await writeFile(filePath, buffer);

//     const relativePath = `/${subFolder}/${fileName}`;

//     return { success: true, url: relativePath };
//   } catch (error: any) {
//     console.error("❌ Upload base64 error:", error);
//     return { success: false, error: error.message || "Gagal upload file" };
//   }
// }

export async function createMaterialDetail(
  materialId: number,
  formData: FormData
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
    if (!material) throw new Error("Bab/Seksi tidak ditemukan.");

    const material_detail_name =
      formData.get("material_detail_name")?.toString() || "";
    const material_detail_description =
      formData.get("material_detail_description")?.toString() || "";
    const material_detail_type =
      formData.get("material_detail_type")?.toString() || "1";
    const is_free = formData.get("is_free")?.toString() === "true";
    const materi_detail_url =
      formData.get("materi_detail_url")?.toString() || "";

    const passingScoreRaw = formData.get("passing_score")?.toString();
    const passing_score =
      passingScoreRaw && passingScoreRaw !== ""
        ? Number(passingScoreRaw)
        : null;

    const fileBase64 = formData.get("file_base64")?.toString();
    const fileName = formData.get("file_name")?.toString();
    const templateBase64 = formData.get("template_base64")?.toString();
    const templateName = formData.get("template_name")?.toString();

    const validationResult = createMaterialDetailSchema.safeParse({
      material_detail_name,
      material_detail_description,
      material_detail_type,
      is_free,
      materi_detail_url,
      passing_score,
    });

    if (!validationResult.success) {
      const firstError = Object.values(
        validationResult.error.flatten().fieldErrors
      )[0]?.[0];
      return { error: firstError || "Input data tidak valid!" };
    }

    const detailType = parseInt(material_detail_type);
    let contentUrl = materi_detail_url || "";
    let assignmentTemplateUrl: string | null = null;

    if (fileBase64 && fileName) {
      let subFolder: "videos" | "pdfs" | "assignments";
      if (detailType === 1) subFolder = "videos";
      else if (detailType === 2) subFolder = "pdfs";
      else if (detailType === 4) subFolder = "assignments";
      else {
        return { error: "Tipe konten tidak valid untuk upload file." };
      }

      // const uploadResult = await uploadBase64ToPublic(
      //   fileBase64,
      //   fileName,
      //   subFolder
      // );

      const uploadResult = await uploadBase64ToBlob(fileBase64, fileName, subFolder);

      if (!uploadResult.success) {
        return { error: uploadResult.error || "Gagal upload file konten." };
      }

      if (detailType === 4) {
        assignmentTemplateUrl = uploadResult.url!;
      } else {
        contentUrl = uploadResult.url!;
      }
    }

    if (detailType === 4 && templateBase64 && templateName) {
      // const uploadResult = await uploadBase64ToPublic(
      //   templateBase64,
      //   templateName,
      //   "assignments"
      // );

      const uploadResult = await uploadBase64ToBlob(templateBase64, templateName, "assignments");
      if (!uploadResult.success) {
        return { error: uploadResult.error || "Gagal upload template tugas." };
      }
      assignmentTemplateUrl = uploadResult.url!;
    }

    if (
      (detailType === 1 || detailType === 2 || detailType === 3) &&
      !contentUrl
    ) {
      return { error: "Konten file atau URL YouTube wajib diisi." };
    }

    await MaterialDetail.create({
      material_detail_name: validationResult.data.material_detail_name,
      material_detail_description:
        validationResult.data.material_detail_description,
      material_detail_type: detailType,
      is_free: validationResult.data.is_free,
      materi_detail_url: contentUrl,
      assignment_template_url: assignmentTemplateUrl,
      passing_score: validationResult.data.passing_score,
      material_id: materialId,
    });

    revalidatePath(
      `/lecturer/dashboard/courses/${material.course?.course_id}/materials/${materialId}`
    );

    return { success: "Konten berhasil ditambahkan!" };
  } catch (error: any) {
    console.error("❌ Create MaterialDetail error:", error);
    return { error: error.message || "Gagal menambahkan konten." };
  }
}

export async function updateMaterialDetail(
  materialDetailId: number,
  formData: FormData
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

    const material_detail_name = formData
      .get("material_detail_name")
      ?.toString();
    const material_detail_description = formData
      .get("material_detail_description")
      ?.toString();
    const material_detail_type = formData
      .get("material_detail_type")
      ?.toString();
    const is_free = formData.get("is_free")?.toString() === "true";
    const materi_detail_url = formData.get("materi_detail_url")?.toString();

    const passingScoreRaw = formData.get("passing_score")?.toString();
    const passing_score =
      passingScoreRaw && passingScoreRaw !== ""
        ? Number(passingScoreRaw)
        : null;

    const fileBase64 = formData.get("file_base64")?.toString();
    const fileName = formData.get("file_name")?.toString();
    const templateBase64 = formData.get("template_base64")?.toString();
    const templateName = formData.get("template_name")?.toString();

    const validatedFields = updateMaterialDetailSchema.safeParse({
      material_detail_name: material_detail_name || undefined,
      material_detail_description: material_detail_description || undefined,
      material_detail_type: material_detail_type || undefined,
      is_free,
      materi_detail_url: materi_detail_url || undefined,
      passing_score,
    });

    if (!validatedFields.success) {
      const firstError = Object.values(
        validatedFields.error.flatten().fieldErrors
      )[0]?.[0];
      return { error: firstError || "Input data konten tidak valid!" };
    }

    const detailData = validatedFields.data;
    let newContentUrl: string | undefined | null = undefined;
    let newTemplateUrl: string | undefined | null = undefined;

    if (fileBase64 && fileName) {
      // if (
      //   detail.materi_detail_url &&
      //   detail.materi_detail_url.startsWith("/")
      // ) {
      //   await deleteFromPublic(detail.materi_detail_url);
      // }

      if (detail.materi_detail_url && detail.materi_detail_url.startsWith("http")) {
        await deleteFromBlob(detail.materi_detail_url);
      }

      const detailType = detailData.material_detail_type
        ? parseInt(detailData.material_detail_type)
        : detail.material_detail_type;

      const subFolder = detailType === 1 ? "videos" : "pdfs";
      // const uploadResult = await uploadBase64ToPublic(
      //   fileBase64,
      //   fileName,
      //   subFolder
      // );

      const uploadResult = await uploadBase64ToBlob(fileBase64, fileName, subFolder);

      if (!uploadResult.success) {
        return {
          error: uploadResult.error || "Gagal upload file konten baru.",
        };
      }

      newContentUrl = uploadResult.url!;
    } else if (detailData.materi_detail_url !== undefined) {
      newContentUrl = detailData.materi_detail_url || "";
    }

    if (templateBase64 && templateName) {
      // if (
      //   detail.assignment_template_url &&
      //   detail.assignment_template_url.startsWith("/")
      // ) {
      //   await deleteFromPublic(detail.assignment_template_url);
      // }

      // const uploadResult = await uploadBase64ToPublic(
      //   templateBase64,
      //   templateName,
      //   "assignments"
      // );

      if (detail.assignment_template_url && detail.assignment_template_url.startsWith("http")) {
        await deleteFromBlob(detail.assignment_template_url);
      }
      const uploadResult = await uploadBase64ToBlob(templateBase64, templateName, "assignments");

      if (!uploadResult.success) {
        return { error: uploadResult.error || "Gagal upload template baru." };
      }

      newTemplateUrl = uploadResult.url!;
    }

    const updateData: any = { ...detailData };
    if (newContentUrl !== undefined) {
      updateData.materi_detail_url = newContentUrl;
    }
    if (newTemplateUrl !== undefined) {
      updateData.assignment_template_url = newTemplateUrl;
    }

    await detail.update(updateData);

    const courseId = detail.material?.course?.course_id;
    if (courseId) {
      revalidatePath(
        `/lecturer/dashboard/courses/${courseId}/materials/${detail.material_id}`
      );
    }

    return { success: "Konten berhasil diperbarui!" };
  } catch (error: any) {
    console.error("❌ Update MaterialDetail error:", error);
    return { error: error.message || "Gagal memperbarui konten." };
  }
}

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

    if (!detail) {
      throw new Error("Konten tidak ditemukan atau Anda tidak berhak.");
    }

    // if (detail.materi_detail_url && detail.materi_detail_url.startsWith("/")) {
    //   await deleteFromPublic(detail.materi_detail_url);
    // }
    // if (
    //   detail.assignment_template_url &&
    //   detail.assignment_template_url.startsWith("/")
    // ) {
    //   await deleteFromPublic(detail.assignment_template_url);
    // }

    if (detail.materi_detail_url && detail.materi_detail_url.startsWith("http")) {
      await deleteFromBlob(detail.materi_detail_url);
    }
    if (
      detail.assignment_template_url &&
      detail.assignment_template_url.startsWith("http")
    ) {
      await deleteFromBlob(detail.assignment_template_url);
    }

    const courseId = detail.material?.course?.course_id;
    const materialId = detail.material_id;

    await detail.destroy();

    if (courseId && materialId) {
      revalidatePath(
        `/lecturer/dashboard/courses/${courseId}/materials/${materialId}`
      );
    }

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

    const course = await Course.findOne({
      where: { course_id: courseId, user_id: userId },
    });
    if (!course) {
      throw new Error("Kursus tidak ditemukan atau Anda tidak berhak.");
    }

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

    revalidatePath(`/lecturer/dashboard/courses/${courseId}/materials`);

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
          model: Course,
          as: "course",
          where: { user_id: userId },
          attributes: ["course_id", "course_title"],
          required: true,
        },
        {
          model: Material,
          as: "material",
          attributes: ["material_id", "material_name"],
        },
        {
          model: QuizQuestion,
          as: "questions",
          required: false,
          include: [
            {
              model: QuizAnswerOption,
              as: "options",
              required: false,
            },
          ],
        },
      ],
      order: [
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

    if (!quiz) {
      throw new Error("Quiz tidak ditemukan.");
    }

    const validatedFields = createQuestionSchema.safeParse(values);
    if (!validatedFields.success) {
      const firstError = Object.values(
        validatedFields.error.flatten().fieldErrors
      )[0]?.[0];
      await t.rollback();
      return { error: firstError || "Input pertanyaan tidak valid!" };
    }

    const { question_text, question_type, options } = validatedFields.data;

    const newQuestion = await QuizQuestion.create(
      {
        quiz_id: quizId,
        question_text,
        question_type,
      },
      { transaction: t }
    );

    const questionId = newQuestion.question_id;

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
      data: createdQuestion,
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

    if (!question) {
      throw new Error(
        "Pertanyaan tidak ditemukan atau Anda tidak berhak mengeditnya."
      );
    }

    const validatedFields = createQuestionSchema.safeParse(values);
    if (!validatedFields.success) {
      const firstError = Object.values(
        validatedFields.error.flatten().fieldErrors
      )[0]?.[0];
      await t.rollback();
      return { error: firstError || "Input pertanyaan tidak valid!" };
    }

    const { question_text, question_type, options } = validatedFields.data;

    await question.update({ question_text, question_type }, { transaction: t });

    await QuizAnswerOption.destroy({
      where: { question_id: questionId },
      transaction: t,
    });

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
      data: updatedQuestion,
    };
  } catch (error: any) {
    await t.rollback();
    return { error: error.message || "Gagal memperbarui pertanyaan." };
  }
}

export async function deleteQuestionFromQuiz(questionId: number) {
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
    });

    if (!question) {
      throw new Error(
        "Pertanyaan tidak ditemukan atau Anda tidak berhak menghapusnya."
      );
    }

    await question.destroy();

    revalidatePath(
      `/lecturer/dashboard/courses/${question.quiz?.course?.course_id}/quizzes/${question.quiz_id}/edit`
    );

    return { success: "Pertanyaan berhasil dihapus!" };
  } catch (error: any) {
    return { error: error.message || "Gagal menghapus pertanyaan." };
  }
}

export async function deleteQuiz(quizId: number) {
  try {
    const { userId } = await getLecturerSession();

    const quiz = await Quiz.findByPk(quizId, {
      include: [
        {
          model: Course,
          as: "course",
          where: { user_id: userId },
          required: true,
          attributes: ["course_id"],
        },
      ],
    });

    if (!quiz) {
      return {
        error: "Quiz tidak ditemukan atau Anda tidak memiliki hak akses.",
      };
    }

    const courseId = quiz.course?.course_id;
    const materialId = quiz.material_id; 

    await quiz.destroy();

    if (courseId && materialId) {
      revalidatePath(
        `/lecturer/dashboard/courses/${courseId}/materials/${materialId}`
      );
    }

    return { success: "Quiz berhasil dihapus!" };
  } catch (error: any) {
    console.error("[DELETE_QUIZ_ERROR]", error);
    return {
      error: error.message || "Gagal menghapus quiz.",
    };
  }
}

export async function updateQuizDetails(
  quizId: number,
  values: UpdateQuizInput
) {
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
          required: true,
        },
      ],
    });

    if (!quiz) {
      throw new Error("Quiz tidak ditemukan atau Anda tidak berhak.");
    }

    const validatedFields = updateQuizSchema.safeParse(values);
    if (!validatedFields.success) {
      const firstError = Object.values(
        validatedFields.error.flatten().fieldErrors
      )[0]?.[0];
      return { error: firstError || "Input data tidak valid!" };
    }

    await quiz.update(validatedFields.data);

    const updatedQuiz = await Quiz.findByPk(quizId, {
      attributes: [
        "quiz_id",
        "quiz_title",
        "quiz_description",
        "passing_score",
        "time_limit",
        "max_attempts",
      ],
    });

    revalidatePath(
      `/lecturer/dashboard/courses/${quiz.course?.course_id}/quizzes/${quizId}/edit`
    );

    return {
      success: "Detail quiz berhasil diperbarui!",
      data: updatedQuiz?.toJSON(),
    };
  } catch (error: any) {
    console.error("[UPDATE_QUIZ_DETAILS_ERROR]", error);
    return { error: error.message || "Gagal memperbarui detail quiz." };
  }
}

export async function getCourseEnrollmentsForLecturer(courseId: number) {
  try {
    const { userId } = await getLecturerSession();

    const course = await Course.findOne({
      where: { course_id: courseId, user_id: userId },
    });
    if (!course) {
      throw new Error(
        "Kursus tidak ditemukan atau Anda tidak berhak mengaksesnya."
      );
    }

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
