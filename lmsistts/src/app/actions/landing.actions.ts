// lmsistts\src\app\actions\landing.actions.ts

"use server";

import { Course, User, Category, Review, Enrollment } from "@/lib/models";
import { Op } from "sequelize";

export async function getPlatformStats() {
  try {
    const totalCourses = await Course.count({ where: { publish_status: 1 } });
    const totalStudents = await User.count({ where: { role: "student" } });
    const totalEnrollments = await Enrollment.count();
    return {
      success: true,
      data: {
        courses: totalCourses,
        students: totalStudents,
        enrollments: totalEnrollments,
      },
    };
  } catch (error) {
    console.error("[GET_PLATFORM_STATS_ERROR]", error);
    return { success: false, error: "Gagal mengambil statistik platform." };
  }
}

export async function getFeaturedCourses() {
  try {
    const courses = await Course.findAll({
      where: { publish_status: 1 },
      include: [
        {
          model: User,
          as: "lecturer",
          attributes: ["first_name", "last_name"],
        },
        { model: Category, as: "category", attributes: ["category_name"] },
      ],
      order: [["created_at", "DESC"]],
      limit: 6,
    });
    return { success: true, data: courses.map((c) => c.toJSON()) };
  } catch (error) {
    console.error("[GET_FEATURED_COURSES_ERROR]", error);
    return { success: false, error: "Gagal mengambil data kursus unggulan." };
  }
}

export async function getFeaturedCategories() {
  try {
    const categories = await Category.findAll({
      limit: 4,
      order: [["category_name", "ASC"]],
    });
    return { success: true, data: categories.map((c) => c.toJSON()) };
  } catch (error) {
    console.error("[GET_FEATURED_CATEGORIES_ERROR]", error);
    return { success: false, error: "Gagal mengambil data kategori." };
  }
}

export async function getRecentReviews() {
  try {
    const reviews = await Review.findAll({
      where: {
        rating: { [Op.gte]: 4 },
      },
      include: [
        {
          model: User,
          as: "reviewer",
          attributes: ["first_name", "last_name"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: 4,
    });
    return { success: true, data: reviews.map((r) => r.toJSON()) };
  } catch (error) {
    console.error("[GET_RECENT_REVIEWS_ERROR]", error);
    return { success: false, error: "Gagal mengambil data ulasan." };
  }
}
