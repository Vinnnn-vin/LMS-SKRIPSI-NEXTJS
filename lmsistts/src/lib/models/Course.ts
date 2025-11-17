// lmsistts\src\lib\models\Course.ts

import { Model, DataTypes, Sequelize, Optional, Association } from "sequelize";
import { User } from "./User";
import { Category } from "./Category";
import { Material } from "./Material";
import { Enrollment } from "./Enrollment";
import { Review } from "./Review";
import { Payment } from "./Payment";
import { Certificate } from "./Certificate";
import { Quiz } from "./Quiz";

export interface CourseAttributes {
  course_id: number;
  course_title: string | null;
  course_description: string | null;
  course_level: "Beginner" | "Intermediate" | "Advanced" | null;
  course_price: number | null;
  course_duration: number | null;
  publish_status: number | null;
  publish_request_status?: "none" | "pending" | "approved" | "rejected" | null;
  user_id: number | null;
  category_id: number | null;
  thumbnail_url: string | null;
  what_youll_learn: string | null;
  requirements: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;

  lecturer?: User;
  category?: Category;
  materials?: Material[];
  enrollments?: Enrollment[];
  reviews?: Review[];
  payments?: Payment[];
  certificates?: Certificate[];
  quizzes?: Quiz[];
}

interface CourseCreationAttributes
  extends Optional<
    CourseAttributes,
    | "course_id"
    | "course_title"
    | "course_description"
    | "course_level"
    | "course_price"
    | "course_duration"
    | "publish_status"
    | "publish_request_status"
    | "user_id"
    | "category_id"
    | "thumbnail_url"
    | "created_at"
    | "updated_at"
    | "deleted_at"
  > {}

export class Course
  extends Model<CourseAttributes, CourseCreationAttributes>
  implements CourseAttributes
{
  declare course_id: number;
  declare course_title: string | null;
  declare course_description: string | null;
  declare course_level: "Beginner" | "Intermediate" | "Advanced" | null;
  declare course_price: number | null;
  declare course_duration: number | null;
  declare publish_status: number | null;
  declare publish_request_status?:
    | "none"
    | "pending"
    | "approved"
    | "rejected"
    | null;
  declare user_id: number | null;
  declare category_id: number | null;
  declare thumbnail_url: string | null;
  declare what_youll_learn: string;
  declare requirements: string;
  declare created_at: Date | null;
  declare updated_at: Date | null;
  declare deleted_at: Date | null;

  declare readonly lecturer?: User;
  declare readonly category?: Category;
  declare readonly materials?: Material[];
  declare readonly enrollments?: Enrollment[];
  declare readonly reviews?: Review[];
  declare readonly payments?: Payment[];
  declare readonly certificates?: Certificate[];
  declare readonly quizzes?: Quiz[];

  public static associations: {
    lecturer: Association<Course, User>;
    category: Association<Course, Category>;
    materials: Association<Course, Material>;
    enrollments: Association<Course, Enrollment>;
    reviews: Association<Course, Review>;
    payments: Association<Course, Payment>;
    certificates: Association<Course, Certificate>;
    quizzes: Association<Course, Quiz>;
  };

  public isPublished(): boolean {
    return this.publish_status === 1;
  }

  public isFree(): boolean {
    return this.course_price === 0;
  }

  public getFormattedPrice(): string {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(this.course_price || 0);
  }

  public static initModel(sequelize: Sequelize): typeof Course {
    Course.init(
      {
        course_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        course_title: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        course_description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        course_level: {
          type: DataTypes.STRING(12),
          allowNull: true,
          validate: {
            isIn: [["Beginner", "Intermediate", "Advanced"]],
          },
        },
        course_price: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0,
        },
        course_duration: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0,
        },
        publish_status: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0,
        },
        publish_request_status: {
          type: DataTypes.ENUM("none", "pending", "approved", "rejected"),
          allowNull: true,
          defaultValue: "none",
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        category_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        thumbnail_url: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        what_youll_learn: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        requirements: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        deleted_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: "courses",
        timestamps: false,
        paranoid: false,
      }
    );
    return Course;
  }

  public static associate(models: any): void {
    Course.belongsTo(models.User, { foreignKey: "user_id", as: "lecturer" });
    Course.belongsTo(models.Category, {
      foreignKey: "category_id",
      as: "category",
    });
    Course.hasMany(models.Material, {
      foreignKey: "course_id",
      as: "materials",
    });
    Course.hasMany(models.Enrollment, {
      foreignKey: "course_id",
      as: "enrollments",
    });
    Course.hasMany(models.Review, { foreignKey: "course_id", as: "reviews" });
    Course.hasMany(models.Payment, { foreignKey: "course_id", as: "payments" });
    Course.hasMany(models.Certificate, {
      foreignKey: "course_id",
      as: "certificates",
    });
    Course.hasMany(models.Quiz, { foreignKey: "course_id", as: "quizzes" });
  }
}
