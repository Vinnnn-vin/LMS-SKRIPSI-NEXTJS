// lmsistts\src\app\actions\course.actions.ts

"use server";

import {
  Course,
  User,
  Category,
  MaterialDetail,
  Material,
  Enrollment,
  Review,
} from "@/lib/models";
import {
  courseCardDataSchema,
  type CourseCardData,
} from "@/lib/schemas/course.schema";
import { Op } from "sequelize";

export interface CourseFilterParams {
  search?: string;
  category?: string;
  level?: string;
  sortBy?: "popular" | "newest" | "rating" | "price_low" | "price_high";
  minPrice?: number;
  maxPrice?: number;
}

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
      sortBy = "newest",
      minPrice,
      maxPrice,
    } = filters;

    const whereClause: any = {
      publish_status: 1,
    };

    if (search && search.trim()) {
      whereClause[Op.or] = [
        { course_title: { [Op.like]: `%${search.trim()}%` } },
        { course_description: { [Op.like]: `%${search.trim()}%` } },
      ];
    }

    if (level && level !== "Semua Level") {
      whereClause.course_level = level;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      whereClause.course_price = {};
      if (minPrice !== undefined) {
        whereClause.course_price[Op.gte] = minPrice;
      }
      if (maxPrice !== undefined) {
        whereClause.course_price[Op.lte] = maxPrice;
      }
    }

    const includeCategory: any = {
      model: Category,
      as: "category",
      attributes: ["category_name"],
    };

    if (category && category.trim()) {
      includeCategory.where = {
        category_name: category.trim(),
      };
      includeCategory.required = true;
    }

    let orderClause: any[];
    switch (sortBy) {
      case "newest":
        orderClause = [["created_at", "DESC"]];
        break;
      case "popular":
        orderClause = [["created_at", "DESC"]];
        break;
      case "rating":
        orderClause = [["created_at", "DESC"]];
        break;
      case "price_low":
        orderClause = [["course_price", "ASC"]];
        break;
      case "price_high":
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
              where: { is_free: true },
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
      ],
    });

    if (!course) {
      return { success: false, error: "Kursus tidak ditemukan." };
    }

    // Hitung Jumlah Siswa
    const studentCount = await Enrollment.count({
      where: { course_id: courseId },
    });

    // Hitung Rata-rata Rating
    const reviews = await Review.findAll({
      where: { course_id: courseId },
      attributes: ["rating"],
    });

    let averageRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce(
        (acc, review) => acc + (review.rating || 0),
        0
      );
      averageRating = parseFloat((totalRating / reviews.length).toFixed(1));
    }

    const courseData = course.toJSON();
    const learnList = courseData.what_youll_learn
      ? courseData.what_youll_learn
          .split("\n")
          .filter((item) => item.trim() !== "")
      : [];
    const requirementsList = courseData.requirements
      ? courseData.requirements.split("\n").filter((item) => item.trim() !== "")
      : [];

    return {
      success: true,
      data: {
        ...courseData,
        studentCount: studentCount,
        averageRating: averageRating,
        learnList: learnList,
        requirementsList: requirementsList,
      },
    };
  } catch (error) {
    console.error(`[GET_COURSE_DETAILS_ERROR] ID: ${courseId}`, error);
    return { success: false, error: "Gagal mengambil detail kursus." };
  }
}
