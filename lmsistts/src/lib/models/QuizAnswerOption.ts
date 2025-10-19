// lmsistts\src\lib\models\QuizAnswerOption.ts

import { Model, DataTypes, Sequelize, Optional, Association } from 'sequelize';
import { Quiz } from './Quiz';
import { QuizQuestion } from './QuizQuestion';

interface QuizAnswerOptionAttributes {
  option_id: number;
  quiz_id: number | null;
  question_id: number | null;
  option_text: string | null;
  is_correct: boolean | null;
}

interface QuizAnswerOptionCreationAttributes extends Optional<QuizAnswerOptionAttributes, 'option_id' | 'quiz_id' | 'question_id' | 'option_text' | 'is_correct'> {}

export class QuizAnswerOption extends Model<QuizAnswerOptionAttributes, QuizAnswerOptionCreationAttributes> implements QuizAnswerOptionAttributes {
  public option_id!: number;
  public quiz_id!: number | null;
  public question_id!: number | null;
  public option_text!: string | null;
  public is_correct!: boolean | null;

  public readonly quiz?: Quiz;
  public readonly question?: QuizQuestion;

  public static associations: {
    quiz: Association<QuizAnswerOption, Quiz>;
    question: Association<QuizAnswerOption, QuizQuestion>;
  };

  public static initModel(sequelize: Sequelize): typeof QuizAnswerOption {
    QuizAnswerOption.init(
      {
        option_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        quiz_id: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        question_id: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        option_text: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        is_correct: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: false
        }
      },
      {
        sequelize,
        tableName: 'quiz_answer_options',
        timestamps: false
      }
    );
    return QuizAnswerOption;
  }

  public static associate(models: any): void {
    QuizAnswerOption.belongsTo(models.Quiz, { foreignKey: 'quiz_id', as: 'quiz' });
    QuizAnswerOption.belongsTo(models.QuizQuestion, { foreignKey: 'question_id', as: 'question' });
  }
}