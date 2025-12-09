// lmsistts\src\app\actions\admin.actions.ts

"use server";

import {
  User,
  Course,
  Category,
  Payment,
  Enrollment,
  StudentProgress,
  MaterialDetail,
  Material,
  Quiz,
} from "@/lib/models";
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
import z from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { deleteFromPublic, uploadCourseThumbnail } from "@/lib/uploadHelper";

// New imports for Blob storage
import {
  deleteFromBlob,
  uploadCourseThumbnailToBlob,
} from "@/lib/uploadHelperBlob";

// --- FUNGSI UNTUK OVERVIEW DASHBOARD ---
export async function getAdminDashboardStats() {
  try {
    const totalUsers = await User.count();
    const totalCourses = await Course.count();
    const totalSalesRaw = await Payment.sum("amount", {
      where: { status: "paid" },
    });
    const totalSales = totalSalesRaw || 0;
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
    return { success: false, error: "Gagal mengambil statistik." };
  }
}

// --- FUNGSI UNTUK CHART PENJUALAN ---
export async function getMonthlySalesData() {
  try {
    const salesData = await Payment.findAll({
      where: {
        status: "paid",
        paid_at: { [Op.ne]: null },
      },
      attributes: [
        [sequelize.fn("SUM", sequelize.col("amount")), "totalSales"],
        [sequelize.fn("MONTHNAME", sequelize.col("paid_at")), "month"],
        [sequelize.fn("MONTH", sequelize.col("paid_at")), "monthNum"], // Helper sorting
      ],
      group: ["month", "monthNum"],
      order: [[sequelize.col("monthNum"), "ASC"]],
      raw: true,
    });

    return { success: true, data: salesData };
  } catch (error) {
    console.error("[GET_MONTHLY_SALES_ERROR]", error);
    return { success: false, error: "Gagal mengambil data penjualan bulanan." };
  }
}

export async function getPendingPaymentsForAdmin() {
  try {
    const payments = await Payment.findAll({
      where: { status: "pending" },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["first_name", "last_name", "email"],
        },
        {
          model: Course,
          as: "course",
          attributes: ["course_title", "course_price"],
        },
      ],
      order: [["created_at", "DESC"]],
    });
    return { success: true, data: payments.map((p) => p.toJSON()) };
  } catch (error) {
    console.error("[GET_PENDING_PAYMENTS_ADMIN]", error);
    return {
      success: false,
      error: "Gagal mengambil data pembayaran pending.",
    };
  }
}

export async function confirmPaymentManual(paymentId: number) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") return { error: "Akses ditolak." };

  const t = await sequelize.transaction();

  try {
    const payment = await Payment.findByPk(paymentId, { transaction: t });

    if (!payment) {
      await t.rollback();
      return { error: "Data pembayaran tidak ditemukan." };
    }

    if (payment.status === "paid") {
      await t.rollback();
      return { error: "Pembayaran ini sudah dikonfirmasi sebelumnya." };
    }

    // 1. Update status Payment
    await payment.update(
      {
        status: "paid",
        paid_at: new Date(),
        payment_method: "Manual Verification",
      },
      { transaction: t }
    );

    // 2. Cek Enrollment Duplikat
    const existingEnrollment = await Enrollment.findOne({
      where: {
        user_id: payment.user_id,
        course_id: payment.course_id,
        status: { [Op.in]: ["active", "completed"] },
      },
      transaction: t,
    });

    if (!existingEnrollment) {
      // 3. Buat Enrollment Baru
      const newEnrollment = await Enrollment.create(
        {
          user_id: payment.user_id,
          course_id: payment.course_id,
          enrolled_at: new Date(),
          status: "active",
        },
        { transaction: t }
      );

      // Link payment ke enrollment
      await payment.update(
        { enrollment_id: newEnrollment.enrollment_id },
        { transaction: t }
      );
    }

    await t.commit();
    revalidatePath("/admin/dashboard/transactions"); // Pastikan path ini sesuai
    revalidatePath("/admin/dashboard"); // Refresh stats

    return {
      success: "Pembayaran dikonfirmasi! Kursus siswa telah diaktifkan.",
    };
  } catch (error: any) {
    await t.rollback();
    console.error("[CONFIRM_PAYMENT_MANUAL_ERROR]", error);
    return { error: error.message || "Gagal mengkonfirmasi pembayaran." };
  }
}

