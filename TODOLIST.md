# 大学生自救指南 - 开发计划 (TODOLIST.md)

## 里程碑 M0：项目初始化（当天）
- [x] 初始化 Next.js + TS + Tailwind + ESLint
- [x] 安装 Prisma、NextAuth、MongoDB、UI/动效/表单依赖
- [x] 定义 Prisma Schema（Category/Resource/ResourceStat）
- [x] 提交初始 Git 提交

## 里程碑 M1：基础架构打通（1-2 天）
- [x] `.env.example`、环境变量校验（本地 MongoDB 示例连接，需提供 `NEXTAUTH_SECRET`）
- [x] `src/lib/mongodb.ts`、`src/lib/prisma.ts`
- [x] NextAuth 配置：Credentials Provider + MongoDB Adapter（JWT Session）
- [x] 注册接口 `/api/register`（加密存储密码，首个用户设为 ADMIN）
- [x] 中间件保护 `/admin/*`（基于 token.role）
- [x] Prisma generate（MongoDB 模式，无迁移），构建通过

## 里程碑 M2：页面骨架与导航（1-2 天）
- [x] 全局布局与 Providers（SessionProvider、Toaster）
- [x] `Navbar`（搜索框、登录状态）
- [x] 首页：英雄区 + 热门/最新资料网格（占位）+ 分类入口（链接占位）
- [ ] 资源列表/详情页：未登录拦截 + 详情页服务端保护
- [ ] 搜索页：关键字+分类+排序，分页
- [ ] 分类页：列表筛选

## 里程碑 M3：管理员后台（2-3 天）
- [ ] 后台首页仪表盘（计数、趋势占位）
- [ ] 分类管理：列表、创建、编辑、启用/禁用、排序
- [ ] 资料管理：列表、创建、编辑（封面 URL、简介、标签、分类、公开）
- [ ] 基础表单校验（zod + RHF）

## 里程碑 M4：用户体验与动效（1-2 天）
- [ ] 卡片悬浮/进入动效、页面转场
- [ ] 骨架屏、懒加载、加载占位
- [ ] 移动端适配与响应式优化

## 里程碑 M5：质量与部署（1 天）
- [ ] 脚本：lint、typecheck、build
- [ ] README：部署指南（PM2/Nginx/环境变量）
- [ ] 预备监控与日志（基础 log 与错误页）

## 风险/依赖
- MongoDB 连接与权限需提前准备（`DATABASE_URL`）
- 第三方登录需申请 AppId/Secret（后续迭代）

## 提交规范
- feat/fix/chore/docs/style/refactor/perf/test + 简要描述
- 每个里程碑结束前确保 `npm run build` 通过
