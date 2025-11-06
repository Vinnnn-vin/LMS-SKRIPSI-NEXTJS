// lmsistts\src\lib\models\Payment.ts

import { Model, DataTypes, Sequelize, Optional, Association } from "sequelize";
import { User } from "./User";
import { Course } from "./Course";
import { Enrollment } from "./Enrollment";

interface PaymentAttributes {
  payment_id: number;
  user_id: number | null;
  course_id: number | null;
  enrollment_id: number | null;
  amount: number | null;
  status: "pending" | "paid" | "failed" | "expired" | null;
  gateway_invoice_id: string | null;
  gateway_external_id: string | null;
  payment_method: string | null;
  paid_at: Date | null;
  email_sent: boolean;
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
}

interface PaymentCreationAttributes
  extends Optional<
    PaymentAttributes,
    | "payment_id"
    | "user_id"
    | "course_id"
    | "enrollment_id"
    | "amount"
    | "status"
    | "gateway_invoice_id"
    | "gateway_external_id"
    | "payment_method"
    | "paid_at"
    | "email_sent"
    | "created_at"
    | "updated_at"
    | "deleted_at"
  > {}

export class Payment
  extends Model<PaymentAttributes, PaymentCreationAttributes>
  implements PaymentAttributes
{
  declare payment_id: number;
  declare user_id: number | null;
  declare course_id: number | null;
  declare enrollment_id: number | null;
  declare amount: number | null;
  declare status: "pending" | "paid" | "failed" | "expired" | null;
  declare gateway_invoice_id: string | null;
  declare gateway_external_id: string | null;
  declare payment_method: string | null;
  declare paid_at: Date | null;
  declare email_sent: boolean;
  declare created_at: Date | null;
  declare updated_at: Date | null;
  declare deleted_at: Date | null;

  declare readonly user?: User;
  declare readonly course?: Course;
  declare readonly enrollment?: Enrollment;

  public static associations: {
    user: Association<Payment, User>;
    course: Association<Payment, Course>;
    enrollment: Association<Payment, Enrollment>;
  };

  public isPaid(): boolean {
    return this.status === "paid";
  }

  public isPending(): boolean {
    return this.status === "pending";
  }

  public isFailed(): boolean {
    return this.status === "failed";
  }

  public getFormattedAmount(): string {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(this.amount || 0);
  }

  public static initModel(sequelize: Sequelize): typeof Payment {
    Payment.init(
      {
        payment_id: {
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
        amount: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        status: {
          type: DataTypes.STRING(10),
          allowNull: true,
          validate: {
            isIn: [["pending", "paid", "failed", "expired"]],
          },
        },
        gateway_invoice_id: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        gateway_external_id: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        payment_method: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        paid_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        email_sent: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
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
        tableName: "payments",
        timestamps: false,
        paranoid: false,
      }
    );
    return Payment;
  }

  public static associate(models: any): void {
    Payment.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
    Payment.belongsTo(models.Course, { foreignKey: "course_id", as: "course" });
    Payment.belongsTo(models.Enrollment, {
      foreignKey: "enrollment_id",
      as: "enrollment",
    });
  }
}
