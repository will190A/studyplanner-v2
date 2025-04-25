import mongoose from 'mongoose';

// 在创建新的schema之前，确保删除旧的索引
async function initializeUserCollection() {
  try {
    if (mongoose.connection.readyState === 1) { // 如果数据库已连接
      const db = mongoose.connection.db;
      if (!db) {
        console.error('Database connection is not established');
        return;
      }
      const collections = await db.collections();
      const usersCollection = collections.find(c => c.collectionName === 'users');
      if (usersCollection) {
        await usersCollection.dropIndexes();
      }
    }
  } catch (error) {
    console.error('Error initializing user collection:', error);
  }
}

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// 在模型编译之前初始化集合
if (mongoose.connection.readyState === 1) {
  initializeUserCollection();
}

export const User = mongoose.models.User || mongoose.model('User', userSchema); 