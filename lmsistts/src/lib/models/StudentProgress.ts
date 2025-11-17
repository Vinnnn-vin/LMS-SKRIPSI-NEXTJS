// lmsistts\src\lib\models\StudentProgress.ts

import { Model, DataTypes, Sequelize, Optional, Association } from "sequelize";
import { User } from "./User";
import { Course } from "./Course";
import { MaterialDetail } from "./MaterialDetail";

interface StudentProgressAttributes {
  progress_id: number;
  user_id: number;
  course_id: number;
  material_detail_id: number;
  is_completed: boolean;
  completed_at: Date;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

interface StudentProgressCreationAttributes
  extends Optional<
    StudentProgressAttributes,
    | "progress_id"
    | "is_completed"
    | "completed_at"
    | "created_at"
    | "updated_at"
  > {}

export class StudentProgress
  extends Model<StudentProgressAttributes, StudentProgressCreationAttributes>
  implements StudentProgressAttributes
{
  declare progress_id: number;
  declare user_id: number;
  declare course_id: number;
  declare material_detail_id: number;
  declare is_completed: boolean;
  declare completed_at: Date;
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date;

  declare readonly student?: User;
  declare readonly course?: Course;
  declare readonly materialDetail?: MaterialDetail;

  public static associations: {
    student: Association<StudentProgress, User>;
    course: Association<StudentProgress, Course>;
    materialDetail: Association<StudentProgress, MaterialDetail>;
  };

  public static initModel(sequelize: Sequelize): typeof StudentProgress {
    StudentProgress.init(
      {
        progress_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        course_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        material_detail_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        is_completed: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        completed_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        deleted_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: "student_progress",
        timestamps: false,
        paranoid: true,
      }
    );
    return StudentProgress;
  }

  public static associate(models: any): void {
    StudentProgress.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "student",
    });
    StudentProgress.belongsTo(models.Course, {
      foreignKey: "course_id",
      as: "course",
    });
    StudentProgress.belongsTo(models.MaterialDetail, {
      foreignKey: "material_detail_id",
      as: "materialDetail",
    });
  }
}
