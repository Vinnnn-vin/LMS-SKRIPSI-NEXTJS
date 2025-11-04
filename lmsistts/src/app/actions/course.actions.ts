"use server";

import { Course, User, Category, MaterialDetail, Material } from "@/lib/models";
import {
  courseCardDataSchema,
  type CourseCardData,
} from "@/lib/schemas/course.schema";
import { Op } from "sequelize";

// Interface untuk filter parameters
export interface CourseFilterParams {
  search?: string;
  category?: string;
  level?: string;
  sortBy?: 'popular' | 'newest' | 'rating' | 'price_low' | 'price_high';
  minPrice?: number;
  maxPrice?: number;
}

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

// Fungsi baru: Mengambil kursus dengan filter
export async function getFilteredCourses(
  filters: CourseFilterParams = {}
): Promise<{
  success: boolean;
  data?: CourseCardData[];
  error?: string;
}> {
  try {
    const {
      search,
      category,
      level,
      sortBy = 'newest',
      minPrice,
      maxPrice,
    } = filters;

    // Build where clause untuk Course
    const whereClause: any = {
      publish_status: 1,
    };

    // Filter berdasarkan search (judul atau deskripsi)
    if (search && search.trim()) {
      whereClause[Op.or] = [
        { course_title: { [Op.like]: `%${search.trim()}%` } },
        { course_description: { [Op.like]: `%${search.trim()}%` } },
      ];
    }

    // Filter berdasarkan level (asumsi ada field course_level di database)
    if (level && level !== 'Semua Level') {
      whereClause.course_level = level;
    }

    // Filter berdasarkan harga
    if (minPrice !== undefined || maxPrice !== undefined) {
      whereClause.course_price = {};
      if (minPrice !== undefined) {
        whereClause.course_price[Op.gte] = minPrice;
      }
      if (maxPrice !== undefined) {
        whereClause.course_price[Op.lte] = maxPrice;
      }
    }

    // Build include untuk Category filter
    const includeCategory: any = {
      model: Category,
      as: "category",
      attributes: ["category_name"],
    };

    // Filter berdasarkan kategori
    if (category && category.trim()) {
      includeCategory.where = {
        category_name: category.trim(),
      };
      includeCategory.required = true; // Inner join
    }

    // Build order clause
    let orderClause: any[];
    switch (sortBy) {
      case 'newest':
        orderClause = [["created_at", "DESC"]];
        break;
      case 'popular':
        // Asumsi ada field enrollment_count atau bisa menggunakan created_at
        orderClause = [["created_at", "DESC"]];
        break;
      case 'rating':
        // Asumsi ada field rating
        orderClause = [["created_at", "DESC"]];
        break;
      case 'price_low':
        orderClause = [["course_price", "ASC"]];
        break;
      case 'price_high':
        orderClause = [["course_price", "DESC"]];
        break;
      default:
        orderClause = [["created_at", "DESC"]];
    }

    const courses = await Course.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "lecturer",
          attributes: ["first_name", "last_name"],
        },
        includeCategory,
      ],
      order: orderClause,
    });

    const plainCourses = courses.map((courseInstance) => {
      const course = courseInstance.toJSON();
      return {
        course_id: course.course_id,
        course_title: course.course_title,
        thumbnail_url: course.thumbnail_url,
        course_price: course.course_price,
        lecturer: {
          name: course.lecturer
            ? `${course.lecturer.first_name || ""} ${course.lecturer.last_name || ""}`.trim()
            : "N/A",
        },
        category: {
          category_name: course.category
            ? course.category.category_name
            : "Uncategorized",
        },
      };
    });

    const validationResult = courseCardDataSchema.safeParse(plainCourses);
    if (!validationResult.success) {
      console.error(
        "VALIDATION_ERROR (Filtered Courses):",
        validationResult.error.flatten()
      );
      return { success: false, error: "Data kursus tidak valid." };
    }

    return { success: true, data: validationResult.data };
  } catch (error) {
    console.error("[GET_FILTERED_COURSES_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengambil data kursus.",
    };
  }
}

// Fungsi untuk mendapatkan semua kategori unik
export async function getAllCategories(): Promise<{
  success: boolean;
  data?: string[];
  error?: string;
}> {
  try {
    const categories = await Category.findAll({
      attributes: ["category_name"],
      order: [["category_name", "ASC"]],
    });

    const categoryNames = categories.map((cat) => cat.category_name);

    return { success: true, data: categoryNames };
  } catch (error) {
    console.error("[GET_CATEGORIES_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengambil data kategori.",
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
        {
          model: User,
          as: "lecturer",
          attributes: ["first_name", "last_name"],
        },
        { model: Category, as: "category", attributes: ["category_name"] },
      ],
      order: [["created_at", "DESC"]],
    });

    const plainCourses = courses.map((courseInstance) => {
      const course = courseInstance.toJSON();
      return {
        course_id: course.course_id,
        course_title: course.course_title,
        thumbnail_url: course.thumbnail_url,
        course_price: course.course_price,
        lecturer: {
          name: course.lecturer
            ? `${course.lecturer.first_name || ""} ${course.lecturer.last_name || ""}`.trim()
            : "N/A",
        },
        category: {
          category_name: course.category
            ? course.category.category_name
            : "Uncategorized",
        },
      };
    });

    console.log(plainCourses);

    const validationResult = courseCardDataSchema.safeParse(plainCourses);
    if (!validationResult.success) {
      console.error(
        "VALIDATION_ERROR (All Courses):",
        validationResult.error.flatten()
      );
      return { success: false, error: "Data kursus tidak valid." };
    }

    return { success: true, data: validationResult.data };
  } catch (error) {
    console.error("[GET_ALL_COURSES_ERROR]", error);
    return {
      success: false,
      error: "Gagal mengambil data semua kursus.",
    };
  }
}

export async function getCourseDetailsById(courseId: number) {
  try {
    const course = await Course.findByPk(courseId, {
      include: [
        {
          model: User,
          as: "lecturer",
          attributes: ["first_name", "last_name"],
        },
        { model: Category, as: "category", attributes: ["category_name"] },
        {
          model: Material,
          as: "materials",
          include: [
            {
              model: MaterialDetail,
              as: "details",
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
      ],
    });

    if (!course) {
      return { success: false, error: "Kursus tidak ditemukan." };
    }

    return { success: true, data: course.toJSON() };
  } catch (error) {
    console.error(`[GET_COURSE_DETAILS_ERROR] ID: ${courseId}`, error);
    return { success: false, error: "Gagal mengambil detail kursus." };
  }
}