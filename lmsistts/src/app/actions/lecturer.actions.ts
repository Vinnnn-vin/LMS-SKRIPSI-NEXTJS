// src/app/actions/lecturer.actions.ts
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
import { CreateQuizInput, createQuizSchema, UpdateQuizInput, updateQuizSchema } from "@/lib/schemas/quiz.schema";
import { CreateQuestionInput, createQuestionSchema } from "@/lib/schemas/quizQuestion.schema";
import { deleteFromPublic, uploadToPublic } from "@/lib/uploadHelper";
import { base64ToBuffer, sanitizeFilename } from "@/lib/fileUtils";
import path from "path";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";

// Helper function untuk memeriksa sesi dosen
async function getLecturerSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "lecturer") {
    throw new Error("Akses ditolak. Anda harus login sebagai dosen.");
  }
  return { userId: parseInt(session.user.id, 10), session };
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
        { model: Category, as: "category", attributes: ["category_name"] },
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

// Dosen membuat kursus baru
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
    let thumbnailUrl = null;
    if (thumbnail_file)
      thumbnailUrl = `https://placeholder.com/temp/${thumbnail_file.name}`; // Placeholder

    await Course.create({
      ...courseData,
      user_id: userId, // Set user_id ke ID dosen yang login
      publish_status: 0, // Selalu draft
      publish_request_status: "none", // Status permintaan awal
      thumbnail_url: thumbnailUrl,
    });

    revalidatePath("/lecturer/dashboard/courses");
    return { success: "Kursus berhasil dibuat sebagai draft!" };
  } catch (error: any) {
    return { error: error.message || "Gagal membuat kursus." };
  }
}

// Dosen memperbarui kursus miliknya
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
    if (!course)
      return {
        error: "Kursus tidak ditemukan atau Anda tidak berhak mengeditnya.",
      };

    const { thumbnail_file, ...courseData } = validatedFields.data;
    let newThumbnailUrl: string | null | undefined = undefined;
    if (thumbnail_file instanceof File)
      newThumbnailUrl = `https://placeholder.com/new_${thumbnail_file.name}`;
    else if (thumbnail_file === null) newThumbnailUrl = null;

    const updateData: any = { ...courseData };
    if (newThumbnailUrl !== undefined)
      updateData.thumbnail_url = newThumbnailUrl;

    // Reset status permintaan jika ada perubahan signifikan (opsional)
    // updateData.publish_request_status = 'none';

    await course.update(updateData);
    revalidatePath("/lecturer/dashboard/courses");
    return { success: "Kursus berhasil diperbarui!" };
  } catch (error: any) {
    return { error: error.message || "Gagal memperbarui kursus." };
  }
}

// Dosen menghapus kursus miliknya
export async function deleteCourseByLecturer(courseId: number) {
  try {
    const { userId } = await getLecturerSession();
    const course = await Course.findOne({
      where: { course_id: courseId, user_id: userId },
    });
    if (!course)
      return {
        error: "Kursus tidak ditemukan atau Anda tidak berhak menghapusnya.",
      };

    const enrollmentCount = await Enrollment.count({
      where: { course_id: courseId },
    });
    if (enrollmentCount > 0)
      return {
        error: `Tidak dapat menghapus. Ada ${enrollmentCount} siswa terdaftar.`,
      };

    await course.destroy();
    revalidatePath("/lecturer/dashboard/courses");
    return { success: "Kursus berhasil dihapus!" };
  } catch (error: any) {
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

    // Validasi tambahan (misal: pastikan ada materi, dll.) bisa ditambahkan
    if (course.publish_status === 1)
      return { error: "Kursus sudah dipublikasikan." };
    if (course.publish_request_status === "pending")
      return { error: "Permintaan publish sudah dikirim." };

    course.publish_request_status = "pending";
    await course.save();

    revalidatePath("/lecturer/dashboard/courses");

    return {
      success: "Permintaan publikasi kursus berhasil dikirim ke admin.",
    };
  } catch (error: any) {
    return { error: error.message || "Gagal mengirim permintaan publish." };
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
    return { success: "Bab/Seksi materi berhasil ditambahkan!" };
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
    return { success: "Bab/Seksi materi berhasil diperbarui!" };
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
    return { success: "Bab/Seksi materi berhasil dihapus!" };
  } catch (error: any) {
    return { error: error.message || "Gagal menghapus materi." };
  }
}

