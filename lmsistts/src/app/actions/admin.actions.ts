// lmsistts\src\app\actions\admin.actions.ts

"use server";

import { User, Course, Category, Payment, Enrollment, StudentProgress, MaterialDetail, Material } from "@/lib/models";
import { sequelize } from "@/lib/db";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import {
  adminCreateUserSchema,
  AdminCreateUserInput,
  adminUpdateUserSchema,
  AdminUpdateUserInput,
  adminChangePasswordSchema,
  AdminChangePasswordInput,
} from "@/lib/schemas/user.schema";
import {
  CreateCourseInput,
  createCourseSchema,
  UpdateCourseInput,
  updateCourseSchema,
} from "@/lib/schemas/course.schema";
import {
  CreateCategoryInput,
  createCategorySchema,
  UpdateCategoryInput,
  updateCategorySchema,
} from "@/lib/schemas/category.schema";
// import { useRouter } from "next/navigation"; // Ini hook client, tidak bisa di server action
import z from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";

// --- FUNGSI UNTUK OVERVIEW DASHBOARD ---
export async function getAdminDashboardStats() {
  try {
    const totalUsers = await User.count();
    const totalCourses = await Course.count();
    const totalSales = await Payment.sum("amount", {
      where: { status: "paid" },
    });
    const totalEnrollments = await Enrollment.count();

    return {
      success: true,
      data: {
        totalUsers,
        totalCourses,
        totalSales: totalSales || 0,
        totalEnrollments,
      },
    };
  } catch (error) {
    console.error("[GET_ADMIN_STATS_ERROR]", error);
    return { success: false, error: "Gagal mengambil statistik." };
  }
}

// --- FUNGSI UNTUK CHART PENJUALAN ---
export async function getMonthlySalesData() {
  try {
    const salesData = await Payment.findAll({
      where: { status: "paid" },
      attributes: [
        [sequelize.fn("SUM", sequelize.col("amount")), "totalSales"],
        [sequelize.fn("MONTHNAME", sequelize.col("paid_at")), "month"],
      ],
      group: ["month"],
      order: [[sequelize.fn("MONTH", sequelize.col("paid_at")), "ASC"]],
      raw: true,
    });
    return { success: true, data: salesData };
  } catch (error) {
    console.error("[GET_MONTHLY_SALES_ERROR]", error);
    return { success: false, error: "Gagal mengambil data penjualan bulanan." };
  }
}

// --- FUNGSI UNTUK MANAJEMEN KURSUS ---
export async function getAllCoursesForAdmin() {
  try {
    const courses = await Course.findAll({
      include: [
        {
          model: User,
          as: "lecturer",
          attributes: ["first_name", "last_name"],
        },
        { model: Category, as: "category", attributes: ["category_name"] },
      ],
      order: [["created_at", "DESC"]],
    });
    return { success: true, data: courses.map((c) => c.toJSON()) };
  } catch (error) {
    console.error("[GET_ALL_COURSES_ADMIN_ERROR]", error);
    return { success: false, error: "Gagal mengambil data kursus." };
  }
}

export async function getCourseByIdForAdmin(courseId: number) {
  try {
    const course = await Course.findByPk(courseId);
    if (!course) return { error: "Kursus tidak ditemukan" };
    return { success: true, data: course.toJSON() };
  } catch (error) {
    return { error: "Gagal mengambil data kursus." };
  }
}

export async function updateCourseStatusAndPrice(formData: FormData) {
  const courseId = formData.get("course_id");
  const price = formData.get("course_price");
  const status = formData.get("publish_status");

  try {
    const course = await Course.findByPk(Number(courseId));
    if (!course) return { error: "Kursus tidak ditemukan" };

    course.course_price = Number(price);
    course.publish_status = Number(status);
    await course.save();

    revalidatePath("/admin/dashboard/courses");
    return { success: "Kursus berhasil diperbarui" };
  } catch (error) {
    console.error("[UPDATE_COURSE_ERROR]", error);
    return { error: "Gagal memperbarui kursus" };
  }
}

