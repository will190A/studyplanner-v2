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
  isCustom: boolean;
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
  isCustom: { type: Boolean, required: true, default: false },
}, { timestamps: true });

// 删除旧的索引
MistakeSchema.index({ userId: 1, questionId: 1 }, { unique: false, sparse: true });

// 创建新的复合索引，确保每个用户的每个题目（区分标准题和自定义题）只有一条错题记录
MistakeSchema.index({ userId: 1, questionId: 1, isCustom: 1 }, { unique: true });

// 获取模型实例
const MistakeModel = mongoose.models.Mistake || mongoose.model<IMistake>('Mistake', MistakeSchema);

// 确保索引被正确创建
MistakeModel.syncIndexes();

export default MistakeModel; 