// Mengambil semua MaterialDetail untuk satu Material (Bab/Seksi)
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
      throw new Error("Bab/Seksi tidak ditemukan atau Anda tidak berhak.");

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

// Dosen membuat MaterialDetail baru
async function uploadBase64ToPublic(
  base64Data: string,
  originalFilename: string,
  subFolder: 'videos' | 'pdfs'
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    console.log('🔄 Starting base64 upload for:', originalFilename);
    
    // Convert base64 to buffer
    const buffer = base64ToBuffer(base64Data);
    console.log('✅ Buffer created, size:', buffer.length, 'bytes');

    // Generate unique filename
    const timestamp = Date.now();
    const sanitized = sanitizeFilename(originalFilename);
    const fileName = `${timestamp}_${sanitized}`;

    // Path ke folder public
    const publicDir = path.join(process.cwd(), 'public', subFolder);
    
    // Buat folder jika belum ada
    if (!existsSync(publicDir)) {
      console.log('📁 Creating directory:', publicDir);
      await mkdir(publicDir, { recursive: true });
    }

    // Path lengkap file
    const filePath = path.join(publicDir, fileName);
    console.log('💾 Writing file to:', filePath);

    // Simpan file
    await writeFile(filePath, buffer);

    // Return relative path
    const relativePath = `/${subFolder}/${fileName}`;

    console.log('✅ File uploaded successfully:', relativePath);
    return { success: true, url: relativePath };
  } catch (error: any) {
    console.error('❌ Upload base64 error:', error);
    return { success: false, error: error.message || 'Gagal upload file' };
  }
}

// KEMUDIAN GANTI createMaterialDetail dengan ini:

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

    // Parse FormData
    const material_detail_name = formData.get("material_detail_name")?.toString() || "";
    const material_detail_description = formData.get("material_detail_description")?.toString() || "";
    const material_detail_type = formData.get("material_detail_type")?.toString() || "1";
    const is_free = formData.get("is_free")?.toString() === "true";
    const materi_detail_url = formData.get("materi_detail_url")?.toString() || "";
    
    // ✅ Ambil base64 data dan filename
    const fileBase64 = formData.get("file_base64")?.toString();
    const fileName = formData.get("file_name")?.toString();

    console.log("📝 Server received FormData:", {
      material_detail_name,
      material_detail_type,
      is_free,
      hasFile: !!fileBase64,
      fileName,
      base64Length: fileBase64 ? fileBase64.length : 0
    });

    // Validasi
    if (!material_detail_name || material_detail_name.length < 3) {
      return { error: "Nama konten minimal 3 karakter" };
    }

    if (!material_detail_description || material_detail_description.length < 10) {
      return { error: "Deskripsi minimal 10 karakter" };
    }

    const detailType = parseInt(material_detail_type);
    
    // Validasi konten sesuai tipe
    if ((detailType === 1 || detailType === 2) && !fileBase64) {
      return { error: "File wajib diupload untuk tipe konten ini" };
    }
    
    if (detailType === 3 && !materi_detail_url) {
      return { error: "URL YouTube wajib diisi untuk tipe konten ini" };
    }

    let contentUrl = materi_detail_url || "";

    // ✅ Upload file dari base64
    if (fileBase64 && fileName) {
      console.log("📤 Processing file upload from base64:", fileName);
      
      const subFolder = detailType === 1 ? 'videos' : 'pdfs';
      const uploadResult = await uploadBase64ToPublic(fileBase64, fileName, subFolder);
      
      if (!uploadResult.success) {
        console.error("❌ Upload failed:", uploadResult.error);
        return { error: uploadResult.error || 'Gagal upload file konten.' };
      }
      
      contentUrl = uploadResult.url!;
      console.log("✅ Upload complete, URL:", contentUrl);
    }

    // Simpan ke database
    await MaterialDetail.create({
      material_detail_name,
      material_detail_description,
      material_detail_type: detailType,
      is_free,
      materi_detail_url: contentUrl,
      material_id: materialId,
    });

    console.log("✅ MaterialDetail created in database");

    revalidatePath(
      `/lecturer/dashboard/courses/${material.course?.course_id}/materials/${materialId}`
    );
    return { success: "Konten berhasil ditambahkan!" };
  } catch (error: any) {
    console.error("❌ Create MaterialDetail error:", error);
    return { error: error.message || "Gagal menambahkan konten." };
  }
}

