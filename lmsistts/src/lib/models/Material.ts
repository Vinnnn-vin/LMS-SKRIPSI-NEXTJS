// lmsistts\src\lib\models\Material.ts

import { Model, DataTypes, Sequelize, Optional, Association } from 'sequelize';
import { Course } from './Course';
import { MaterialDetail } from './MaterialDetail';
import { Quiz } from './Quiz';

interface MaterialAttributes {
  material_id: number;
  material_name: string | null;
  material_description: string | null;
  course_id: number;
}

interface MaterialCreationAttributes extends Optional<MaterialAttributes, 'material_id' | 'material_name' | 'material_description'> {}

export class Material extends Model<MaterialAttributes, MaterialCreationAttributes> implements MaterialAttributes {
  public material_id!: number;
  public material_name!: string | null;
  public material_description!: string | null;
  public course_id!: number;

  public readonly course?: Course;
  public readonly details?: MaterialDetail[];
  public readonly quizzes?: Quiz[];

  public static associations: {
    course: Association<Material, Course>;
    details: Association<Material, MaterialDetail>;
    quizzes: Association<Material, Quiz>;
  };

  public static initModel(sequelize: Sequelize): typeof Material {
    Material.init(
      {
        material_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        material_name: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        material_description: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        course_id: {
          type: DataTypes.INTEGER,
          allowNull: false
        }
      },
      {
        sequelize,
        tableName: 'material',
        timestamps: false
      }
    );
    return Material;
  }

  public static associate(models: any): void {
    Material.belongsTo(models.Course, { foreignKey: 'course_id', as: 'course' });
    Material.hasMany(models.MaterialDetail, { foreignKey: 'material_id', as: 'details' });
    Material.hasMany(models.Quiz, { foreignKey: 'material_id', as: 'quizzes' });
  }
}