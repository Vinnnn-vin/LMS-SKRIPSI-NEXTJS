// lmsistts\src\lib\models\Course.ts

import { Model, DataTypes, Sequelize, Optional, Association } from 'sequelize';
import { User } from './User';
import { Category } from './Category';
import { Material } from './Material';
import { Enrollment } from './Enrollment';
import { Review } from './Review';
import { Payment } from './Payment';
import { Certificate } from './Certificate';
import { Quiz } from './Quiz';

interface CourseAttributes {
  course_id: number;
  course_title: string | null;
  course_description: string | null;
  course_level: 'Beginner' | 'Intermediate' | 'Advanced' | null;
  course_price: number | null;
  course_duration: number | null;
  publish_status: number | null;
  user_id: number | null;
  category_id: number | null;
  thumbnail_url: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;

  lecturer?: User;
  category?: Category;
}

interface CourseCreationAttributes extends Optional<CourseAttributes, 'course_id' | 'course_title' | 'course_description' | 'course_level' | 'course_price' | 'course_duration' | 'publish_status' | 'user_id' | 'category_id' | 'thumbnail_url' | 'created_at' | 'updated_at' | 'deleted_at'> {}

export class Course extends Model<CourseAttributes, CourseCreationAttributes> implements CourseAttributes {
  public course_id!: number;
  public course_title!: string | null;
  public course_description!: string | null;
  public course_level!: 'Beginner' | 'Intermediate' | 'Advanced' | null;
  public course_price!: number | null;
  public course_duration!: number | null;
  public publish_status!: number | null;
  public user_id!: number | null;
  public category_id!: number | null;
  public thumbnail_url!: string | null;
  public created_at!: Date | null;
  public updated_at!: Date | null;
  public deleted_at!: Date | null;

  public readonly lecturer?: User;
  public readonly category?: Category;
  public readonly materials?: Material[];
  public readonly enrollments?: Enrollment[];
  public readonly reviews?: Review[];
  public readonly payments?: Payment[];
  public readonly certificates?: Certificate[];
  public readonly quizzes?: Quiz[];

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
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(this.course_price || 0);
  }

  public static initModel(sequelize: Sequelize): typeof Course {
    Course.init(
      {
        course_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        course_title: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        course_description: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        course_level: {
          type: DataTypes.STRING(12),
          allowNull: true,
          validate: {
            isIn: [['Beginner', 'Intermediate', 'Advanced']]
          }
        },
        course_price: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0
        },
        course_duration: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0
        },
        publish_status: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 0
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        category_id: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        thumbnail_url: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: true
        },
        deleted_at: {
          type: DataTypes.DATE,
          allowNull: true
        }
      },
      {
        sequelize,
        tableName: 'courses',
        timestamps: false,
        paranoid: false
      }
    );
    return Course;
  }

  public static associate(models: any): void {
    Course.belongsTo(models.User, { foreignKey: 'user_id', as: 'lecturer' });
    Course.belongsTo(models.Category, { foreignKey: 'category_id', as: 'category' });
    Course.hasMany(models.Material, { foreignKey: 'course_id', as: 'materials' });
    Course.hasMany(models.Enrollment, { foreignKey: 'course_id', as: 'enrollments' });
    Course.hasMany(models.Review, { foreignKey: 'course_id', as: 'reviews' });
    Course.hasMany(models.Payment, { foreignKey: 'course_id', as: 'payments' });
    Course.hasMany(models.Certificate, { foreignKey: 'course_id', as: 'certificates' });
    Course.hasMany(models.Quiz, { foreignKey: 'course_id', as: 'quizzes' });
  }
}