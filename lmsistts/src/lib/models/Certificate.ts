// lmsistts\src\lib\models\Certificate.ts

import { Model, DataTypes, Sequelize, Optional, Association } from "sequelize";
import { User } from "./User";
import { Course } from "./Course";
import { Enrollment } from "./Enrollment";

interface CertificateAttributes {
  certificate_id: number;
  user_id: number | null;
  course_id: number | null;
  enrollment_id: number | null;
  certificate_url: string | null;
  certificate_number: string | null;
  issued_at: Date | null;
  created_at: Date | null;
  deleted_at: Date | null;
}

interface CertificateCreationAttributes
  extends Optional<
    CertificateAttributes,
    | "certificate_id"
    | "user_id"
    | "course_id"
    | "enrollment_id"
    | "certificate_url"
    | "certificate_number"
    | "issued_at"
    | "created_at"
  > {}

export class Certificate
  extends Model<CertificateAttributes, CertificateCreationAttributes>
  implements CertificateAttributes
{
  declare certificate_id: number;
  declare user_id: number | null;
  declare course_id: number | null;
  declare enrollment_id: number | null;
  declare certificate_url: string | null;
  declare certificate_number: string | null;
  declare issued_at: Date | null;
  declare created_at: Date | null;
  declare deleted_at: Date;

  declare readonly student?: User;
  declare readonly course?: Course;
  declare readonly enrollment?: Enrollment;

  public static associations: {
    student: Association<Certificate, User>;
    course: Association<Certificate, Course>;
    enrollment: Association<Certificate, Enrollment>;
  };

  public static initModel(sequelize: Sequelize): typeof Certificate {
    Certificate.init(
      {
        certificate_id: {
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
        enrollment_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        certificate_url: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        certificate_number: {
          type: DataTypes.STRING(100),
          allowNull: true,
          unique: true,
        },
        issued_at: {
          type: DataTypes.DATE,
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
        tableName: "certificates",
        timestamps: false,
        paranoid: true,
      }
    );
    return Certificate;
  }

  public static associate(models: any): void {
    Certificate.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "student",
    });
    Certificate.belongsTo(models.Course, {
      foreignKey: "course_id",
      as: "course",
    });
    Certificate.belongsTo(models.Enrollment, {
      foreignKey: "enrollment_id",
      as: "enrollment",
    });
  }
}