// Dosen memperbarui MaterialDetail
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
    
    if (!detail)
      throw new Error("Konten tidak ditemukan atau Anda tidak berhak.");

    // ✅ PERBAIKAN: Parse FormData dengan lebih aman
    const material_detail_name = formData.get("material_detail_name")?.toString();
    const material_detail_description = formData.get("material_detail_description")?.toString();
    const material_detail_type = formData.get("material_detail_type")?.toString();
    const is_free = formData.get("is_free")?.toString() === "true";
    const materi_detail_url = formData.get("materi_detail_url")?.toString();
    const content_file = formData.get("content_file");

    console.log("📝 Parsing FormData for Update:", {
      material_detail_name,
      material_detail_type,
      is_free,
      hasFile: content_file instanceof File,
      fileSize: content_file instanceof File ? content_file.size : 0
    });

    // ✅ Validasi dengan Zod
    const validatedFields = updateMaterialDetailSchema.safeParse({
      material_detail_name: material_detail_name || undefined,
      material_detail_description: material_detail_description || undefined,
      material_detail_type: material_detail_type || undefined,
      is_free,
      materi_detail_url: materi_detail_url || undefined,
      content_file: content_file instanceof File ? content_file : 
                    content_file === null ? null : undefined,
    });

    if (!validatedFields.success) {
      console.error("❌ Update Validation Error:", validatedFields.error.flatten());
      const firstError = Object.values(
        validatedFields.error.flatten().fieldErrors
      )[0]?.[0];
      return { error: firstError || "Input data konten tidak valid!" };
    }

    const { content_file: validated_file, materi_detail_url: validated_url, ...detailData } =
      validatedFields.data;
    let newContentUrl: string | undefined | null = undefined;

    // ✅ UPLOAD FILE BARU KE FOLDER PUBLIC
    if (validated_file instanceof File) {
      console.log("📤 Uploading new content file:", validated_file.name);
      
      // Hapus file lama jika ada
      if (detail.materi_detail_url && detail.materi_detail_url.startsWith('/')) {
        const deleted = await deleteFromPublic(detail.materi_detail_url);
        console.log(deleted ? "🗑️ Old file deleted" : "⚠️ Old file not found");
      }
      
      // Upload file baru
      const subFolder = (detailData.material_detail_type || detail.material_detail_type) === 1 
        ? 'videos' 
        : 'pdfs';
      
      const uploadResult = await uploadToPublic(validated_file, subFolder);
      
      if (!uploadResult.success) {
        console.error("❌ Upload failed:", uploadResult.error);
        return { error: uploadResult.error || 'Gagal upload file konten baru.' };
      }
      
      newContentUrl = uploadResult.url!;
      console.log("✅ New file uploaded successfully:", newContentUrl);
      
    } else if (validated_file === null) {
      // File di-clear, hapus file lama
      if (detail.materi_detail_url && detail.materi_detail_url.startsWith('/')) {
        await deleteFromPublic(detail.materi_detail_url);
        console.log("🗑️ File cleared and deleted");
      }
      newContentUrl = "";
      
    } else if (validated_url !== undefined) {
      // URL diubah (untuk YouTube link)
      newContentUrl = validated_url || "";
    }

    const updateData: any = { ...detailData };
    if (newContentUrl !== undefined) {
      updateData.materi_detail_url = newContentUrl;
    }

    await detail.update(updateData);
    console.log("✅ MaterialDetail updated successfully");

    const courseId = detail.material?.course?.course_id;
    if (courseId)
      revalidatePath(
        `/lecturer/dashboard/courses/${courseId}/materials/${detail.material_id}`
      );
    return { success: "Konten berhasil diperbarui!" };
  } catch (error: any) {
    console.error("❌ Update MaterialDetail error:", error);
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

export async function createQuiz(courseId: number, materialId: number, values: CreateQuizInput) {
    try {
        const { userId } = await getLecturerSession();
        // Validasi kepemilikan kursus
        const course = await Course.findOne({ where: { course_id: courseId, user_id: userId } });
        if (!course) throw new Error('Kursus tidak ditemukan atau Anda tidak berhak.');

        const validatedFields = createQuizSchema.safeParse(values);
        if (!validatedFields.success) {
            const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
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
        return { error: error.message || 'Gagal membuat quiz.' };
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
                    as: 'course',
                    where: { user_id: userId },
                    attributes: ['course_id', 'course_title'],
                    required: true,
                },
                {
                    model: Material, // Ambil info bab/seksi
                    as: 'material',
                    attributes: ['material_id', 'material_name'],
                },
                {
                    model: QuizQuestion, // Ambil semua pertanyaan
                    as: 'questions',
                    required: false,
                    include: [
                        {
                            model: QuizAnswerOption, // Ambil semua pilihan jawaban
                            as: 'options',
                            required: false,
                        }
                    ],
                }
            ],
            order: [
                // Urutkan pertanyaan dan jawaban berdasarkan ID
                [{ model: QuizQuestion, as: 'questions' }, 'question_id', 'ASC'],
                [{ model: QuizQuestion, as: 'questions' }, { model: QuizAnswerOption, as: 'options' }, 'option_id', 'ASC']
            ]
        });

        if (!quiz) throw new Error('Quiz tidak ditemukan atau Anda tidak berhak mengaksesnya.');

        return { success: true, data: quiz.toJSON() };
    } catch (error: any) {
        return { success: false, error: error.message || 'Gagal mengambil data quiz.' };
    }
}