export async function createCourseByAdmin(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") return { error: "Akses ditolak." };

  const rawData = Object.fromEntries(formData.entries());

  const validatedFields = createCourseSchema.safeParse({
    course_title: rawData.course_title,
    course_description: rawData.course_description,
    course_level: rawData.course_level,
    category_id: rawData.category_id,
    user_id: rawData.user_id,
    course_price: rawData.course_price ? Number(rawData.course_price) : 0,
    course_duration: rawData.course_duration
      ? Number(rawData.course_duration)
      : 0,
    publish_status: rawData.publish_status ?? 0,

    thumbnail_file:
      formData.get("thumbnail_file") instanceof File
        ? formData.get("thumbnail_file")
        : undefined,
  });

  if (!validatedFields.success) {
    console.error(
      "Create Course Validation Error:",
      validatedFields.error.flatten()
    );
    return {
      error: "Input data tidak valid! Periksa kembali form.",
      details: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { thumbnail_file, ...courseData } = validatedFields.data;
  let thumbnailUrl = null;

  if (thumbnail_file) {
    console.log(
      "Uploading thumbnail:",
      thumbnail_file.name,
      thumbnail_file.size
    );
    thumbnailUrl = `https://placeholder.com/${thumbnail_file.name}`;
  }

  try {
    await Course.create({
      ...courseData,
      // user_id sudah ada di courseData dari form, tidak perlu ambil dari session
      thumbnail_url: thumbnailUrl,
    });
    revalidatePath("/admin/dashboard/courses");
    return { success: "Kursus berhasil dibuat!" };
  } catch (error) {
    console.error("[CREATE_COURSE_ERROR]", error);
    return { error: "Gagal membuat kursus." };
  }
}

export async function updateCourseByAdmin(
  courseId: number,
  formData: FormData
) {
  const rawData = Object.fromEntries(formData.entries());

  const validatedFields = updateCourseSchema.safeParse({
    course_title: rawData.course_title || undefined,
    course_description: rawData.course_description || undefined,
    course_level: rawData.course_level || undefined,
    category_id: rawData.category_id || undefined,
    user_id: rawData.user_id || undefined,
    course_price: rawData.course_price
      ? Number(rawData.course_price)
      : undefined,
    course_duration: rawData.course_duration
      ? Number(rawData.course_duration)
      : undefined,
    publish_status: rawData.publish_status,
    thumbnail_file:
      formData.get("thumbnail_file") instanceof File
        ? formData.get("thumbnail_file")
        : rawData.thumbnail_file === ""
          ? null
          : undefined,
  });

  if (!validatedFields.success) {
    console.error("❌ UPDATE VALIDATION FAILED");
    console.error("Validation Errors:", validatedFields.error.flatten());
    return {
      error: "Input data tidak valid!",
      details: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { thumbnail_file, ...courseData } = validatedFields.data;
  let newThumbnailUrl: string | null | undefined = undefined;

  if (thumbnail_file instanceof File) {
    console.log("Uploading new thumbnail:", thumbnail_file.name);
    newThumbnailUrl = `https://placeholder.com/new_${thumbnail_file.name}`;
  } else if (thumbnail_file === null) {
    newThumbnailUrl = null;
  }

  if (courseData.publish_status === 1) {
    const currentCourse = await Course.findByPk(courseId);
    const finalPrice = courseData.course_price ?? currentCourse?.course_price;

    if (!finalPrice || finalPrice <= 0) {
      return { error: "Harga harus diisi (lebih dari 0) sebelum publikasi." };
    }
  }

  try {
    const course = await Course.findByPk(courseId);
    if (!course) return { error: "Kursus tidak ditemukan." };

    const updateData: any = { ...courseData };
    if (newThumbnailUrl !== undefined) {
      updateData.thumbnail_url = newThumbnailUrl;
    }

    await course.update(updateData);

    revalidatePath("/admin/dashboard/courses");
    return { success: "Kursus berhasil diperbarui!" };
  } catch (error) {
    console.error("[UPDATE_COURSE_ERROR]", error);
    return { error: "Gagal memperbarui kursus." };
  }
}

// Tambahkan fungsi untuk get lecturers
export async function getAllLecturersForAdmin() {
  try {
    const lecturers = await User.findAll({
      where: { role: "lecturer" }, // Filter hanya lecturer
      attributes: ["user_id", "first_name", "last_name", "email"],
      order: [["first_name", "ASC"]],
    });
    return { success: true, data: lecturers.map((l) => l.toJSON()) };
  } catch (error) {
    console.error("[GET_ALL_LECTURERS_ERROR]", error);
    return { success: false, error: "Gagal mengambil data lecturer." };
  }
}

export async function deleteCourseByAdmin(courseId: number) {
  try {
    const course = await Course.findByPk(courseId);
    if (!course) return { error: "Kursus tidak ditemukan." };

    // Validasi: Jangan hapus jika sudah ada yang mendaftar
    const enrollmentCount = await Enrollment.count({
      where: { course_id: courseId },
    });
    if (enrollmentCount > 0) {
      return {
        error: `Tidak dapat menghapus. Sudah ada ${enrollmentCount} siswa yang terdaftar di kursus ini.`,
      };
    }

    await course.destroy();
    revalidatePath("/admin/dashboard/courses");
    return { success: "Kursus berhasil dihapus!" };
  } catch (error) {
    console.error("[DELETE_COURSE_ERROR]", error);
    return { error: "Gagal menghapus kursus." };
  }
}

// --- FUNGSI UNTUK MANAJEMEN PENGGUNA ---
export async function getAllUsersForAdmin() {
  try {
    const users = await User.findAll({ order: [["created_at", "DESC"]] });
    return { success: true, data: users.map((u) => u.toJSON()) };
  } catch (error) {
    console.error("[GET_ALL_USERS_ERROR]", error);
    return { success: false, error: "Gagal mengambil data pengguna." };
  }
}

export async function createUserByAdmin(values: AdminCreateUserInput) {
  const validatedFields = adminCreateUserSchema.safeParse(values);
  if (!validatedFields.success) return { error: "Input tidak valid!" };
  try {
    const existingUser = await User.findOne({
      where: { email: validatedFields.data.email },
    });
    if (existingUser) return { error: "Email sudah terdaftar!" };

    const hashedPassword = await bcrypt.hash(validatedFields.data.password, 12);
    await User.create({
      ...validatedFields.data,
      password_hash: hashedPassword,
    });
    revalidatePath("/admin/dashboard/users"); // Gunakan router.refresh() di client
    return { success: "User berhasil dibuat!" };
  } catch (error) {
    console.error("[CREATE_USER_ERROR]", error);
    return { error: "Gagal membuat user." };
  }
}

export async function updateUserByAdmin(
  userId: number,
  values: AdminUpdateUserInput
) {
  const validatedFields = adminUpdateUserSchema.safeParse(values);
  if (!validatedFields.success) return { error: "Input tidak valid!" };
  try {
    const user = await User.findByPk(userId);
    if (!user) return { error: "User tidak ditemukan." };

    // Cek jika email diubah dan sudah ada
    if (values.email !== user.email) {
      const existingEmail = await User.findOne({
        where: { email: values.email },
      });
      if (existingEmail)
        return { error: "Email baru sudah digunakan user lain." };
    }

    await user.update(validatedFields.data);
    // revalidatePath('/admin/dashboard/users');
    return { success: "User berhasil diperbarui!" };
  } catch (error) {
    /* ... */ return { error: "Gagal memperbarui user." };
  }
}

export async function changeUserPasswordByAdmin(
  userId: number,
  values: AdminChangePasswordInput
) {
  const validatedFields = adminChangePasswordSchema.safeParse(values);
  if (!validatedFields.success) return { error: "Password baru tidak valid!" };
  try {
    const user = await User.findByPk(userId);
    if (!user) return { error: "User tidak ditemukan." };
    const hashedPassword = await bcrypt.hash(values.new_password, 12);
    user.password_hash = hashedPassword;
    await user.save();
    return { success: "Password user berhasil diubah!" };
  } catch (error) {
    return { error: "Gagal mengubah password." };
  }
}

export async function deleteUserByAdmin(userId: number) {
  try {
    const user = await User.findByPk(userId);
    if (!user) return { error: "User tidak ditemukan." };

    await user.destroy();
    // revalidatePath('/admin/dashboard/users');
    return { success: "User berhasil dihapus!" };
  } catch (error) {
    /* ... */ return { error: "Gagal menghapus user." };
  }
}

// --- FUNGSI BARU UNTUK MANAJEMEN KATEGORI ---

// Mengambil semua kategori
export async function getAllCategoriesForAdmin() {
  try {
    const categories = await Category.findAll({
      include: [
        {
          model: Course,
          as: "courses",
          attributes: ["course_id", "course_title"],
          required: false,
        },
      ],
      order: [["category_name", "ASC"]],
    });
    return { success: true, data: categories.map((c) => c.toJSON()) };
  } catch (error) {
    console.error("[GET_ALL_CATEGORIES_ADMIN_ERROR]", error);
    return { success: false, error: "Gagal mengambil data kategori." };
  }
}

// Membuat kategori baru
export async function createCategory(values: CreateCategoryInput) {
  const validatedFields = createCategorySchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Input tidak valid!" };
  }
  try {
    await Category.create(validatedFields.data);
    revalidatePath("/admin/dashboard/categories");
    return { success: "Kategori berhasil dibuat!" };
  } catch (error) {
    console.error("[CREATE_CATEGORY_ERROR]", error);
    return { error: "Gagal membuat kategori." };
  }
}

// Memperbarui kategori
export async function updateCategory(
  categoryId: number,
  values: UpdateCategoryInput
) {
  const validatedFields = updateCategorySchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Input tidak valid!" };
  }
  try {
    const category = await Category.findByPk(categoryId);
    if (!category) return { error: "Kategori tidak ditemukan." };

    await category.update(validatedFields.data);
    revalidatePath("/admin/dashboard/categories");
    return { success: "Kategori berhasil diperbarui!" };
  } catch (error) {
    console.error("[UPDATE_CATEGORY_ERROR]", error);
    return { error: "Gagal memperbarui kategori." };
  }
}

// Menghapus kategori
export async function deleteCategory(categoryId: number) {
  try {
    const category = await Category.findByPk(categoryId);
    if (!category) return { error: "Kategori tidak ditemukan." };

    const courseCount = await Course.count({
      where: { category_id: categoryId },
    });
    if (courseCount > 0) {
      // Pastikan pesan error ini muncul jika validasi gagal
      return {
        error: `Tidak dapat menghapus. Masih ada ${courseCount} kursus dalam kategori ini.`,
      };
    }

    await category.destroy();
    revalidatePath("/admin/dashboard/categories");
    return { success: "Kategori berhasil dihapus!" };
  } catch (error) {
    console.error("[DELETE_CATEGORY_ERROR]", error);
    // Berikan pesan error yang lebih spesifik jika memungkinkan
    return { error: "Gagal menghapus kategori. Terjadi kesalahan server." };
  }
}

// --- FUNGSI BARU UNTUK MANAJEMEN PENJUALAN ---
export async function getAllPaymentsForAdmin(filters?: { startDate?: Date, endDate?: Date }) {
  try {
    const whereClause: any = {}; // Objek untuk kondisi filter

    // Tambahkan filter tanggal jika ada
    if (filters?.startDate || filters?.endDate) {
      whereClause.paid_at = {};
      if (filters.startDate) {
        whereClause.paid_at[Op.gte] = filters.startDate;
      }
      if (filters.endDate) {
         // Tambahkan 1 hari ke endDate untuk mencakup seluruh hari tersebut
         const nextDay = new Date(filters.endDate);
         nextDay.setDate(nextDay.getDate() + 1);
         whereClause.paid_at[Op.lt] = nextDay;
      }
    }
    // Hanya ambil yang sudah dibayar untuk manajemen penjualan
    whereClause.status = 'paid';

    const payments = await Payment.findAll({
      where: whereClause, // Terapkan filter
      include: [
        { model: User, as: 'user', attributes: ['first_name', 'last_name', 'email'] },
        { model: Course, as: 'course', attributes: ['course_title'] },
      ],
      order: [['paid_at', 'DESC']], // Urutkan berdasarkan tanggal bayar
    });
    return { success: true, data: payments.map((p) => p.toJSON()) };
  } catch (error) {
    console.error('[GET_ALL_PAYMENTS_ERROR]', error);
    return { success: false, error: 'Gagal mengambil data penjualan.' };
  }
}

// --- FUNGSI BARU UNTUK CHART KURSUS TERLARIS ---
export async function getCourseSalesStats() {
  try {
    const courseSales = await Payment.findAll({
      where: { status: 'paid' },
      attributes: [
        'course_id',
        [sequelize.fn('COUNT', sequelize.col('payment_id')), 'salesCount'],
        [sequelize.col('course.course_title'), 'course_title'], // ✅ pakai col, bukan literal
      ],
      include: [
        {
          model: Course,
          as: 'course',
          attributes: [],
          required: true,
        },
      ],
      group: ['Payment.course_id', 'course.course_title'], // ✅ gunakan string, bukan literal
      order: [[sequelize.col('salesCount'), 'DESC']],
      limit: 10,
      raw: true,
    });

    const formattedData = courseSales.map((item: any) => ({
      name: item.course_title || `Course ID: ${item.course_id}`,
      JumlahTerjual: Number(item.salesCount || 0),
    }));

    return { success: true, data: formattedData };
  } catch (error) {
    console.error('[GET_COURSE_SALES_STATS_ERROR]', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Gagal mengambil statistik. Error: ${errorMessage}` };
  }
}


// --- FUNGSI BARU UNTUK CHART PERGERAKAN KEUANGAN ---
export async function getFinancialTrendData() {
  try {
    const trendData = await Payment.findAll({
      where: {
        status: 'paid',
        paid_at: {
          [Op.gte]: new Date(new Date().setDate(new Date().getDate() - 30)), // Ambil data 30 hari terakhir
        },
      },
      attributes: [
        // Kelompokkan berdasarkan tanggal
        [sequelize.fn('DATE', sequelize.col('paid_at')), 'date'],
        // Jumlahkan total pemasukan per hari
        [sequelize.fn('SUM', sequelize.col('amount')), 'dailyTotal'],
      ],
      group: ['date'],
      order: [['date', 'ASC']], // Urutkan dari tanggal terlama
      raw: true,
    });

    const formattedData = trendData.map((item: any) => ({
      tanggal: new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      Pemasukan: Number(item.dailyTotal),
    }));

    return { success: true, data: formattedData };
  } catch (error) {
    console.error('[GET_FINANCIAL_TREND_ERROR]', error);
    return { success: false, error: 'Gagal mengambil data tren keuangan.' };
  }
}

export async function getCourseEnrollmentsForAdmin(courseId: number) {
  try {
    // 1. Ambil semua pendaftaran untuk kursus ini
    const enrollments = await Enrollment.findAll({
      where: { course_id: courseId },
      include: [
        {
          model: User,
          as: 'student', // Pastikan alias ini 'student' di model Enrollment
          attributes: ['user_id', 'first_name', 'last_name', 'email'],
          required: true,
        },
      ],
      order: [['enrolled_at', 'DESC']],
    });

    // 2. Ambil total jumlah materi (konten) dalam kursus ini
    const totalMaterials = await MaterialDetail.count({
        include: [{
            model: Material,
            as: 'material', // Pastikan alias 'material' di model MaterialDetail
            where: { course_id: courseId },
            attributes: [],
        }]
    });
    if (totalMaterials === 0) {
        return { 
            success: true, 
            data: enrollments.map(e => ({
                ...(e.toJSON()),
                student: (e.student as User).toJSON(), // Pastikan student ada
                progress: 0 
            }))
        };
    }

    // 3. Ambil data progres untuk semua user di kursus ini
    const userIds = enrollments.map(e => e.user_id).filter(id => id !== null) as number[];
    const progressData = await StudentProgress.findAll({
      where: {
        course_id: courseId,
        user_id: { [Op.in]: userIds },
        is_completed: true,
      },
      attributes: [
        'user_id',
        [sequelize.fn('COUNT', sequelize.col('progress_id')), 'completed_count'],
      ],
      group: ['user_id'],
      raw: true,
    });

    const progressMap = (progressData as any[]).reduce((acc, item) => {
      acc[item.user_id] = item.completed_count;
      return acc;
    }, {} as { [key: number]: number });

    // 4. Gabungkan data
    const combinedData = enrollments.map(enrollment => {
      const user = (enrollment.student as User).toJSON(); // Ambil data user
      const completedCount = progressMap[user.user_id] || 0;
      const progress = Math.round((completedCount / totalMaterials) * 100);
      
      return {
        ...enrollment.toJSON(),
        student: user,
        progress: progress > 100 ? 100 : progress, // Pastikan tidak lebih dari 100
      };
    });

    return { success: true, data: combinedData };

  } catch (error: any) {
    console.error('[GET_COURSE_ENROLLMENTS_ERROR]', error);
    return { success: false, error: error.message || 'Gagal mengambil data pendaftaran.' };
  }
}