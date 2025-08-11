# 大学生自救指南 - 系统设计文档 (DESIGN.md)

## 1. 产品背景与目标
- 核心定位：面向大学生的高质量学习资料分享与检索平台，聚焦“快速找到、可信链接、便捷获取”。
- 目标：
  - 高效：强搜索与清晰分类，3 次点击内到达目标资料。
  - 安全：登录后访问详情页与外链（夸克网盘），权限清晰可控。
  - 易用：美观大气、动效顺滑、移动端友好。
  - 可运营：管理员后台可管理资料、分类、用户与数据统计。

## 2. 用户画像
- 普通用户：本科/研究生，关注课程资料、考证资料、竞赛/实习资料；偏好移动端。
- 贡献者：愿意上传/投稿的同学/工作室。
- 管理员：平台维护者，进行内容审核、分类管理、数据观察。

## 3. 核心需求与优化
- 首页：
  - Banner/主题标语；热门/最新资料推荐；分类入口；搜索框。
  - 首页首屏动效（Framer Motion），卡片悬浮/进入动画。
- 注册/登录：
  - 邮箱+密码、后续可扩展第三方（微信/QQ/微博等）。
  - 登录状态展示、退出登录、未登录点击资料卡时弹出登录提示。
- 搜索：
  - 关键字搜索（标题、描述、标签），按分类过滤，按“最新/热门”排序。
- 学习资料：
  - 以卡片网格展示封面、标题、标签、热度。
  - 点开详情（登录后可访问）显示：摘要、分类、标签、数据统计、夸克网盘链接（新开/复制）。
- 分类菜单：
  - 多级分类（学科、考试类型等），支持排序与启用/禁用。
- 管理后台：
  - 分类管理：增删改、排序、启用/禁用、层级结构。
  - 资料管理：增删改、封面图片 URL、富文本简介、关联分类/标签、公开/隐藏。
  - 数据看板：资料数量、分类数量、浏览/点击趋势（基础统计）。
  - 用户管理：封禁、设置管理员（仅超级管理员）。
- 非功能需求：
  - 安全：基于 Session/JWT 的鉴权，后台路由中间件保护；输入校验、速率限制（预留）。
  - 性能：SSR + 动态/静态结合；图片优化；缓存与分页；渐进式渲染。
  - 可运维：错误日志、健康检查、可观测性（预留埋点）。
  - 易部署：国内云服务器（Node 20+），MongoDB Atlas/云数据库；Nginx/PM2。

## 4. 技术架构
- 前端：Next.js 15 App Router + TypeScript + TailwindCSS v4 + Framer Motion + React Hook Form + zod。
- 认证：NextAuth v4 + MongoDB Adapter（数据库直连），Credentials Provider（邮箱+密码）。
- 后端：Next.js Route Handlers（/api/*），Server Actions（部分后台表单）。
- 数据库：MongoDB + Prisma（主要管理业务数据：资源、分类、统计）；NextAuth 直接用 MongoDB Adapter 存储用户/会话。
- 版本管理：Git（约定式提交、保护分支）。

## 5. 系统架构图（文字版）
- Web 客户端（Next.js）
  - UI 层（页面/组件/动效）
  - 数据层（SWR/Server Actions）
  - 认证层（NextAuth Session）
- API 路由（/api/*）
  - 认证（/api/auth/*）
  - 业务（资源、分类、搜索、后台管理）
- 数据访问
  - Prisma -> MongoDB（资源/分类/统计）
  - MongoDB Adapter -> MongoDB（用户/会话/令牌）

## 6. 数据模型（简化）
- Category：name、slug、description、parentId、order、isActive、timestamps。
- Resource：title、slug、description、coverImageUrl、quarkLink、tags[]、categoryId、isPublic、timestamps。
- ResourceStat：resourceId、views、clicks、likes、timestamps。
- User（NextAuth 存储）：email、name、image、emailVerified、role、password（自定义字段，hash）。

## 7. 核心流程
- 未登录点击资料卡：拦截 -> 弹出登录 Modal -> 登录成功后跳转详情。
- 详情页访问：服务端校验 Session，无会话则 302 到登录页或展示登录提示。
- 管理后台：Middleware 校验 token.role === 'ADMIN'，无权限 302 -> 登录页。
- 搜索：根据 `q`、`category`、`sort` 聚合查询，分页返回。

## 8. 关键页面与组件
- 页面：
  - `/` 首页；`/search` 搜索；`/resources/[id]` 详情；`/categories/[slug]` 分类；
  - `/login`、`/register`；`/admin`、`/admin/resources/*`、`/admin/categories/*`。
- 组件：
  - `Navbar`（搜索框、登录入口）、`ResourceCard`、`LoginModal`、`CategoryMenu`、`AdminTable`、`Form` 系列、`Toaster`。

## 9. 安全与合规
- 密码：bcrypt 哈希存储；Zod 校验；防止爆破（预留速率限制）。
- 外链：夸克网盘链接仅在登录后展示，避免爬虫直接抓取；可按需加签/短链（后续）。
- 权限：JWT 内包含 `role`；中间件与服务端校验双保险。

## 10. 性能优化要点
- 列表分页 + 服务端过滤；图片懒加载；骨架屏。
- 关键路径动效可选择性禁用（`prefers-reduced-motion`）。
- 构建优化：Turbopack dev、按需加载组件、Edge/Node 运行时按需选择。

## 11. 部署方案（国内）
- Node 20+，`npm run build && npm run start`。
- 进程守护：PM2；前置 Nginx 反代/HTTPS 证书；静态资源开启 GZIP/HTTP3。
- 环境变量：`DATABASE_URL`、`NEXTAUTH_URL`、`NEXTAUTH_SECRET`。

## 12. 风险与对策
- MongoDB/Prisma 关系约束弱：通过应用层校验、后台操作约束保证一致性。
- 资源外链失效：后台定期巡检（预留任务/Webhook）。
- 突发访问：静态化首页、CDN、只在登录后访问外链详情降压。

---
该文档为开发与评审基线，后续按里程碑迭代更新。
