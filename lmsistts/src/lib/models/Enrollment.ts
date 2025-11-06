// lmsistts\src\lib\models\Enrollment.ts

import { Model, DataTypes, Sequelize, Optional, Association } from "sequelize";
import { User } from "./User";
import { Course } from "./Course";
import { Payment } from "./Payment";
import { Certificate } from "./Certificate";
import { AssignmentSubmission } from "./AssignmentSubmission";

interface EnrollmentAttributes {
  enrollment_id: number;
  user_id: number | null;
  course_id: number | null;
  status: "active" | "completed" | "expired" | "cancelled" | null;
  enrolled_at: Date | null;
  learning_started_at: Date | null;
  access_expires_at: Date | null;
  completed_at: Date | null;

  checkpoint_type: "detail" | "quiz" | null;
  checkpoint_id: number | null;
  checkpoint_updated_at: Date | null;

  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
}

interface EnrollmentCreationAttributes
  extends Optional<
    EnrollmentAttributes,
    | "enrollment_id"
    | "user_id"
    | "course_id"
    | "status"
    | "enrolled_at"
    | "learning_started_at"
    | "access_expires_at"
    | "completed_at"
    | "checkpoint_type"
    | "checkpoint_id"
    | "checkpoint_updated_at"
    | "created_at"
    | "updated_at"
    | "deleted_at"
  > {}

export class Enrollment
  extends Model<EnrollmentAttributes, EnrollmentCreationAttributes>
  implements EnrollmentAttributes
{
  declare enrollment_id: number;
  declare user_id: number | null;
  declare course_id: number | null;
  declare status: "active" | "completed" | "expired" | "cancelled" | null;
  declare enrolled_at: Date | null;
  declare learning_started_at: Date | null;
  declare access_expires_at: Date | null;
  declare completed_at: Date | null;

  declare checkpoint_type: "detail" | "quiz" | null;
  declare checkpoint_id: number | null;
  declare checkpoint_updated_at: Date | null;

  declare created_at: Date | null;
  declare updated_at: Date | null;
  declare deleted_at: Date | null;

  declare readonly student?: User;
  declare readonly course?: Course;
  declare readonly payment?: Payment;
  declare readonly certificate?: Certificate;
  declare readonly submissions?: AssignmentSubmission[];

  public static associations: {
    student: Association<Enrollment, User>;
    course: Association<Enrollment, Course>;
    payment: Association<Enrollment, Payment>;
    certificate: Association<Enrollment, Certificate>;
    submissions: Association<Enrollment, AssignmentSubmission>;
  };

  public isActive(): boolean {
    return this.status === "active";
  }

  public isCompleted(): boolean {
    return this.status === "completed";
  }

  public isExpired(): boolean {
    return this.status === "expired";
  }

  public hasStartedLearning(): boolean {
    return this.learning_started_at != null;
  }

  public hasCheckpoint(): boolean {
    return this.checkpoint_id != null && this.checkpoint_type != null;
  }

  public static initModel(sequelize: Sequelize): typeof Enrollment {
    Enrollment.init(
      {
        enrollment_id: {
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
        status: {
          type: DataTypes.STRING(10),
          allowNull: true,
          validate: {
            isIn: [["active", "completed", "expired", "cancelled"]],
          },
        },
        enrolled_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        learning_started_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        access_expires_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        completed_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        checkpoint_type: {
          type: DataTypes.STRING(10),
          allowNull: true,
          validate: {
            isIn: [["detail", "quiz"]],
          },
        },
        checkpoint_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        checkpoint_updated_at: {
          type: DataTypes.DATE,
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
        tableName: "enrollments",
        timestamps: false,
        paranoid: false,
      }
    );
    return Enrollment;
  }

  public static associate(models: any): void {
    Enrollment.belongsTo(models.User, { foreignKey: "user_id", as: "student" });
    Enrollment.belongsTo(models.Course, {
      foreignKey: "course_id",
      as: "course",
    });
    Enrollment.hasOne(models.Payment, {
      foreignKey: "enrollment_id",
      as: "payment",
    });
    Enrollment.hasOne(models.Certificate, {
      foreignKey: "enrollment_id",
      as: "certificate",
    });
    Enrollment.hasMany(models.AssignmentSubmission, {
      foreignKey: "enrollment_id",
      as: "submissions",
    });
  }
}
