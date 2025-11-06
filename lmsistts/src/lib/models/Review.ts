// lmsistts\src\lib\models\Review.ts

import { Model, DataTypes, Sequelize, Optional, Association } from "sequelize";
import { User } from "./User";
import { Course } from "./Course";

interface ReviewAttributes {
  review_id: number;
  user_id: number | null;
  course_id: number | null;
  rating: number | null;
  review_text: string | null;
  created_at: Date | null;
  deleted_at: Date | null;
}

interface ReviewCreationAttributes
  extends Optional<
    ReviewAttributes,
    | "review_id"
    | "user_id"
    | "course_id"
    | "rating"
    | "review_text"
    | "created_at"
    | "deleted_at"
  > {}

export class Review
  extends Model<ReviewAttributes, ReviewCreationAttributes>
  implements ReviewAttributes
{
  declare review_id: number;
  declare user_id: number | null;
  declare course_id: number | null;
  declare rating: number | null;
  declare review_text: string | null;
  declare created_at: Date | null;
  declare deleted_at: Date | null;

  declare readonly reviewer?: User;
  declare readonly course?: Course;

  public static associations: {
    reviewer: Association<Review, User>;
    course: Association<Review, Course>;
  };

  public getStars(): string {
    return "⭐".repeat(this.rating || 0);
  }

  public static initModel(sequelize: Sequelize): typeof Review {
    Review.init(
      {
        review_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        course_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        rating: {
          type: DataTypes.INTEGER,
          allowNull: true,
          validate: {
            min: 1,
            max: 5,
          },
        },
        review_text: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW,
        },
        deleted_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: "reviews",
        timestamps: false,
        paranoid: false,
      }
    );
    return Review;
  }

  public static associate(models: any): void {
    Review.belongsTo(models.User, { foreignKey: "user_id", as: "reviewer" });
    Review.belongsTo(models.Course, { foreignKey: "course_id", as: "course" });
  }
}
