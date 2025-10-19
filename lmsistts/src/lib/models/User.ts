// lmsistts\src\lib\models\User.ts

import { Model, DataTypes, Sequelize, Optional, Association } from 'sequelize';
import { Course } from './Course';
import { Enrollment } from './Enrollment';
import { Payment } from './Payment';
import { Review } from './Review';
import { Certificate } from './Certificate';
import { AssignmentSubmission } from './AssignmentSubmission';
import { StudentProgress } from './StudentProgress';
import { StudentQuizAnswer } from './StudentQuizAnswer';

interface UserAttributes {
  user_id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  password_hash: string | null;
  role: 'admin' | 'lecturer' | 'student' | null;
  created_at: Date | null;
  deleted_at: Date | null;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'user_id' | 'first_name' | 'last_name' | 'email' | 'password_hash' | 'role' | 'created_at' | 'deleted_at'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public user_id!: number;
  public first_name!: string | null;
  public last_name!: string | null;
  public email!: string | null;
  public password_hash!: string | null;
  public role!: 'admin' | 'lecturer' | 'student' | null;
  public created_at!: Date | null;
  public deleted_at!: Date | null;

  // Associations
  public readonly courses?: Course[];
  public readonly enrollments?: Enrollment[];
  public readonly payments?: Payment[];
  public readonly reviews?: Review[];
  public readonly certificates?: Certificate[];
  public readonly submissions?: AssignmentSubmission[];
  public readonly progress?: StudentProgress[];
  public readonly quizAnswers?: StudentQuizAnswer[];

  public static associations: {
    courses: Association<User, Course>;
    enrollments: Association<User, Enrollment>;
    payments: Association<User, Payment>;
    reviews: Association<User, Review>;
    certificates: Association<User, Certificate>;
    submissions: Association<User, AssignmentSubmission>;
    progress: Association<User, StudentProgress>;
    quizAnswers: Association<User, StudentQuizAnswer>;
  };

  // Instance Methods
  public getFullName(): string {
    return `${this.first_name || ''} ${this.last_name || ''}`.trim();
  }

  public isAdmin(): boolean {
    return this.role === 'admin';
  }

  public isLecturer(): boolean {
    return this.role === 'lecturer';
  }

  public isStudent(): boolean {
    return this.role === 'student';
  }

  public static initModel(sequelize: Sequelize): typeof User {
    User.init(
      {
        user_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        first_name: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        last_name: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: true,
          unique: true,
          validate: {
            isEmail: true
          }
        },
        password_hash: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        role: {
          type: DataTypes.STRING(10),
          allowNull: true,
          validate: {
            isIn: [['admin', 'lecturer', 'student']]
          }
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW
        },
        deleted_at: {
          type: DataTypes.DATE,
          allowNull: true
        }
      },
      {
        sequelize,
        tableName: 'users',
        timestamps: false,
        paranoid: false
      }
    );
    return User;
  }

  public static associate(models: any): void {
    User.hasMany(models.Course, { foreignKey: 'user_id', as: 'courses' });
    User.hasMany(models.Enrollment, { foreignKey: 'user_id', as: 'enrollments' });
    User.hasMany(models.Payment, { foreignKey: 'user_id', as: 'payments' });
    User.hasMany(models.Review, { foreignKey: 'user_id', as: 'reviews' });
    User.hasMany(models.Certificate, { foreignKey: 'user_id', as: 'certificates' });
    User.hasMany(models.AssignmentSubmission, { foreignKey: 'user_id', as: 'submissions' });
    User.hasMany(models.StudentProgress, { foreignKey: 'user_id', as: 'progress' });
    User.hasMany(models.StudentQuizAnswer, { foreignKey: 'user_id', as: 'quizAnswers' });
  }
}
