// lmsistts\src\lib\models\QuizQuestion.ts

import { Model, DataTypes, Sequelize, Optional, Association } from 'sequelize';
import { Quiz } from './Quiz';
import { QuizAnswerOption } from './QuizAnswerOption';
import { StudentQuizAnswer } from './StudentQuizAnswer';

interface QuizQuestionAttributes {
  question_id: number;
  quiz_id: number | null;
  question_text: string | null;
  question_type: 'multiple_choice' | 'checkbox' | 'essay' | null;
  created_at: Date | null;
}

interface QuizQuestionCreationAttributes extends Optional<QuizQuestionAttributes, 'question_id' | 'quiz_id' | 'question_text' | 'question_type' | 'created_at'> {}

export class QuizQuestion extends Model<QuizQuestionAttributes, QuizQuestionCreationAttributes> implements QuizQuestionAttributes {
  public question_id!: number;
  public quiz_id!: number | null;
  public question_text!: string | null;
  public question_type!: 'multiple_choice' | 'checkbox' | 'essay' | null;
  public created_at!: Date | null;

  public readonly quiz?: Quiz;
  public readonly options?: QuizAnswerOption[];
  public readonly studentAnswers?: StudentQuizAnswer[];

  public static associations: {
    quiz: Association<QuizQuestion, Quiz>;
    options: Association<QuizQuestion, QuizAnswerOption>;
    studentAnswers: Association<QuizQuestion, StudentQuizAnswer>;
  };

  public isMultipleChoice(): boolean {
    return this.question_type === 'multiple_choice';
  }

  public isCheckbox(): boolean {
    return this.question_type === 'checkbox';
  }

  public isEssay(): boolean {
    return this.question_type === 'essay';
  }

  public static initModel(sequelize: Sequelize): typeof QuizQuestion {
    QuizQuestion.init(
      {
        question_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        quiz_id: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        question_text: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        question_type: {
          type: DataTypes.STRING(15),
          allowNull: true,
          validate: {
            isIn: [['multiple_choice', 'checkbox', 'essay']]
          }
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW
        }
      },
      {
        sequelize,
        tableName: 'quiz_questions',
        timestamps: false
      }
    );
    return QuizQuestion;
  }

  public static associate(models: any): void {
    QuizQuestion.belongsTo(models.Quiz, { foreignKey: 'quiz_id', as: 'quiz' });
    QuizQuestion.hasMany(models.QuizAnswerOption, { foreignKey: 'question_id', as: 'options' });
    QuizQuestion.hasMany(models.StudentQuizAnswer, { foreignKey: 'question_id', as: 'studentAnswers' });
  }
}