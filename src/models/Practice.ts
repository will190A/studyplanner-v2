import mongoose, { Schema, Document } from 'mongoose';

export interface IPractice extends Document {
  userId: string;
  title: string;
  type: 'daily' | 'category' | 'review' | 'random'; // 每日一练、分类练习、错题复习、随机练习
  questions: {
    questionId: mongoose.Types.ObjectId;
    isCorrect: boolean;
    userAnswer?: string | string[];
    timeSpent?: number; // 单位：秒
  }[];
  totalQuestions: number;
  correctCount: number;
  accuracy: number; // 正确率
  timeStarted: Date;
  timeCompleted?: Date;
  completed: boolean;
  category?: string; // 如果是分类练习，记录分类
  createdAt: Date;
  updatedAt: Date;
}

const PracticeSchema: Schema = new Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['daily', 'category', 'review', 'random']
  },
  questions: [{
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    isCorrect: { type: Boolean, required: true },
    userAnswer: { type: Schema.Types.Mixed },
    timeSpent: { type: Number }
  }],
  totalQuestions: { type: Number, required: true },
  correctCount: { type: Number, required: true },
  accuracy: { type: Number, required: true },
  timeStarted: { type: Date, required: true, default: Date.now },
  timeCompleted: { type: Date },
  completed: { type: Boolean, default: false },
  category: { type: String },
}, { timestamps: true });

export default mongoose.models.Practice || mongoose.model<IPractice>('Practice', PracticeSchema); 