// lmsistts\src\app\actions\category.actions.ts

'use server';

import { Course, User, Category } from '@/lib/models';
import { sequelize } from '@/lib/db';

// --- FUNGSI UNTUK HALAMAN /courses ---
// export async function getAllCourses() {
//   try {
//     const courses = await Course.findAll({
//       where: { publish_status: 1 },
//       include: [
//         { model: User, as: 'lecturer', attributes: ['first_name', 'last_name'] },
//         { model: Category, as: 'category', attributes: ['category_name'] },
//       ],
//       order: [['created_at', 'DESC']],
//     });
//     return { success: true, data: courses.map((c) => c.toJSON()) };
//   } catch (error) {
//     console.error('[GET_ALL_COURSES_ERROR]', error);
//     return { success: false, error: 'Gagal mengambil data kursus.' };
//   }
// }

// --- FUNGSI UNTUK HALAMAN /categories ---
export async function getAllCategoriesWithCourseCount() {
  try {
    const categories = await Category.findAll({
      attributes: {
        include: [
          [
            // Subquery untuk menghitung jumlah kursus yang di-publish di setiap kategori
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM courses AS course
              WHERE
                course.category_id = Category.category_id
                AND
                course.publish_status = 1
            )`),
            'course_count'
          ]
        ]
      },
      order: [['category_name', 'ASC']],
    });
    return { success: true, data: categories.map((c) => c.toJSON()) };
  } catch (error) {
    console.error('[GET_ALL_CATEGORIES_ERROR]', error);
    return { success: false, error: 'Gagal mengambil data kategori.' };
  }
}

// --- FUNGSI BARU UNTUK HALAMAN DETAIL KATEGORI ---
export async function getCategoryDetailsById(categoryId: number) {
  try {
    const category = await Category.findByPk(categoryId, {
      include: [
        {
          model: Course,
          as: 'courses',
          where: { publish_status: 1 }, // Hanya ambil kursus yang di-publish
          required: false, // Gunakan LEFT JOIN agar kategori tetap tampil meskipun belum ada kursus
          include: [ // Sertakan juga data dosen untuk kartu kursus
            { model: User, as: 'lecturer', attributes: ['first_name', 'last_name'] },
          ],
        },
      ],
      order: [
          // Urutkan kursus di dalam kategori berdasarkan tanggal dibuat
          [{ model: Course, as: 'courses' }, 'created_at', 'DESC']
      ]
    });

    if (!category) {
      return { success: false, error: 'Kategori tidak ditemukan.' };
    }

    return { success: true, data: category.toJSON() };
  } catch (error) {
    console.error(`[GET_CATEGORY_DETAILS_ERROR] ID: ${categoryId}`, error);
    return { success: false, error: 'Gagal mengambil detail kategori.' };
  }
}
