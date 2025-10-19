"use server";

import { Course, User, Category } from "@/lib/models";
import {
  courseCardDataSchema,
  type CourseCardData,
} from "@/lib/schemas/course.schema";

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
