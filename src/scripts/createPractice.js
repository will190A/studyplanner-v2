// 用于创建练习的脚本
const mongoose = require('mongoose');
require('dotenv').config();

// 数据库连接
const connectDB = async () => {
  try {
    console.log('正在连接到数据库...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('数据库连接成功');
  } catch (error) {
    console.error('数据库连接失败:', error);
    process.exit(1);
  }
};

// 问题模型
const questionSchema = new mongoose.Schema({
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
  answer: { type: mongoose.Schema.Types.Mixed, required: true },
  explanation: { type: String, required: true },
  tags: [{ type: String }],
}, { timestamps: true });

// 练习模型
const practiceSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['daily', 'category', 'review', 'random']
  },
  questions: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    isCorrect: { type: Boolean, required: true },
    userAnswer: { type: mongoose.Schema.Types.Mixed },
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

const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);
const Practice = mongoose.models.Practice || mongoose.model('Practice', practiceSchema);

// 创建练习
const createPractice = async () => {
  try {
    await connectDB();
    
    // 获取命令行参数
    const args = process.argv.slice(2);
    const userId = args[0] || 'test-user-id'; // 默认用户ID
    const type = args[1] || 'random'; // 默认练习类型
    const category = args[2]; // 可选分类
    
    // 获取题目
    let questions;
    let title;
    
    if (type === 'category' && category) {
      // 分类练习
      questions = await Question.find({ category }).limit(5);
      title = `${category}专项练习`;
    } else {
      // 随机练习
      questions = await Question.aggregate([
        { $sample: { size: 5 } }
      ]);
      title = '随机练习';
    }
    
    if (questions.length === 0) {
      console.error('未找到符合条件的题目');
      process.exit(1);
    }
    
    // 创建练习记录
    const practice = new Practice({
      userId,
      title,
      type: type === 'category' && category ? 'category' : 'random',
      questions: questions.map(q => ({
        questionId: q._id,
        isCorrect: false
      })),
      totalQuestions: questions.length,
      correctCount: 0,
      accuracy: 0,
      timeStarted: new Date(),
      completed: false,
      category: category || undefined
    });
    
    await practice.save();
    
    console.log(`练习创建成功！ID: ${practice._id}`);
    console.log(`标题: ${practice.title}`);
    console.log(`题目数量: ${practice.totalQuestions}`);
    console.log(`题目类别:`);
    
    for (const q of questions) {
      console.log(`- ${q.title} (${q.category}/${q.subcategory || '无'}, ${q.difficulty})`);
    }
    
    console.log('\n访问以下地址开始练习:');
    console.log(`http://localhost:3000/practice/${practice._id}`);
    
    mongoose.disconnect();
    console.log('\n数据库连接已关闭');
  } catch (error) {
    console.error('创建练习失败:', error);
    process.exit(1);
  }
};

// 执行脚本
createPractice(); 