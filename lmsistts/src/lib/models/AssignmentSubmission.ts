// lmsistts\src\lib\models\AssignmentSubmission.ts

import { Model, DataTypes, Sequelize, Optional, Association } from 'sequelize';
import { User } from './User';
import { MaterialDetail } from './MaterialDetail';
import { Course } from './Course';
import { Enrollment } from './Enrollment';

interface AssignmentSubmissionAttributes {
  submission_id: number;
  user_id: number;
  material_detail_id: number;
  course_id: number;
  enrollment_id: number;
  submission_type: 'file' | 'url' | 'text';
  file_path: string | null;
  submission_url: string | null;
  submission_text: string | null;
  attempt_number: number | null;
  status: 'pending' | 'submitted' | 'under_review' | 'approved' | 'rejected' | null;
  score: number | null;
  feedback: string | null;
  reviewed_by: number | null;
  submitted_at: Date;
  reviewed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface AssignmentSubmissionCreationAttributes extends Optional<AssignmentSubmissionAttributes, 'submission_id' | 'file_path' | 'submission_url' | 'submission_text' | 'attempt_number' | 'status' | 'score' | 'feedback' | 'reviewed_by' | 'submitted_at' | 'reviewed_at' | 'created_at' | 'updated_at'> {}

export class AssignmentSubmission extends Model<AssignmentSubmissionAttributes, AssignmentSubmissionCreationAttributes> implements AssignmentSubmissionAttributes {
  public submission_id!: number;
  public user_id!: number;
  public material_detail_id!: number;
  public course_id!: number;
  public enrollment_id!: number;
  public submission_type!: 'file' | 'url' | 'text';
  public file_path!: string | null;
  public submission_url!: string | null;
  public submission_text!: string | null;
  public attempt_number!: number | null;
  public status!: 'pending' | 'submitted' | 'under_review' | 'approved' | 'rejected' | null;
  public score!: number | null;
  public feedback!: string | null;
  public reviewed_by!: number | null;
  public submitted_at!: Date;
  public reviewed_at!: Date | null;
  public created_at!: Date;
  public updated_at!: Date;

  public readonly student?: User;
  public readonly assignment?: MaterialDetail;
  public readonly course?: Course;
  public readonly enrollment?: Enrollment;
  public readonly reviewer?: User;

  public static associations: {
    student: Association<AssignmentSubmission, User>;
    assignment: Association<AssignmentSubmission, MaterialDetail>;
    course: Association<AssignmentSubmission, Course>;
    enrollment: Association<AssignmentSubmission, Enrollment>;
    reviewer: Association<AssignmentSubmission, User>;
  };

  public isSubmitted(): boolean {
    return this.status === 'submitted';
  }

  public isUnderReview(): boolean {
    return this.status === 'under_review';
  }

  public isApproved(): boolean {
    return this.status === 'approved';
  }

  public isRejected(): boolean {
    return this.status === 'rejected';
  }

  public isFileSubmission(): boolean {
    return this.submission_type === 'file';
  }

  public isUrlSubmission(): boolean {
    return this.submission_type === 'url';
  }

  public isTextSubmission(): boolean {
    return this.submission_type === 'text';
  }

  public static initModel(sequelize: Sequelize): typeof AssignmentSubmission {
    AssignmentSubmission.init(
      {
        submission_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        material_detail_id: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        course_id: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        enrollment_id: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        submission_type: {
          type: DataTypes.ENUM('file', 'url', 'text'),
          allowNull: false
        },
        file_path: {
          type: DataTypes.STRING(500),
          allowNull: true
        },
        submission_url: {
          type: DataTypes.STRING(500),
          allowNull: true
        },
        submission_text: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        attempt_number: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 1
        },
        status: {
          type: DataTypes.ENUM('pending', 'submitted', 'under_review', 'approved', 'rejected'),
          allowNull: true,
          defaultValue: 'submitted'
        },
        score: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: true
        },
        feedback: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        reviewed_by: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        submitted_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        reviewed_at: {
          type: DataTypes.DATE,
          allowNull: true
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        }
      },
      {
        sequelize,
        tableName: 'assignment_submissions',
        timestamps: false
      }
    );
    return AssignmentSubmission;
  }

  public static associate(models: any): void {
    AssignmentSubmission.belongsTo(models.User, { foreignKey: 'user_id', as: 'student' });
    AssignmentSubmission.belongsTo(models.MaterialDetail, { foreignKey: 'material_detail_id', as: 'assignment' });
    AssignmentSubmission.belongsTo(models.Course, { foreignKey: 'course_id', as: 'course' });
    AssignmentSubmission.belongsTo(models.Enrollment, { foreignKey: 'enrollment_id', as: 'enrollment' });
    AssignmentSubmission.belongsTo(models.User, { foreignKey: 'reviewed_by', as: 'reviewer' });
  }
}
