// lmsistts\src\lib\models\QuizAnswerOption.ts

import { Model, DataTypes, Sequelize, Optional, Association } from "sequelize";
import { Quiz } from "./Quiz";
import { QuizQuestion } from "./QuizQuestion";

interface QuizAnswerOptionAttributes {
  option_id: number;
  quiz_id: number | null;
  question_id: number | null;
  option_text: string | null;
  is_correct: boolean | null;
  deleted_at: Date | null;
}

interface QuizAnswerOptionCreationAttributes
  extends Optional<
    QuizAnswerOptionAttributes,
    "option_id" | "quiz_id" | "question_id" | "option_text" | "is_correct"
  > {}

export class QuizAnswerOption
  extends Model<QuizAnswerOptionAttributes, QuizAnswerOptionCreationAttributes>
  implements QuizAnswerOptionAttributes
{
  declare option_id: number;
  declare quiz_id: number | null;
  declare question_id: number | null;
  declare option_text: string | null;
  declare is_correct: boolean | null;
  declare deleted_at: Date;

  declare readonly quiz?: Quiz;
  declare readonly question?: QuizQuestion;

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
          autoIncrement: true,
        },
        quiz_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        question_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        option_text: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        is_correct: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: false,
        },
        deleted_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: "quiz_answer_options",
        timestamps: false,
        paranoid: true,
      }
    );
    return QuizAnswerOption;
  }

  public static associate(models: any): void {
    QuizAnswerOption.belongsTo(models.Quiz, {
      foreignKey: "quiz_id",
      as: "quiz",
    });
    QuizAnswerOption.belongsTo(models.QuizQuestion, {
      foreignKey: "question_id",
      as: "question",
    });
  }
}
