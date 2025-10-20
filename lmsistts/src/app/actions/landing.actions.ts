// lmsistts\src\app\actions\landing.actions.ts

'use server';

import { Course, User, Category, Review, Enrollment } from '@/lib/models';
import { Op } from 'sequelize';

// --- FUNGSI UNTUK BARIS 2: OVERVIEW ---
export async function getPlatformStats() {
  try {
    const totalCourses = await Course.count({ where: { publish_status: 1 } });
    const totalStudents = await User.count({ where: { role: 'student' } });
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
    console.error('[GET_PLATFORM_STATS_ERROR]', error);
    return { success: false, error: 'Gagal mengambil statistik platform.' };
  }
}

// --- FUNGSI UNTUK BARIS 3: FEATURED COURSES ---
export async function getFeaturedCourses() {
  try {
    const courses = await Course.findAll({
      where: { publish_status: 1 },
      include: [
        { model: User, as: 'lecturer', attributes: ['first_name', 'last_name'] },
        { model: Category, as: 'category', attributes: ['category_name'] },
      ],
      order: [['created_at', 'DESC']],
      limit: 6,
    });
    return { success: true, data: courses.map((c) => c.toJSON()) };
  } catch (error) {
    console.error('[GET_FEATURED_COURSES_ERROR]', error);
    return { success: false, error: 'Gagal mengambil data kursus unggulan.' };
  }
}

// --- FUNGSI UNTUK BARIS 5: KATEGORI UNGGULAN ---
export async function getFeaturedCategories() {
  try {
    // Logika ini bisa disesuaikan, misal mengambil kategori dengan kursus terbanyak
    const categories = await Category.findAll({
      limit: 4, // Ambil 4 kategori
      order: [['category_name', 'ASC']],
    });
    return { success: true, data: categories.map((c) => c.toJSON()) };
  } catch (error) {
    console.error('[GET_FEATURED_CATEGORIES_ERROR]', error);
    return { success: false, error: 'Gagal mengambil data kategori.' };
  }
}

// --- FUNGSI UNTUK BARIS 6: REVIEWS ---
export async function getRecentReviews() {
  try {
    const reviews = await Review.findAll({
      where: {
        rating: { [Op.gte]: 4 }, // Hanya rating 4 atau 5
      },
      include: [{ model: User, as: 'reviewer', attributes: ['first_name', 'last_name'] }],
      order: [['created_at', 'DESC']],
      limit: 4, // Ambil 4 ulasan terbaru
    });
    return { success: true, data: reviews.map((r) => r.toJSON()) };
  } catch (error) {
    console.error('[GET_RECENT_REVIEWS_ERROR]', error);
    return { success: false, error: 'Gagal mengambil data ulasan.' };
  }
}