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
          attributes: ["first_name", "last_name", "image"],
        },
        {
          model: Category,
          as: "category",
          attributes: ["category_name"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: 6,
    });

    const results = await Promise.all(
      courses.map(async (courseInstance) => {
        const course = courseInstance.toJSON();

        // Ambil jumlah siswa
        const studentCount = await Enrollment.count({
          where: { course_id: course.course_id },
        });

        // Hitung rata-rata rating
        const reviews = await Review.findAll({
          where: { course_id: course.course_id },
          attributes: ["rating"],
        });

        let averageRating = 0;
        if (reviews.length > 0) {
          const total = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
          averageRating = parseFloat((total / reviews.length).toFixed(1));
        }

        return {
          ...course,
          studentCount,
          averageRating,
          course_duration: course.course_duration || null,
        };
      })
    );

    return { success: true, data: results };
  } catch (error) {
    console.error("[GET_FEATURED_COURSES_ERROR]", error);
    return { success: false, error: "Gagal mengambil data kursus unggulan." };
  }
}

export async function getFeaturedCategories() {
  try {
    // Ambil kategori dengan include courses untuk menghitung
    const categories = await Category.findAll({
      attributes: ["category_id", "category_name", "category_description"],
      include: [
        {
          model: Course,
          as: "courses", // Pastikan alias ini sesuai dengan model associations
          attributes: [],
          where: { publish_status: 1 },
          required: false,
        },
      ],
      group: ["Category.category_id"],
      order: [["category_name", "ASC"]],
    });

    // Hitung jumlah kursus secara manual setelah query
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const courseCount = await Course.count({
          where: {
            category_id: category.category_id,
            publish_status: 1,
          },
        });

        return {
          category_id: category.category_id,
          category_name: category.category_name,
          description: category.category_description,
          course_count: courseCount,
        };
      })
    );

    // Sort berdasarkan jumlah kursus dan ambil 8 teratas
    const sortedCategories = categoriesWithCount
      .sort((a, b) => b.course_count - a.course_count)
      .slice(0, 8);

    // console.log("✅ Featured Categories:", sortedCategories);

    return {
      success: true,
      data: sortedCategories,
    };
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
          attributes: ["first_name", "last_name", "image"],
          required: false,
        },
        {
          model: Course,
          as: "course",
          attributes: ["course_title"],
          required: false,
        },
      ],
      order: [["created_at", "DESC"]],
      limit: 6,
    });
    return { success: true, data: reviews.map((r) => r.toJSON()) };
  } catch (error) {
    console.error("[GET_RECENT_REVIEWS_ERROR]", error);
    return { success: false, error: "Gagal mengambil data ulasan." };
  }
}