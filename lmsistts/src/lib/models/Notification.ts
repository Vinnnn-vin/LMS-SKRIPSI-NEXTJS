// lmsistts\src\lib\models\Notification.ts

import { Model, DataTypes, Sequelize, Optional, Association } from "sequelize";
import { User } from "./User";

interface NotificationAttributes {
  notification_id: number;
  user_id: number | null;
  notification_title: string | null;
  notification_message: string | null;
  notification_type: "info" | "success" | "warning" | "error" | null;
  is_read: boolean | null;
  created_at: Date | null;
  deleted_at: Date | null;
}

interface NotificationCreationAttributes
  extends Optional<
    NotificationAttributes,
    | "notification_id"
    | "user_id"
    | "notification_title"
    | "notification_message"
    | "notification_type"
    | "is_read"
    | "created_at"
  > {}

export class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  declare notification_id: number;
  declare user_id: number | null;
  declare notification_title: string | null;
  declare notification_message: string | null;
  declare notification_type: "info" | "success" | "warning" | "error" | null;
  declare is_read: boolean | null;
  declare created_at: Date | null;
  declare deleted_at: Date;

  declare readonly user?: User;

  public static associations: {
    user: Association<Notification, User>;
  };

  public async markAsRead(): Promise<this> {
    this.is_read = true;
    return await this.save();
  }

  public static initModel(sequelize: Sequelize): typeof Notification {
    Notification.init(
      {
        notification_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        notification_title: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        notification_message: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        notification_type: {
          type: DataTypes.STRING(10),
          allowNull: true,
          validate: {
            isIn: [["info", "success", "warning", "error"]],
          },
        },
        is_read: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: false,
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
        tableName: "notifications",
        timestamps: false,
        paranoid: true,
      }
    );
    return Notification;
  }

  public static associate(models: any): void {
    Notification.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
  }
}
