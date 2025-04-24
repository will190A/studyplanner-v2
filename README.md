
# StudyPlanner - 智能学习助手

StudyPlanner 是一个现代化的学习管理系统，旨在帮助学生更好地规划学习、追踪进度并提高学习效率。通过智能的学习计划管理和练习系统，让学习变得更有条理和效果。

## 🌟 主要功能

### 1. 学习计划管理
- 创建个性化学习计划
- 设置学习目标和时间表
- 追踪学习进度
- 灵活调整计划内容

### 2. 题库练习系统
- 智能题目推荐
- 多样化的题型支持
- 实时练习反馈
- 错题智能归类

### 3. 错题本功能
- 自动记录错题
- 错题分类管理
- 针对性复习建议
- 错题分析报告

### 4. 学习报告分析
- 学习时长统计
- 知识点掌握程度分析
- 学习效率追踪
- 个性化学习建议

## 🛠️ 技术栈

- **前端框架**: Next.js 13, React
- **开发语言**: TypeScript
- **样式方案**: Tailwind CSS
- **数据库**: MongoDB
- **认证系统**: NextAuth.js
- **状态管理**: React Hooks

## 📦 安装使用

### 环境要求
- Node.js 16.0 或更高版本
- MongoDB 数据库
- Git

### 安装步骤

1. 克隆项目

   ```bash
   git clone https://github.com/yourusername/StudyPlanner.git
   cd StudyPlanner
   ```

2. 连接到阿里云服务器，安装 Node.js 、 NPM 、 MongoDB

   ```bash
   # 获取服务器的公网 IP 地址 和 SSH 密钥，使用 SSH 连接到服务器：
   ssh -i /path/to/your/private-key.pem root@<your-server-ip>

   # 安装 Node.js 、 NPM:
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
   source ~/.bashrc
   nvm install 16
   nvm use 16

   # 安装并启动 MongoDB:
   sudo yum install -y mongodb-org
   sudo systemctl start mongod
   sudo systemctl enable mongod
   sudo systemctl status mongod  # 验证 MongoDB 是否正常运行
   ```

3. 配置环境变量

   创建 `.env.local` 文件，添加必要的环境变量：

   ```env
   MONGODB_URI=你的MongoDB连接字符串
   NEXTAUTH_SECRET=你的NextAuth密钥
   NEXTAUTH_URL=http://localhost:3000
   ```

4. 安装依赖

   ```bash
   npm install
   ```

5. 构建 Next.js 项目并启动

   ```bash
   npm run build
   npm run start
   ```

6. 配置防火墙和安全组

   开放必要端口：确保 3000 端口（默认用于 Next.js）和 27017 端口（MongoDB）在服务器的安全组中开放。

7. 访问应用

   打开浏览器访问 `http://<your-server-ip>:3000`

## 📁 项目结构

```
StudyPlanner/
├── src/
│   ├── app/              # 页面组件
│   ├── components/       # 可复用组件
│   ├── lib/              # 工具函数和配置
│   ├── models/           # 数据模型
│   └── styles/           # 样式文件
├── public/               # 静态资源
├── prisma/               # 数据库模式
└── package.json          # 项目配置
```

## ❗ 常见问题

1. **数据库连接失败**
   - 检查 MongoDB 连接字符串是否正确
   - 确保 MongoDB 服务正在运行

2. **启动失败**
   - 确保所有依赖都已正确安装
   - 检查环境变量配置是否完整

3. **认证问题**
   - 验证 NextAuth 配置是否正确
   - 检查环境变量中的认证相关配置

## 📄 开源协议

本项目采用 MIT 协议开源，详见 [LICENSE](LICENSE) 文件。

## 👥 联系方式

如有任何问题或建议，欢迎通过以下方式联系：

- 项目维护者：[武欣宇 吴雁潇 王耀敏]
- 邮箱：[carol.xinyu.wu@outlook.com]
- GitHub Issues: [https://github.com/will190A/StudyPlanner/issues]

## 🙏 致谢

感谢以下开源项目的支持：

- Next.js
- React
- Tailwind CSS
- MongoDB
- NextAuth.js
