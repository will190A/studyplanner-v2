import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion extends Document {
  title: string;
  content: string;
  type: 'choice' | 'multiple' | 'judge' | 'fill' | 'code'; // 单选、多选、判断、填空、编程
  category: string; // 例如：数据结构、算法分析、计算机网络等
  subcategory?: string; // 例如：树、排序等
  difficulty: 'easy' | 'medium' | 'hard';
  options?: { label: string; text: string }[]; // 选择题的选项
  answer: string | string[]; // 答案，可能是单个值或数组
  explanation: string; // 解析
  tags?: string[]; // 标签
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema: Schema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['choice', 'multiple', 'judge', 'fill', 'code'] 
  },
  category: { type: String, required: true },
  subcategory: { type: String },
  difficulty: { 
    type: String, 
    required: true, 
    enum: ['easy', 'medium', 'hard'] 
  },
  options: [{ 
    label: { type: String, required: true }, 
    text: { type: String, required: true } 
  }],
  answer: { type: Schema.Types.Mixed, required: true },
  explanation: { type: String, required: true },
  tags: [{ type: String }],
}, { timestamps: true });

// 如果模型已存在则复用，否则创建新模型
export default mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema); 