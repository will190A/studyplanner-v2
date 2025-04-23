// 用于向数据库添加示例题目的种子脚本
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

// 问题模型定义
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

const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);

// 示例题目数据
const sampleQuestions = [
  // 数据结构题目
  {
    title: "二叉树深度优先遍历",
    content: "下列哪种遍历方式属于二叉树的深度优先遍历？",
    type: "multiple",
    category: "数据结构",
    subcategory: "树",
    difficulty: "easy",
    options: [
      { label: "A", text: "前序遍历" },
      { label: "B", text: "中序遍历" },
      { label: "C", text: "后序遍历" },
      { label: "D", text: "层序遍历" }
    ],
    answer: ["A", "B", "C"],
    explanation: "深度优先遍历包括前序遍历、中序遍历和后序遍历。层序遍历是广度优先遍历。",
    tags: ["二叉树", "遍历"]
  },
  {
    title: "栈的特点",
    content: "关于栈的特点，下列说法正确的是：",
    type: "choice",
    category: "数据结构",
    subcategory: "栈",
    difficulty: "easy",
    options: [
      { label: "A", text: "先进先出" },
      { label: "B", text: "后进先出" },
      { label: "C", text: "可以随机访问任意元素" },
      { label: "D", text: "插入和删除操作都可以在任意位置进行" }
    ],
    answer: "B",
    explanation: "栈是一种后进先出(LIFO)的数据结构，只能在栈顶进行插入和删除操作。",
    tags: ["栈", "LIFO"]
  },
  
  // 算法题目
  {
    title: "排序算法稳定性",
    content: "下列排序算法中，哪些是稳定的排序算法？",
    type: "multiple",
    category: "算法",
    subcategory: "排序",
    difficulty: "medium",
    options: [
      { label: "A", text: "冒泡排序" },
      { label: "B", text: "快速排序" },
      { label: "C", text: "归并排序" },
      { label: "D", text: "选择排序" }
    ],
    answer: ["A", "C"],
    explanation: "冒泡排序和归并排序是稳定的排序算法，而快速排序和选择排序是不稳定的排序算法。",
    tags: ["排序算法", "稳定性"]
  },
  {
    title: "动态规划问题",
    content: "下列哪些问题适合用动态规划解决？",
    type: "multiple",
    category: "算法",
    subcategory: "动态规划",
    difficulty: "hard",
    options: [
      { label: "A", text: "背包问题" },
      { label: "B", text: "最长公共子序列" },
      { label: "C", text: "深度优先搜索" },
      { label: "D", text: "最短路径问题" }
    ],
    answer: ["A", "B", "D"],
    explanation: "背包问题、最长公共子序列和最短路径问题都可以用动态规划解决。深度优先搜索是一种图搜索算法，不属于动态规划问题。",
    tags: ["动态规划", "优化"]
  },
  
  // 计算机网络题目
  {
    title: "TCP三次握手",
    content: "TCP三次握手的正确顺序是：",
    type: "choice",
    category: "计算机网络",
    subcategory: "TCP/IP",
    difficulty: "medium",
    options: [
      { label: "A", text: "SYN -> SYN-ACK -> ACK" },
      { label: "B", text: "ACK -> SYN -> SYN-ACK" },
      { label: "C", text: "SYN -> ACK -> SYN-ACK" },
      { label: "D", text: "SYN-ACK -> SYN -> ACK" }
    ],
    answer: "A",
    explanation: "TCP三次握手的正确顺序是：客户端发送SYN，服务器响应SYN-ACK，客户端发送ACK。",
    tags: ["TCP", "连接建立"]
  },
  {
    title: "HTTP状态码",
    content: "以下HTTP状态码中，哪个表示资源未找到？",
    type: "choice",
    category: "计算机网络",
    subcategory: "HTTP",
    difficulty: "easy",
    options: [
      { label: "A", text: "200" },
      { label: "B", text: "301" },
      { label: "C", text: "404" },
      { label: "D", text: "500" }
    ],
    answer: "C",
    explanation: "404状态码表示请求的资源未找到，200表示成功，301表示永久重定向，500表示服务器内部错误。",
    tags: ["HTTP", "状态码"]
  },
  
  // 操作系统题目
  {
    title: "进程与线程",
    content: "关于进程与线程的描述，正确的是：",
    type: "choice",
    category: "操作系统",
    subcategory: "进程管理",
    difficulty: "medium",
    options: [
      { label: "A", text: "线程是程序的执行单位，进程是资源分配的单位" },
      { label: "B", text: "进程是程序的执行单位，线程是资源分配的单位" },
      { label: "C", text: "一个进程只能包含一个线程" },
      { label: "D", text: "线程之间不能共享内存空间" }
    ],
    answer: "A",
    explanation: "线程是CPU调度和程序执行的基本单位，而进程是资源分配的基本单位。一个进程可以包含多个线程，同一进程中的线程共享该进程的内存空间。",
    tags: ["进程", "线程", "调度"]
  },
  {
    title: "死锁条件",
    content: "产生死锁的必要条件不包括：",
    type: "choice",
    category: "操作系统",
    subcategory: "同步互斥",
    difficulty: "hard",
    options: [
      { label: "A", text: "互斥条件" },
      { label: "B", text: "请求与保持条件" },
      { label: "C", text: "非抢占条件" },
      { label: "D", text: "资源充足条件" }
    ],
    answer: "D",
    explanation: "产生死锁的四个必要条件是：互斥条件、请求与保持条件、非抢占条件和循环等待条件。资源充足条件不是产生死锁的条件，相反，资源不足往往是导致死锁的原因之一。",
    tags: ["死锁", "资源分配"]
  },
  
  // 编程语言题目
  {
    title: "Java中的final关键字",
    content: "在Java中，final关键字可以用于：",
    type: "multiple",
    category: "编程语言",
    subcategory: "Java",
    difficulty: "medium",
    options: [
      { label: "A", text: "修饰类，表示该类不能被继承" },
      { label: "B", text: "修饰方法，表示该方法不能被重写" },
      { label: "C", text: "修饰变量，表示该变量只能被赋值一次" },
      { label: "D", text: "修饰参数，表示参数在方法内可以被修改" }
    ],
    answer: ["A", "B", "C"],
    explanation: "在Java中，final关键字可以用于修饰类(不能被继承)、方法(不能被重写)和变量(只能被赋值一次)。final修饰的参数在方法内不能被修改，而不是可以被修改。",
    tags: ["Java", "关键字", "继承"]
  },
  {
    title: "Python列表推导式",
    content: "下面哪个是正确的Python列表推导式，用于生成1到10的平方列表？",
    type: "choice",
    category: "编程语言",
    subcategory: "Python",
    difficulty: "easy",
    options: [
      { label: "A", text: "[x^2 for x in range(1, 11)]" },
      { label: "B", text: "[x*x for x in range(1, 11)]" },
      { label: "C", text: "[for x in range(1, 11): x*x]" },
      { label: "D", text: "[x*x in range(1, 11)]" }
    ],
    answer: "B",
    explanation: "正确的Python列表推导式语法是[表达式 for 变量 in 可迭代对象]，所以选项B是正确的。注意在Python中，^不表示幂运算，而是按位异或运算，幂运算应该使用**。",
    tags: ["Python", "列表推导式"]
  },
  
  // 数据库题目
  {
    title: "SQL索引的作用",
    content: "关于数据库索引，以下说法正确的是：",
    type: "multiple",
    category: "数据库",
    subcategory: "索引",
    difficulty: "medium",
    options: [
      { label: "A", text: "索引可以加快数据检索速度" },
      { label: "B", text: "索引会减慢数据插入、更新和删除的速度" },
      { label: "C", text: "索引不占用额外的存储空间" },
      { label: "D", text: "聚集索引决定了表中数据的物理顺序" }
    ],
    answer: ["A", "B", "D"],
    explanation: "索引的优点是可以加快数据检索速度，缺点是会减慢数据更新速度并占用额外的存储空间。聚集索引确实决定了表中数据的物理排列顺序。",
    tags: ["SQL", "索引", "性能优化"]
  },
  {
    title: "事务的ACID特性",
    content: "数据库事务的ACID特性不包括：",
    type: "choice",
    category: "数据库",
    subcategory: "事务",
    difficulty: "medium",
    options: [
      { label: "A", text: "原子性(Atomicity)" },
      { label: "B", text: "一致性(Consistency)" },
      { label: "C", text: "独立性(Independence)" },
      { label: "D", text: "持久性(Durability)" }
    ],
    answer: "C",
    explanation: "数据库事务的ACID特性包括：原子性(Atomicity)、一致性(Consistency)、隔离性(Isolation)和持久性(Durability)，不包括'独立性(Independence)'，选项C中的'独立性'应该是'隔离性'。",
    tags: ["数据库", "事务", "ACID"]
  }
];

// 添加题目到数据库
const seedQuestions = async () => {
  try {
    await connectDB();
    
    // 先清空已有题目（可选）
    // await Question.deleteMany({});
    
    // 检查是否已存在题目
    const count = await Question.countDocuments();
    if (count > 0) {
      console.log(`数据库中已有 ${count} 题，跳过添加`);
      process.exit(0);
    }
    
    // 添加示例题目
    console.log('正在添加示例题目...');
    await Question.insertMany(sampleQuestions);
    console.log(`成功添加了 ${sampleQuestions.length} 道题目`);
    
    mongoose.disconnect();
    console.log('数据库连接已关闭');
  } catch (error) {
    console.error('添加题目失败:', error);
    process.exit(1);
  }
};

// 执行种子脚本
seedQuestions(); 