export async function addQuestionToQuiz(quizId: number, values: CreateQuestionInput) {
    const t = await sequelize.transaction();

    try {
        const { userId } = await getLecturerSession();
        
        const quiz = await Quiz.findOne({
            where: { quiz_id: quizId },
            include: [{ model: Course, as: 'course', where: { user_id: userId }, attributes: ['course_id'] }],
            transaction: t,
        });
        
        if (!quiz) throw new Error('Quiz tidak ditemukan.');

        const validatedFields = createQuestionSchema.safeParse(values);
        if (!validatedFields.success) {
            const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
            return { error: firstError || "Input pertanyaan tidak valid!" };
        }
        
        const { question_text, question_type, options } = validatedFields.data;

        // 1. Buat Pertanyaan
        const newQuestion = await QuizQuestion.create({
            quiz_id: quizId,
            question_text,
            question_type,
        }, { transaction: t });

        const questionId = newQuestion.question_id;

        // 2. Buat Pilihan Jawaban
        const newOptions = await Promise.all(options.map(opt => {
            return QuizAnswerOption.create({
                quiz_id: quizId,
                question_id: questionId,
                option_text: opt.option_text,
                is_correct: opt.is_correct,
            }, { transaction: t });
        }));

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

        revalidatePath(`/lecturer/dashboard/courses/${quiz.course?.course_id}/quizzes/${quizId}/edit`);
        
        return { 
            success: 'Pertanyaan berhasil ditambahkan!',
            data: createdQuestion // ✅ Tambahkan data
        };

    } catch (error: any) {
        await t.rollback();
        return { error: error.message || 'Gagal menambahkan pertanyaan.' };
    }
}

export async function updateQuestionInQuiz(questionId: number, values: CreateQuestionInput) {
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

        if (!question) throw new Error("Pertanyaan tidak ditemukan atau Anda tidak berhak mengeditnya.");

        const validatedFields = createQuestionSchema.safeParse(values);
        if (!validatedFields.success) {
            const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
            return { error: firstError || "Input pertanyaan tidak valid!" };
        }

        const { question_text, question_type, options } = validatedFields.data;

        // Update pertanyaan
        await question.update(
            { question_text, question_type },
            { transaction: t }
        );

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
            data: updatedQuestion // ✅ Tambahkan data
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

        if (!question) throw new Error("Pertanyaan tidak ditemukan atau Anda tidak berhak menghapusnya.");

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

        revalidatePath(`/lecturer/dashboard/courses/${courseId}/quizzes/${quizId}/edit`);
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
            include: [{ model: Course, as: 'course', where: { user_id: userId }, attributes: ['course_id'] }],
        });
        if (!quiz) throw new Error('Quiz tidak ditemukan atau Anda tidak berhak menghapusnya.'); 
        const courseId = quiz.course?.course_id;

        await quiz.destroy();
        if (courseId)
            revalidatePath(`/lecturer/dashboard/courses/${courseId}/materials`);
        return { success: 'Quiz berhasil dihapus!' };
    } catch (error: any) {
        return { error: error.message || 'Gagal menghapus quiz.' };
    }
}

