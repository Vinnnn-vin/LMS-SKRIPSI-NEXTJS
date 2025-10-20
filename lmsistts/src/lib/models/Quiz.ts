// lmsistts\src\lib\models\Quiz.ts

import { Model, DataTypes, Sequelize, Optional, Association } from 'sequelize';
import { Material } from './Material';
import { Course } from './Course';
import { QuizQuestion } from './QuizQuestion';
import { StudentQuizAnswer } from './StudentQuizAnswer';

interface QuizAttributes {
  quiz_id: number;
  material_id: number | null;
  course_id: number | null;
  quiz_title: string | null;
  quiz_description: string | null;
  passing_score: number | null;
  time_limit: number | null;
  max_attempts: number | null;
  created_at: Date | null;
  deleted_at: Date | null;
}

interface QuizCreationAttributes extends Optional<QuizAttributes, 'quiz_id' | 'material_id' | 'course_id' | 'quiz_title' | 'quiz_description' | 'passing_score' | 'time_limit' | 'max_attempts' | 'created_at' | 'deleted_at'> {}

export class Quiz extends Model<QuizAttributes, QuizCreationAttributes> implements QuizAttributes {
  declare quiz_id: number;
  declare material_id: number | null;
  declare course_id: number | null;
  declare quiz_title: string | null;
  declare quiz_description: string | null;
  declare passing_score: number | null;
  declare time_limit: number | null;
  declare max_attempts: number | null;
  declare created_at: Date | null;
  declare deleted_at: Date | null;

  declare readonly material?: Material;
  declare readonly course?: Course;
  declare readonly questions?: QuizQuestion[];
  declare readonly studentAnswers?: StudentQuizAnswer[];

  public static associations: {
    material: Association<Quiz, Material>;
    course: Association<Quiz, Course>;
    questions: Association<Quiz, QuizQuestion>;
    studentAnswers: Association<Quiz, StudentQuizAnswer>;
  };

  public static initModel(sequelize: Sequelize): typeof Quiz {
    Quiz.init(
      {
        quiz_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        material_id: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        course_id: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        quiz_title: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        quiz_description: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        passing_score: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        time_limit: {
          type: DataTypes.INTEGER,
          allowNull: true,
          comment: 'in minutes'
        },
        max_attempts: {
          type: DataTypes.INTEGER,
          allowNull: true
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
        tableName: 'quizzes',
        timestamps: false,
        paranoid: false
      }
    );
    return Quiz;
  }

  public static associate(models: any): void {
    Quiz.belongsTo(models.Material, { foreignKey: 'material_id', as: 'material' });
    Quiz.belongsTo(models.Course, { foreignKey: 'course_id', as: 'course' });
    Quiz.hasMany(models.QuizQuestion, { foreignKey: 'quiz_id', as: 'questions' });
    Quiz.hasMany(models.StudentQuizAnswer, { foreignKey: 'quiz_id', as: 'studentAnswers' });
  }
}