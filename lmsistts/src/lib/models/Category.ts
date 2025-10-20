// lmsistts\src\lib\models\Category.ts

import { Model, DataTypes, Sequelize, Optional, Association } from 'sequelize';
import { Course } from './Course';

interface CategoryAttributes {
  category_id: number;
  category_name: string | null;
  category_description: string | null;
  image_url: string | null;
  created_at: Date | null;

  courses?: Course[];
}

interface CategoryCreationAttributes extends Optional<CategoryAttributes, 'category_id' | 'category_name' | 'category_description' | 'image_url' | 'created_at'> {}

export class Category extends Model<CategoryAttributes, CategoryCreationAttributes> implements CategoryAttributes {
  declare category_id: number;
  declare category_name: string | null;
  declare category_description: string | null;
  declare image_url: string | null;
  declare created_at: Date | null;

  declare readonly courses?: Course[];

  public static associations: {
    courses: Association<Category, Course>;
  };

  public static initModel(sequelize: Sequelize): typeof Category {
    Category.init(
      {
        category_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        category_name: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        category_description: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        image_url: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: true,
          defaultValue: DataTypes.NOW
        }
      },
      {
        sequelize,
        tableName: 'categories',
        timestamps: false
      }
    );
    return Category;
  }

  public static associate(models: any): void {
    Category.hasMany(models.Course, { foreignKey: 'category_id', as: 'courses' });
  }
}