export async function updateQuizDetails(quizId: number, values: UpdateQuizInput) {
    try {
        const { userId } = await getLecturerSession();

        // Validasi kepemilikan quiz
        const quiz = await Quiz.findOne({
            where: { quiz_id: quizId },
            include: [
                {
                    model: Course,
                    as: 'course',
                    where: { user_id: userId },
                    attributes: ['course_id'],
                },
            ],
        });

        if (!quiz) {
            throw new Error('Quiz tidak ditemukan atau Anda tidak berhak mengeditnya.');
        }

        // Validasi input
        const validatedFields = updateQuizSchema.safeParse(values);
        if (!validatedFields.success) {
            const firstError = Object.values(validatedFields.error.flatten().fieldErrors)[0]?.[0];
            return { error: firstError || "Input data quiz tidak valid!" };
        }

        // Update quiz
        await quiz.update(validatedFields.data);

        // Revalidate page
        revalidatePath(`/lecturer/dashboard/courses/${quiz.course?.course_id}/quizzes/${quizId}/edit`);

        return {
            success: 'Detail quiz berhasil diperbarui!',
            data: {
                quiz_title: quiz.quiz_title,
                quiz_description: quiz.quiz_description,
                passing_score: quiz.passing_score,
                time_limit: quiz.time_limit,
                max_attempts: quiz.max_attempts,
            },
        };
    } catch (error: any) {
        console.error('updateQuizDetails error:', error);
        return { error: error.message || 'Gagal memperbarui detail quiz.' };
    }
}

export async function getCourseEnrollmentsForLecturer(courseId: number) {
  try {
    const { userId } = await getLecturerSession();

    // 1. Verifikasi dosen memiliki kursus ini
    const course = await Course.findOne({ where: { course_id: courseId, user_id: userId } });
    if (!course) {
      throw new Error('Kursus tidak ditemukan atau Anda tidak berhak mengaksesnya.');
    }

    // 2. Ambil semua pendaftaran
    const enrollments = await Enrollment.findAll({
      where: { course_id: courseId },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['user_id', 'first_name', 'last_name', 'email'],
          required: true,
        },
      ],
      order: [['enrolled_at', 'DESC']],
    });

    // 3. Ambil total materi (sama seperti admin action)
    const totalMaterials = await MaterialDetail.count({
        include: [{
            model: Material,
            as: 'material',
            where: { course_id: courseId },
            attributes: [],
        }]
    });
    if (totalMaterials === 0) {
        return { 
            success: true, 
            data: enrollments.map(e => ({ ...e.toJSON(), student: (e.student as User).toJSON(), progress: 0 }))
        };
    }

    // 4. Ambil data progres (sama seperti admin action)
    const userIds = enrollments.map(e => e.user_id).filter(id => id !== null) as number[];
    const progressData = await StudentProgress.findAll({
      where: {
        course_id: courseId,
        user_id: { [Op.in]: userIds },
        is_completed: true,
      },
      attributes: ['user_id', [sequelize.fn('COUNT', sequelize.col('progress_id')), 'completed_count']],
      group: ['user_id'],
      raw: true,
    });
    const progressMap = (progressData as any[]).reduce((acc, item) => {
      acc[item.user_id] = item.completed_count;
      return acc;
    }, {} as { [key: number]: number });

    // 5. Gabungkan data (sama seperti admin action)
    const combinedData = enrollments.map(enrollment => {
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
    console.error('[GET_COURSE_ENROLLMENTS_LECTURER_ERROR]', error);
    return { success: false, error: error.message || 'Gagal mengambil data pendaftaran.' };
  }
}