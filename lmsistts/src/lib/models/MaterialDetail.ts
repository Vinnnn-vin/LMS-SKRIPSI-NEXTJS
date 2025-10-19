// lmsistts\src\lib\models\MaterialDetail.ts

import { Model, DataTypes, Sequelize, Optional, Association } from 'sequelize';
import { Material } from './Material';
import { AssignmentSubmission } from './AssignmentSubmission';
import { StudentProgress } from './StudentProgress';

interface MaterialDetailAttributes {
  material_detail_id: number;
  material_detail_name: string;
  material_detail_description: string;
  material_detail_type: number;
  materi_detail_url: string;
  material_id: number | null;
  is_free: boolean;
}

interface MaterialDetailCreationAttributes extends Optional<MaterialDetailAttributes, 'material_detail_id' | 'material_id' | 'is_free'> {}

export class MaterialDetail extends Model<MaterialDetailAttributes, MaterialDetailCreationAttributes> implements MaterialDetailAttributes {
  public material_detail_id!: number;
  public material_detail_name!: string;
  public material_detail_description!: string;
  public material_detail_type!: number;
  public materi_detail_url!: string;
  public material_id!: number | null;
  public is_free!: boolean;

  public readonly material?: Material;
  public readonly submissions?: AssignmentSubmission[];
  public readonly progress?: StudentProgress[];

  public static associations: {
    material: Association<MaterialDetail, Material>;
    submissions: Association<MaterialDetail, AssignmentSubmission>;
    progress: Association<MaterialDetail, StudentProgress>;
  };

  public isVideo(): boolean {
    return this.material_detail_type === 1;
  }

  public isPDF(): boolean {
    return this.material_detail_type === 2;
  }

  public isYoutube(): boolean {
    return this.material_detail_type === 3;
  }

  public isAssignment(): boolean {
    return this.material_detail_type === 4;
  }

  public getTypeName(): string {
    const types: { [key: number]: string } = {
      1: 'Video',
      2: 'PDF',
      3: 'Youtube',
      4: 'Assignment'
    };
    return types[this.material_detail_type] || 'Unknown';
  }

  public static initModel(sequelize: Sequelize): typeof MaterialDetail {
    MaterialDetail.init(
      {
        material_detail_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        material_detail_name: {
          type: DataTypes.STRING(255),
          allowNull: false
        },
        material_detail_description: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        material_detail_type: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: '1=video, 2=pdf, 3=youtube, 4=assignment'
        },
        materi_detail_url: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        material_id: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        is_free: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        }
      },
      {
        sequelize,
        tableName: 'material_detail',
        timestamps: false
      }
    );
    return MaterialDetail;
  }

  public static associate(models: any): void {
    MaterialDetail.belongsTo(models.Material, { foreignKey: 'material_id', as: 'material' });
    MaterialDetail.hasMany(models.AssignmentSubmission, { foreignKey: 'material_detail_id', as: 'submissions' });
    MaterialDetail.hasMany(models.StudentProgress, { foreignKey: 'material_detail_id', as: 'progress' });
  }
}