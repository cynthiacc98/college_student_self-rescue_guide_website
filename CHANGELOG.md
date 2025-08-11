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

## 0.1.1 - 启动与类型修复
- 修复 `ResourceCard` 使用签名，统一以 `resource` 传入并调整页面查询字段
- 修复 `HomeHotResources` Prisma 查询与类型，兼容 `_count.clicks` 可选并提供回退
- 修复 `ParticleBackground` `useRef<number>` 初始化问题（改为 `number | null`）
- 修复 `animations` 的 `springConfig` 类型与 `Transition` 兼容问题
- 构建与本地开发服务启动成功，完成首页/资料库/后台访问验证

## 0.1.2 - 完善后台管理与数据真实化
- **资料卡片优化**：修复浏览量显示为真实下载次数，最近更新显示真实时间
- **数据库打通**：前端卡片统计与后台管理数据保持一致，点击计数实时同步
- **新增用户管理页面**：完整的用户列表、统计、角色管理界面，基于真实 MongoDB 数据
- **新增数据分析页面**：核心指标展示、热门资源排行、活动时间线，所有数据来源真实
- **新增系统设置页面**：基础设置、安全配置、邮件设置、维护模式等完整配置界面
- **ResourceCard 组件升级**：支持 updatedAt 字段，显示格式化的更新时间
- **后台管理完善**：三大缺失页面全部补齐，打通前后端数据流
- **质量提升**：所有新功能均为真实数据驱动，无模拟内容，符合生产标准

## 0.1.3 - 全面修复与功能完善 
- **资料卡片修复**：完全修复点击问题，整个卡片现在可点击跳转详情页
- **数据真实化完善**：所有展示数据均来自真实数据库，彻底移除模拟数据
  - 资料卡片显示真实下载次数和更新时间
  - 用户统计显示真实数据（7个用户，4个管理员，3个普通用户）
  - 系统分析基于真实MongoDB数据
- **用户管理功能**：完整实现用户管理操作
  - ✅ 用户角色切换（普通用户↔管理员）
  - ✅ 用户状态管理（启用/禁用）
  - ✅ 用户删除功能（保护管理员账户）
  - ✅ 实时状态更新与成功通知
- **系统设置功能**：完整的系统配置管理
  - ✅ 基础设置：网站名称、描述、用户注册开关
  - ✅ 安全设置：邮箱验证、文件上传限制、文件类型配置
  - ✅ 邮件设置：SMTP配置
  - ✅ 维护模式：系统维护开关
  - ✅ 设置实时保存与API持久化
- **数据库集成完善**：前后端数据库完全打通
  - MongoDB用户管理API（增删改查）
  - 系统设置API（读取和保存）
  - ObjectId序列化处理
- **类型安全优化**：修复所有TypeScript类型错误和ESLint警告
- **端到端验证**：浏览器自动化验证所有核心功能正常运行

## 0.1.4 - 首页 SOTA 视觉升级与性能稳固
- 全新 Aurora 背景：基于可交互的锥形渐变与聚光叠加，实现动态但高性能的霓虹极光效果（无 hydration 风险）
- 色板切换器：新增右上角“更换配色”，支持 Ocean Neon / Sunset Prism / Aurora Soft 三套高级配色，持久化到 localStorage
- 动效体系重构：
  - 保留丝滑且节制的浮动/扫光/脉冲动画，去除随机元素，避免 SSR/CSR 不一致
  - 移除性能灾难的旧粒子系统 `ParticleBackground.tsx`，彻底解决卡顿与内存开销
- 组件结构优化：
  - `HomeHero` 无随机 DOM，避免水合错配；使用 `useInView` 仅在可视时启动动效
  - 背景改为深海蓝 `#0B1221`，远离大紫底，层次更高级、可读性更强
- ESLint/TS 修复：自定义 CSS 变量采用 `CSSProperties` 类型，移除 `any` 与 `@ts-expect-error`
- 端到端验证：Playwright 验证首页加载 0 错误、滚动/悬停流畅，无水合警告

变更影响：
- 首页品牌感与高级感显著提升，同时确保生产级稳定性与可维护性；后续可安全拓展更多 Aurora 图层与主题。

## 0.1.5 - 首页交互修复与热门区视觉统一
- 修复：首页英雄区“探索更多”不可用，新增锚点跳转至热门区（支持键盘 Enter/Space）
- 视觉：热门资料区加入深色径向底+玻璃卡片容器，与 Aurora 英雄区风格统一
- 可达性：滚动指示器加 aria-label、键盘触达与平滑滚动
- 代码：`HomeHero.tsx` 新增锚点链接；`app/page.tsx` 为热门区添加 `id="home-hot"` 与品牌渐变标题
