# 环境变量配置指南

本项目需要配置以下环境变量来启用所有功能。请在项目根目录创建一个 `.env.local` 文件，并添加以下内容：

```
# 数据库连接URI（必需）
MONGODB_URI=mongodb://localhost:27017/studyplanner

# NextAuth 配置（必需）
NEXTAUTH_SECRET=your_nextauth_secret_key
NEXTAUTH_URL=http://localhost:3000

# Moonshot API 密钥（用于 AI 学习计划生成）
MOONSHOT_API_KEY=your_moonshot_api_key
```

## 获取 Moonshot API 密钥

要启用 AI 学习计划生成功能，你需要：

1. 访问 [Moonshot AI](https://www.moonshot.cn/) 官网
2. 注册账户并获取 API 密钥
3. 将获取到的 API 密钥填入 `.env.local` 文件的 `MOONSHOT_API_KEY` 字段

如果未设置 Moonshot API 密钥，系统将无法生成 AI 学习计划。

## 测试环境变量是否生效

在项目根目录运行以下命令来测试环境变量是否正确加载：

```bash
# 确认 .env.local 文件已被正确加载
npx next-env
```

正确加载的环境变量会在命令运行后显示出来（敏感信息会被隐藏）。 