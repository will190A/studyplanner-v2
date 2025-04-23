import mongoose, { Schema, Document } from 'mongoose';

export interface IMistake extends Document {
  userId: string;
  questionId: mongoose.Types.ObjectId;
  category: string;
  wrongAnswer: string | string[];
  wrongCount: number;
  lastWrongDate: Date;
  notes?: string;
  status: 'unresolved' | 'reviewing' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}

const MistakeSchema: Schema = new Schema({
  userId: { type: String, required: true },
  questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
  category: { type: String, required: true },
  wrongAnswer: { type: Schema.Types.Mixed, required: true },
  wrongCount: { type: Number, default: 1 },
  lastWrongDate: { type: Date, default: Date.now },
  notes: { type: String },
  status: { 
    type: String, 
    required: true, 
    enum: ['unresolved', 'reviewing', 'resolved'],
    default: 'unresolved'
  },
}, { timestamps: true });

// 创建复合索引，确保每个用户的每个问题只有一个错题记录
MistakeSchema.index({ userId: 1, questionId: 1 }, { unique: true });

export default mongoose.models.Mistake || mongoose.model<IMistake>('Mistake', MistakeSchema); 