# CHANGELOG

## 0.1.0 - 初始化与基础架构搭建（M0）
- 初始化 Next.js 15 + TypeScript + Tailwind v4 + ESLint 项目骨架
- 安装与配置依赖：Prisma、NextAuth、MongoDB、zod、bcryptjs、RHF、Framer Motion、lucide-react、react-hot-toast
- 定义 Prisma（MongoDB）数据模型：`Category`、`Resource`、`ResourceStat`
- 认证与接口：NextAuth（Credentials + MongoDB Adapter）、注册接口 `/api/register`（首用户自动 ADMIN）
- 架构文件：`src/lib/mongodb.ts`、`src/lib/prisma.ts`、`src/lib/validators.ts`、`src/types/next-auth.d.ts`
- 中间件保护：`/admin/*` 需 ADMIN（基于 JWT 中的 role）
- UI/页面：全局 Providers、`Navbar`、首页、登录页、注册页、管理员占位页
- 文档：新增 `DESIGN.md`、`TODOLIST.md`、`.env.example`
- 构建通过：`npm run build` 绿色

变更影响：
- 提供可运行的基础骨架与登录/注册闭环（需 MongoDB 实例可用），为后续搜索、分类、资料详情与后台管理打下基础。
