import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomQuestion extends Document {
  userId: string;
  type: 'multiple_choice' | 'fill_blank' | 'short_answer';
  content: string;
  options?: string[];
  answer: string;
  explanation?: string;
  subject: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomQuestionSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['multiple_choice', 'fill_blank', 'short_answer'] 
  },
  content: { type: String, required: true },
  options: [{ type: String }],
  answer: { type: String, required: true },
  explanation: { type: String },
  subject: { type: String, required: true, index: true },
}, { timestamps: true });

// 创建复合索引，确保每个用户的每个题目标题是唯一的
CustomQuestionSchema.index({ userId: 1, content: 1 }, { unique: true });

// 添加删除钩子，在删除题目时同时删除相关的错题记录
CustomQuestionSchema.pre('deleteOne', { document: true }, async function(next) {
  try {
    await mongoose.model('Mistake').deleteMany({
      questionId: this._id,
      isCustom: true
    });
    next();
  } catch (error) {
    next(error as Error);
  }
});

export default mongoose.models.CustomQuestion || 
  mongoose.model<ICustomQuestion>('CustomQuestion', CustomQuestionSchema); 