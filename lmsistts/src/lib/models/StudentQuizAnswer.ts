// lmsistts\src\lib\models\StudentQuizAnswer.ts

import { Model, DataTypes, Sequelize, Optional, Association } from 'sequelize';
import { User } from './User';
import { Quiz } from './Quiz';
import { QuizQuestion } from './QuizQuestion';
import { Course } from './Course';

interface StudentQuizAnswerAttributes {
  answer_id: number;
  user_id: number;
  quiz_id: number;
  course_id: number;
  question_id: number | null;
  selected_option_id: number | null;
  answer_text: string | null;
  is_correct: boolean | null;
  attempt_session: number | null;
  score: number | null;
  status: 'passed' | 'failed' | 'pending' | null;
  answered_at: Date | null;
  completed_at: Date | null;
}

interface StudentQuizAnswerCreationAttributes extends Optional<StudentQuizAnswerAttributes, 'answer_id' | 'question_id' | 'selected_option_id' | 'answer_text' | 'is_correct' | 'attempt_session' | 'score' | 'status' | 'answered_at' | 'completed_at'> {}

export class StudentQuizAnswer extends Model<StudentQuizAnswerAttributes, StudentQuizAnswerCreationAttributes> implements StudentQuizAnswerAttributes {
  public answer_id!: number;
  public user_id!: number;
  public quiz_id!: number;
  public course_id!: number;
  public question_id!: number | null;
  public selected_option_id!: number | null;
  public answer_text!: string | null;
  public is_correct!: boolean | null;
  public attempt_session!: number | null;
  public score!: number | null;
  public status!: 'passed' | 'failed' | 'pending' | null;
  public answered_at!: Date | null;
  public completed_at!: Date | null;

  public readonly student?: User;
  public readonly quiz?: Quiz;
  public readonly question?: QuizQuestion;
  public readonly course?: Course;

  public static associations: {
    student: Association<StudentQuizAnswer, User>;
    quiz: Association<StudentQuizAnswer, Quiz>;
    question: Association<StudentQuizAnswer, QuizQuestion>;
    course: Association<StudentQuizAnswer, Course>;
  };

  public isPassed(): boolean {
    return this.status === 'passed';
  }

  public isFailed(): boolean {
    return this.status === 'failed';
  }

  public static initModel(sequelize: Sequelize): typeof StudentQuizAnswer {
    StudentQuizAnswer.init(
      {
        answer_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        quiz_id: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        course_id: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        question_id: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        selected_option_id: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        answer_text: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        is_correct: {
          type: DataTypes.BOOLEAN,
          allowNull: true
        },
        attempt_session: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        score: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        status: {
          type: DataTypes.STRING(12),
          allowNull: true,
          validate: {
            isIn: [['passed', 'failed', 'pending']]
          }
        },
        answered_at: {
          type: DataTypes.DATE,
          allowNull: true
        },
        completed_at: {
          type: DataTypes.DATE,
          allowNull: true
        }
      },
      {
        sequelize,
        tableName: 'student_quiz_answers',
        timestamps: false
      }
    );
    return StudentQuizAnswer;
  }

  public static associate(models: any): void {
    StudentQuizAnswer.belongsTo(models.User, { foreignKey: 'user_id', as: 'student' });
    StudentQuizAnswer.belongsTo(models.Quiz, { foreignKey: 'quiz_id', as: 'quiz' });
    StudentQuizAnswer.belongsTo(models.QuizQuestion, { foreignKey: 'question_id', as: 'question' });
    StudentQuizAnswer.belongsTo(models.Course, { foreignKey: 'course_id', as: 'course' });
  }
}