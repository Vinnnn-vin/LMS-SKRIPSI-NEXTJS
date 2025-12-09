// lmsistts\src\app\actions\category.actions.ts

"use server";

import { Course, User, Category } from "@/lib/models";
import { sequelize } from "@/lib/db";

export async function getAllCategoriesWithCourseCount() {
  try {
    const categories = await Category.findAll({
      attributes: [
        "category_id",
        "category_name",
        "category_description",
        "image_url",
        "created_at",
        [
          // Hitung hanya kursus yang PUBLISHED (status = 1)
          sequelize.literal(`(
            SELECT COUNT(*)
            FROM courses AS course
            WHERE
              course.category_id = Category.category_id
              AND course.publish_status = 1
          )`),
          "course_count",
        ],
      ],
      // Hapus include agar group by lebih bersih dan performa lebih cepat
      // include: [], 
      order: [["category_name", "ASC"]],
    });

    return { success: true, data: categories.map((c) => c.toJSON()) };
  } catch (error) {
    console.error("[GET_ALL_CATEGORIES_ERROR]", error);
    return { success: false, error: "Gagal mengambil data kategori." };
  }
}

export async function getCategoryDetailsById(categoryId: number) {
  try {
    const category = await Category.findByPk(categoryId, {
      include: [
        {
          model: Course,
          as: "courses",
          where: { publish_status: 1 },
          required: false,
          include: [
            {
              model: User,
              as: "lecturer",
              attributes: ["first_name", "last_name"],
            },
          ],
        },
      ],
      order: [[{ model: Course, as: "courses" }, "created_at", "DESC"]],
    });

    if (!category) {
      return { success: false, error: "Kategori tidak ditemukan." };
    }

    return { success: true, data: category.toJSON() };
  } catch (error) {
    console.error(`[GET_CATEGORY_DETAILS_ERROR] ID: ${categoryId}`, error);
    return { success: false, error: "Gagal mengambil detail kategori." };
  }
}