export async function rejectPaymentManual(paymentId: number) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") return { error: "Akses ditolak." };

  try {
    const payment = await Payment.findByPk(paymentId);
    if (!payment) return { error: "Data tidak ditemukan" };

    await payment.update({ status: "failed" }); // Atau 'expired'
    revalidatePath("/admin/dashboard/transactions");

    return { success: "Pembayaran ditolak/dibatalkan." };
  } catch (error: any) {
    return { error: error.message };
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
          required: false,
        },
        {
          model: Category,
          as: "category",
          attributes: ["category_name"],
          required: false,
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const safeData = courses.map((courseInstance) => {
      const c = courseInstance.toJSON();
      return {
        ...c,
        lecturer: c.lecturer || {
          first_name: "Unknown",
          last_name: "Lecturer",
        },
        category: c.category || { category_name: "Uncategorized" },
      };
    });

    // return { success: true, data: courses.map((c) => c.toJSON()) };
    return { success: true, data: safeData };
  } catch (error) {
    console.error("[GET_ALL_COURSES_ADMIN_ERROR]", error);
    return { success: false, error: "Gagal mengambil data kursus." };
  }
}

export async function getCourseByIdForAdmin(courseId: number) {
  try {
    const course = await Course.findByPk(courseId, {
      include: [
        {
          model: User,
          as: "lecturer",
          attributes: ["first_name", "last_name"],
        },
        {
          model: Category,
          as: "category",
          attributes: ["category_name"],
        },
        {
          model: Material,
          as: "materials",
          attributes: ["material_id", "material_name"],
          required: false,
          include: [
            {
              model: MaterialDetail,
              as: "details",
              attributes: [
                "material_detail_id",
                "material_detail_name",
                "material_detail_type",
              ],
              required: false,
            },

            {
              model: Quiz,
              as: "quizzes",
              attributes: ["quiz_id", "quiz_title"],
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

    if (!course) return { success: false, error: "Kursus tidak ditemukan" };
    return { success: true, data: course.toJSON() };
  } catch (error) {
    console.error(`[GET_COURSE_BY_ID_ADMIN_ERROR] ID: ${courseId}`, error);
    return { success: false, error: "Gagal mengambil data kursus." };
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

  // if (thumbnail_file) {
  //   console.log(
  //     "Uploading thumbnail:",
  //     thumbnail_file.name,
  //     thumbnail_file.size
  //   );
  //   thumbnailUrl = `https://placeholder.com/${thumbnail_file.name}`;
  // }

  try {
    // await Course.create({
    //   ...courseData,
    //   thumbnail_url: thumbnailUrl,
    // });

    const newCourse = await Course.create({
      ...courseData,
      thumbnail_url: null,
    });

    if (thumbnail_file) {
      // --- [NEW BLOB UPLOAD] ---
      const uploadResult = await uploadCourseThumbnailToBlob(
        thumbnail_file,
        courseData.course_title,
        newCourse.course_id
      );

      if (uploadResult.success) {
        thumbnailUrl = uploadResult.url;
        await newCourse.update({ thumbnail_url: thumbnailUrl });
      } else {
        console.error("Failed to upload thumbnail in admin create");
      }
    }

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
  console.log("🔍 [ADMIN UPDATE] Raw Form Data:", rawData);

  // 2. PARSING DENGAN LEBIH AMAN (Handle angka 0)
  const coursePriceRaw = formData.get("course_price");
  const courseDurationRaw = formData.get("course_duration");

  const validatedFields = updateCourseSchema.safeParse({
    course_title: rawData.course_title || undefined,
    course_description: rawData.course_description || undefined,
    what_youll_learn: rawData.what_youll_learn
      ? String(rawData.what_youll_learn)
      : "",
    requirements: rawData.requirements ? String(rawData.requirements) : "",
    course_level: rawData.course_level || undefined,
    category_id: rawData.category_id || undefined,
    user_id: rawData.user_id || undefined,

    course_price:
      coursePriceRaw !== null && coursePriceRaw !== ""
        ? Number(coursePriceRaw)
        : undefined,
    course_duration:
      courseDurationRaw !== null && courseDurationRaw !== ""
        ? Number(courseDurationRaw)
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
    console.error(
      "❌ [ADMIN UPDATE] Validation Error:",
      validatedFields.error.flatten()
    );
    return {
      error: "Input data tidak valid!",
      details: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { thumbnail_file, ...courseData } = validatedFields.data;
  try {
    // 3. Ambil Data Kursus Lama (PENTING: Untuk hapus gambar lama & ambil judul)
    const course = await Course.findByPk(courseId);
    if (!course) return { error: "Kursus tidak ditemukan." };

    let newThumbnailUrl: string | null | undefined = undefined;

    // 4. Logika Upload Thumbnail
    if (thumbnail_file instanceof File) {
      console.log(
        "📤 [ADMIN UPDATE] Uploading new thumbnail:",
        thumbnail_file.name
      );

      // if (course.thumbnail_url) {
      //   await deleteFromPublic(course.thumbnail_url);
      // }

      // const titleForFolder =
      //   courseData.course_title || course.course_title || "Course";

      // const uploadResult = await uploadCourseThumbnail(
      //   thumbnail_file,
      //   titleForFolder,
      //   courseId
      // );

      if (course.thumbnail_url) {
        await deleteFromBlob(course.thumbnail_url);
      }
      const titleForFolder =
        courseData.course_title || course.course_title || "Course";
      const uploadResult = await uploadCourseThumbnailToBlob(
        thumbnail_file,
        titleForFolder,
        courseId
      );

      if (!uploadResult.success || !uploadResult.url) {
        return { error: uploadResult.error || "Gagal mengupload thumbnail." };
      }

      if (!uploadResult.success || !uploadResult.url) {
        return { error: uploadResult.error || "Gagal mengupload thumbnail." };
      }

      newThumbnailUrl = uploadResult.url;
      console.log("✅ [ADMIN UPDATE] Upload sukses. URL:", newThumbnailUrl);
    } else if (thumbnail_file === null) {
      console.log("🗑️ [ADMIN UPDATE] Menghapus thumbnail lama.");
      // if (course.thumbnail_url) {
      //   await deleteFromPublic(course.thumbnail_url);
      // }

      if (course.thumbnail_url) {
        await deleteFromBlob(course.thumbnail_url);
      }
      newThumbnailUrl = null;
    }

    // 5. Validasi Harga untuk Publish
    if (courseData.publish_status === 1) {
      const finalPrice = courseData.course_price ?? course.course_price;
      if (finalPrice === undefined || finalPrice === null || finalPrice < 0) {
        return { error: "Harga tidak valid untuk publikasi." };
      }
    }

    // 6. Susun Data Update Final
    const updateData: any = { ...courseData };

    // Hanya update thumbnail_url jika ada perubahan (string URL baru atau null)
    if (newThumbnailUrl !== undefined) {
      updateData.thumbnail_url = newThumbnailUrl;
    }

    console.log("💾 [ADMIN UPDATE] Menyimpan ke Database:", updateData);

    // 7. Eksekusi Update
    await course.update(updateData);

    revalidatePath("/admin/dashboard/courses");
    return { success: "Kursus berhasil diperbarui!" };
  } catch (error: any) {
    console.error("❌ [ADMIN UPDATE] Error:", error);
    return { error: error.message || "Gagal memperbarui kursus." };
  }
}

export async function getAllLecturersForAdmin() {
  try {
    const lecturers = await User.findAll({
      where: { role: "lecturer" },
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
    revalidatePath("/admin/dashboard/users");
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

    if (values.email !== user.email) {
      const existingEmail = await User.findOne({
        where: { email: values.email },
      });
      if (existingEmail)
        return { error: "Email baru sudah digunakan user lain." };
    }

    await user.update(validatedFields.data);
    return { success: "User berhasil diperbarui!" };
  } catch (error) {
    return { error: "Gagal memperbarui user." };
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
    return { success: "User berhasil dihapus!" };
  } catch (error) {
    return { error: "Gagal menghapus user." };
  }
}

// --- FUNGSI BARU UNTUK MANAJEMEN KATEGORI ---

export async function getAllCategoriesForAdmin() {
  try {
    const categories = await Category.findAll({
      include: [
        {
          model: Course,
          as: "courses",
          attributes: ["course_id"],
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

export async function createCategory(values: CreateCategoryInput) {
  const validatedFields = createCategorySchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: "Input tidak valid!" };
  }
  try {
    await Category.create(validatedFields.data);

    // [FIX] Refresh data di semua halaman yang menampilkan kategori
    revalidatePath("/categories", "page"); // ✅ Tambahkan parameter "page"
    revalidatePath("/admin/dashboard/categories", "page");
    revalidatePath("/", "page");
    revalidatePath("/courses", "page");

    return { success: "Kategori berhasil dibuat!" };
  } catch (error) {
    console.error("[CREATE_CATEGORY_ERROR]", error);
    return { error: "Gagal membuat kategori." };
  }
}

// 2. Update Update Category
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

    // [FIX] Refresh data di semua halaman
    revalidatePath("/categories", "page"); // ✅ Tambahkan parameter "page"
    revalidatePath("/admin/dashboard/categories", "page");
    revalidatePath("/", "page");
    revalidatePath("/courses", "page");

    return { success: "Kategori berhasil diperbarui!" };
  } catch (error) {
    console.error("[UPDATE_CATEGORY_ERROR]", error);
    return { error: "Gagal memperbarui kategori." };
  }
}

// 3. Update Delete Category
export async function deleteCategory(categoryId: number) {
  try {
    const category = await Category.findByPk(categoryId);
    if (!category) return { error: "Kategori tidak ditemukan." };

    const courseCount = await Course.count({
      where: { category_id: categoryId },
    });
    if (courseCount > 0) {
      return {
        error: `Tidak dapat menghapus. Masih ada ${courseCount} kursus dalam kategori ini.`,
      };
    }

    await category.destroy();

    // [FIX] Refresh data di semua halaman
    revalidatePath("/categories", "page"); // ✅ Tambahkan parameter "page"
    revalidatePath("/admin/dashboard/categories", "page");
    revalidatePath("/", "page");
    revalidatePath("/courses", "page");

    return { success: "Kategori berhasil dihapus!" };
  } catch (error) {
    console.error("[DELETE_CATEGORY_ERROR]", error);
    return { error: "Gagal menghapus kategori. Terjadi kesalahan server." };
  }
}

// --- FUNGSI BARU UNTUK MANAJEMEN PENJUALAN ---
export async function getAllPaymentsForAdmin(filters?: {
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const whereClause: any = {};
    whereClause.status = "paid";

    if (filters?.startDate || filters?.endDate) {
      whereClause.paid_at = {};
      if (filters.startDate) {
        whereClause.paid_at[Op.gte] = filters.startDate;
      }
      if (filters.endDate) {
        const nextDay = new Date(filters.endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        whereClause.paid_at[Op.lt] = nextDay;
      }
    }

    const payments = await Payment.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["first_name", "last_name", "email"],
          required: false,
        },
        {
          model: Course,
          as: "course",
          attributes: ["course_title"],
          required: false,
        },
      ],
      order: [["paid_at", "DESC"]],
    });
    return { success: true, data: payments.map((p) => p.toJSON()) };
  } catch (error) {
    console.error("[GET_ALL_PAYMENTS_ERROR]", error);
    return { success: false, error: "Gagal mengambil data penjualan." };
  }
}

// --- FUNGSI BARU UNTUK CHART KURSUS TERLARIS ---
export async function getCourseSalesStats() {
  try {
    const courseSales = await Payment.findAll({
      where: { status: "paid" },
      attributes: [
        "course_id",
        [sequelize.fn("COUNT", sequelize.col("payment_id")), "salesCount"],
        [sequelize.col("course.course_title"), "course_title"],
      ],
      include: [
        {
          model: Course,
          as: "course",
          attributes: [],
          required: true,
        },
      ],
      group: ["course.course_id", "course.course_title"],
      order: [[sequelize.col("salesCount"), "DESC"]],
      limit: 10,
      raw: true,
    });

    const formattedData = courseSales.map((item: any) => ({
      name: item.course_title || `Course ID: ${item.course_id}`,
      JumlahTerjual: Number(item.salesCount || 0),
    }));

    return { success: true, data: formattedData };
  } catch (error) {
    console.error("[GET_COURSE_SALES_STATS_ERROR]", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Gagal mengambil statistik. Error: ${errorMessage}`,
    };
  }
}

// --- FUNGSI BARU UNTUK CHART PERGERAKAN KEUANGAN ---
export async function getFinancialTrendData() {
  try {
    const trendData = await Payment.findAll({
      where: {
        status: "paid",
        paid_at: {
          [Op.gte]: new Date(new Date().setDate(new Date().getDate() - 30)),
        },
      },
      attributes: [
        [sequelize.fn("DATE", sequelize.col("paid_at")), "date"],
        [sequelize.fn("SUM", sequelize.col("amount")), "dailyTotal"],
      ],
      group: ["date"],
      order: [["date", "ASC"]],
      raw: true,
    });

    const formattedData = trendData.map((item: any) => ({
      tanggal: new Date(item.date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      }),
      Pemasukan: Number(item.dailyTotal),
    }));

    return { success: true, data: formattedData };
  } catch (error) {
    console.error("[GET_FINANCIAL_TREND_ERROR]", error);
    return { success: false, error: "Gagal mengambil data tren keuangan." };
  }
}

export async function getCourseEnrollmentsForAdmin(courseId: number) {
  try {
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
    console.error("[GET_COURSE_ENROLLMENTS_ERROR]", error);
    return {
      success: false,
      error: error.message || "Gagal mengambil data pendaftaran.",
    };
  }
}

export async function approvePublishRequest(courseId: number) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") return { error: "Akses ditolak." };

  try {
    const course = await Course.findByPk(courseId);
    if (!course) return { error: "Kursus tidak ditemukan." };

    if (course.publish_request_status !== "pending") {
      return {
        error: "Kursus tidak memiliki permintaan publikasi yang pending.",
      };
    }

    if (!course.course_price || course.course_price <= 0) {
      return {
        error: "Harga kursus harus diisi (lebih dari 0) sebelum publikasi.",
      };
    }

    course.publish_status = 1;
    course.publish_request_status = "approved";
    await course.save();

    revalidatePath("/admin/dashboard/courses");
    return { success: "Kursus berhasil dipublikasikan!" };
  } catch (error: any) {
    console.error("[APPROVE_PUBLISH_ERROR]", error);
    return { error: "Gagal menyetujui publikasi kursus." };
  }
}

export async function rejectPublishRequest(courseId: number, reason: string) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") return { error: "Akses ditolak." };

  try {
    const course = await Course.findByPk(courseId);
    if (!course) return { error: "Kursus tidak ditemukan." };

    if (course.publish_request_status !== "pending") {
      return {
        error: "Kursus tidak memiliki permintaan publikasi yang pending.",
      };
    }

    course.publish_request_status = "rejected";
    await course.save();

    revalidatePath("/admin/dashboard/courses");
    return { success: "Permintaan publikasi ditolak." };
  } catch (error: any) {
    console.error("[REJECT_PUBLISH_ERROR]", error);
    return { error: "Gagal menolak publikasi kursus." };
  }
}

export async function approveCoursePublish(courseId: number, price: number) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return { success: false, error: "Akses ditolak. Hanya admin." };
  }

  if (price === null || price === undefined || price <= 0) {
    return {
      success: false,
      error: "Harga harus lebih besar dari 0 untuk publikasi.",
    };
  }

  try {
    const course = await Course.findByPk(courseId);
    if (!course) {
      return { success: false, error: "Kursus tidak ditemukan." };
    }
    if (course.publish_request_status !== "pending") {
      return {
        success: false,
        error: "Kursus ini tidak sedang menunggu persetujuan.",
      };
    }

    course.publish_status = 1;
    course.publish_request_status = "approved";
    course.course_price = price;
    await course.save();

    revalidatePath("/admin/dashboard/courses");
    revalidatePath("/courses");
    revalidatePath(`/courses/${courseId}`);

    return {
      success: true,
      message: `Kursus "${course.course_title}" berhasil disetujui dan dipublikasikan.`,
    };
  } catch (error: any) {
    console.error("[APPROVE_COURSE_ERROR]", error);
    return {
      success: false,
      error: error.message || "Gagal menyetujui kursus.",
    };
  }
}

export async function rejectCoursePublish(courseId: number) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return { success: false, error: "Akses ditolak. Hanya admin." };
  }

  try {
    const course = await Course.findByPk(courseId);
    if (!course) {
      return { success: false, error: "Kursus tidak ditemukan." };
    }
    if (course.publish_request_status !== "pending") {
      return {
        success: false,
        error: "Kursus ini tidak sedang menunggu persetujuan.",
      };
    }

    course.publish_request_status = "rejected";

    await course.save();

    revalidatePath("/admin/dashboard/courses");

    return {
      success: true,
      message: `Permintaan publikasi untuk kursus "${course.course_title}" ditolak.`,
    };
  } catch (error: any) {
    console.error("[REJECT_COURSE_ERROR]", error);
    return {
      success: false,
      error: error.message || "Gagal menolak permintaan kursus.",
    };
  }
}
