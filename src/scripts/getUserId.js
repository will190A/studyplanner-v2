// 用于查询用户ID的脚本
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

// 用户模型定义
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

// 查询用户信息
const getUserInfo = async () => {
  try {
    await connectDB();
    
    // 查询所有用户
    const users = await User.find().select('_id name email');
    
    if (users.length === 0) {
      console.log('数据库中没有用户记录');
    } else {
      console.log(`找到 ${users.length} 个用户:`);
      users.forEach(user => {
        console.log(`ID: ${user._id}, 姓名: ${user.name}, 邮箱: ${user.email}`);
      });
    }
    
    mongoose.disconnect();
    console.log('\n数据库连接已关闭');
  } catch (error) {
    console.error('查询用户信息失败:', error);
    process.exit(1);
  }
};

// 执行脚本
getUserInfo(); 