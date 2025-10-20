// lmsistts\src\app\actions\course.actions.ts

"use server";

import { Course, User, Category, MaterialDetail, Material } from "@/lib/models";
import {
  courseCardDataSchema,
  type CourseCardData,
} from "@/lib/schemas/course.schema";

// Mengambil semua kursus yang sudah di-publish
export async function getAllPublishedCourses(): Promise<{
  success: boolean;
  data?: CourseCardData[];
  error?: string;
}> {
  try {
    const courses = await Course.findAll({
      where: {
        publish_status: 1,
      },
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

    const plainCourses = courses.map((course) => {
      const data = course.get({ plain: true });
      return {
        course_id: data.course_id,
        course_title: data.course_title,
        thumbnail_url: data.thumbnail_url,
        course_price: data.course_price,
        lecturer: {
          name: data.lecturer
            ? `${data.lecturer.first_name || ""} ${data.lecturer.last_name || ""}`.trim()
            : "N/A",
        },
        category: {
          category_name: data.category
            ? data.category.category_name
            : "Uncategorized",
        },
      };
    });

    console.log(plainCourses);

    const validationResult = courseCardDataSchema.safeParse(plainCourses);
    if (!validationResult.success) {
      console.error(
        "VALIDATION_ERROR_IN_COURSE_ACTION:",
        validationResult.error
      );
      return { success: false, error: "Data kursus tidak valid." };
    }

    return { success: true, data: validationResult.data };
  } catch (error) {
    console.error("[GET_COURSES_ACTION_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengambil data kursus.",
    };
  }
}

// Mengambil semua kursus yang sudah dipublikasikan tanpa pagination
export async function getAllCourses(): Promise<{
  success: boolean;
  data?: CourseCardData[];
  error?: string;
}> {
  try {
    const courses = await Course.findAll({
      where: {
        publish_status: 1,
      },
      include: [
        { model: User, as: 'lecturer', attributes: ['first_name', 'last_name'] },
        { model: Category, as: 'category', attributes: ['category_name'] },
      ],
      order: [['created_at', 'DESC']],
    });

    const plainCourses = courses.map((courseInstance) => {
      const course = courseInstance.toJSON();
      return {
        course_id: course.course_id,
        course_title: course.course_title,
        thumbnail_url: course.thumbnail_url,
        course_price: course.course_price,
        lecturer: {
          name: course.lecturer ? `${course.lecturer.first_name || ''} ${course.lecturer.last_name || ''}`.trim() : 'N/A',
        },
        category: {
          category_name: course.category ? course.category.category_name : 'Uncategorized',
        },
      };
    });

    const validationResult = courseCardDataSchema.safeParse(plainCourses);
    if (!validationResult.success) {
        console.error("VALIDATION_ERROR (All Courses):", validationResult.error.flatten());
        return { success: false, error: "Data kursus tidak valid." };
    }

    return { success: true, data: validationResult.data };

  } catch (error) {
    console.error('[GET_ALL_COURSES_ERROR]', error);
    return {
      success: false,
      error: 'Gagal mengambil data semua kursus.',
    };
  }
}

export async function getCourseDetailsById(courseId: number) {
  try {
    const course = await Course.findByPk(courseId, {
      include: [
        { model: User, as: 'lecturer', attributes: ['first_name', 'last_name'] },
        { model: Category, as: 'category', attributes: ['category_name'] },
        {
          model: Material,
          as: 'materials',
          include: [
            {
              model: MaterialDetail,
              as: 'details',
            },
          ],
        },
      ],
      // Urutkan materi dan detail materi berdasarkan ID
      order: [
        [{ model: Material, as: 'materials' }, 'material_id', 'ASC'],
        [{ model: Material, as: 'materials' }, { model: MaterialDetail, as: 'details' }, 'material_detail_id', 'ASC'],
      ],
    });

    if (!course) {
      return { success: false, error: 'Kursus tidak ditemukan.' };
    }

    return { success: true, data: course.toJSON() };
  } catch (error) {
    console.error(`[GET_COURSE_DETAILS_ERROR] ID: ${courseId}`, error);
    return { success: false, error: 'Gagal mengambil detail kursus.' };
  }
}