// lmsistts\src\lib\models\index.ts
import { sequelize } from '../db';

// Import semua models
import { User } from './User';
import { Category } from './Category';
import { Course } from './Course';
import { Material } from './Material';
import { MaterialDetail } from './MaterialDetail';
import { Enrollment } from './Enrollment';
import { Payment } from './Payment';
import { Quiz } from './Quiz';
import { QuizQuestion } from './QuizQuestion';
import { QuizAnswerOption } from './QuizAnswerOption';
import { StudentQuizAnswer } from './StudentQuizAnswer';
import { AssignmentSubmission } from './AssignmentSubmission';
import { StudentProgress } from './StudentProgress';
import { Review } from './Review';
import { Certificate } from './Certificate';
import { Notification } from './Notification';

// Initialize all models dengan sequelize instance dari db.ts
const models = {
  User: User.initModel(sequelize),
  Category: Category.initModel(sequelize),
  Course: Course.initModel(sequelize),
  Material: Material.initModel(sequelize),
  MaterialDetail: MaterialDetail.initModel(sequelize),
  Enrollment: Enrollment.initModel(sequelize),
  Payment: Payment.initModel(sequelize),
  Quiz: Quiz.initModel(sequelize),
  QuizQuestion: QuizQuestion.initModel(sequelize),
  QuizAnswerOption: QuizAnswerOption.initModel(sequelize),
  StudentQuizAnswer: StudentQuizAnswer.initModel(sequelize),
  AssignmentSubmission: AssignmentSubmission.initModel(sequelize),
  StudentProgress: StudentProgress.initModel(sequelize),
  Review: Review.initModel(sequelize),
  Certificate: Certificate.initModel(sequelize),
  Notification: Notification.initModel(sequelize)
};

// Setup associations untuk semua models
Object.values(models).forEach((model: any) => {
  if (model.associate) {
    model.associate(models);
  }
});

// Export individual models
export {
  User,
  Category,
  Course,
  Material,
  MaterialDetail,
  Enrollment,
  Payment,
  Quiz,
  QuizQuestion,
  QuizAnswerOption,
  StudentQuizAnswer,
  AssignmentSubmission,
  StudentProgress,
  Review,
  Certificate,
  Notification,
  sequelize // Export sequelize untuk digunakan di tempat lain
};

// Export models object
export default models;

// ============================================
// CARA PENGGUNAAN
// ============================================

/*
// 1. Import individual model (RECOMMENDED)
import { User, Course, sequelize } from './models';

const getUsers = async () => {
  const users = await User.findAll();
  return users;
};

// 2. Import semua models sekaligus
import models from './models';

const getCourse = async (id: number) => {
  const course = await models.Course.findByPk(id);
  return course;
};

// 3. Import sequelize untuk transactions
import { sequelize } from './models';

const createEnrollment = async () => {
  const t = await sequelize.transaction();
  try {
    // ... transaction logic
    await t.commit();
  } catch (error) {
    await t.rollback();
  }
};
*/