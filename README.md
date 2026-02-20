<p align="center">
  <img src="https://count.getloli.com/@self-rescue?name=self-rescue&theme=moebooru&padding=7&offset=0&align=top&scale=1&pixelated=1&darkmode=auto" alt="Moe Counter" />
</p>

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&height=220&color=0:22c55e,100:0ea5e9&text=大学生自救指南网站&fontColor=ffffff&fontSize=42&animation=twinkling&desc=Learning%20Material%20Sharing%20Website&descAlignY=68&descSize=18" alt="header" />
</p>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&pause=1200&color=22C55E&center=true&vCenter=true&width=960&lines=%E5%A4%A7%E5%AD%A6%E7%94%9F%E8%87%AA%E6%95%91%E6%8C%87%E5%8D%97%E7%BD%91%E7%AB%99;%E5%AD%A6%E4%B9%A0%E8%B5%84%E6%96%99%E5%88%86%E4%BA%AB%E7%BD%91%E7%AB%99%E6%90%AD%E5%BB%BA%E9%A1%B9%E7%9B%AE;Next.js+15+%2B+React+19+%2B+MongoDB;%E5%BD%93%E5%89%8D%E5%85%AC%E5%BC%80%E9%A2%84%E8%A7%88%E9%93%BE%E6%8E%A5%E4%BB%85%E7%94%A8%E4%BA%8E+UI+%E6%BC%94%E7%A4%BA" alt="typing" />
</p>

<h1 align="center">大学生自救指南网站</h1>

<p align="center">
  <code>college_student_self-rescue_guide_website</code>
</p>

<p align="center">
  <a href="https://traecollegestudentself-rescueguidewebsitekn9k-615y73x6j.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/Online%20Preview-Vercel-black?style=for-the-badge&logo=vercel" alt="Preview" />
  </a>
  <a href="https://github.com/Marways7/college_student_self-rescue_guide_website" target="_blank">
    <img src="https://img.shields.io/badge/GitHub-Marways7%2Fcollege_student_self--rescue_guide_website-181717?style=for-the-badge&logo=github" alt="GitHub" />
  </a>
  <img src="https://img.shields.io/badge/Next.js-15.4.6-000000?style=for-the-badge&logo=nextdotjs" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.1.0-20232A?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/MongoDB-6.18-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Completed-2025.08-blue?style=for-the-badge" alt="Completed 2025-08" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="MIT" />
</p>

> [!IMPORTANT]
> 本项目定位为学习资料分享网站搭建示例。当前公开链接仅用于 UI 与交互预览，不是线上真实资料分发平台。

## 项目简介

大学生自救指南网站是一个面向校园学习场景的全栈 Web 项目，聚焦“资料发现、资料管理、后台运营”三类核心需求。
项目主体功能于 **2025 年 8 月** 完成。

- 用户侧：浏览、搜索、筛选、收藏、评分、评论
- 管理侧：资源管理、分类管理、用户管理、系统设置、分析看板
- 工程侧：权限控制、行为统计、基础安全防护、文档化交付

## 在线预览

- 预览地址: `https://traecollegestudentself-rescueguidewebsitekn9k-615y73x6j.vercel.app`
- 说明: 仅用于界面与交互演示，不对应真实线上业务数据。

## 核心亮点

- 前后台一体化架构：同仓覆盖用户产品面和运营管理面。
- RBAC 权限体系：基于 NextAuth + 角色权限控制，保护管理入口。
- 数据闭环能力：资源、分类、收藏、评论、评分、点击/浏览统计打通。
- 可观测性设计：管理端仪表盘与分析接口可用于后续精细化运营。
- 体验导向 UI：桌面端与移动端均有针对性布局和动效组件。

## 功能矩阵

| 模块 | 能力 |
| --- | --- |
| 用户系统 | 注册、登录、会话管理、角色区分（ADMIN/USER） |
| 资源中心 | 资源列表、详情、关键词搜索、分类筛选 |
| 社区互动 | 收藏、评分、评论、浏览与点击统计 |
| 管理后台 | 资源管理、分类管理、用户管理、系统设置 |
| 数据分析 | 仪表盘汇总、趋势图、用户行为数据接口 |
| 开发调试 | `/api/dev/*` 调试接口（生产环境默认返回 403） |

## 技术栈

| 层级 | 技术选型 |
| --- | --- |
| 前端 | Next.js 15 (App Router), React 19, Tailwind CSS 4, Framer Motion |
| 后端 | Next.js Route Handlers, NextAuth, Zod |
| 数据层 | MongoDB, Prisma, MongoDB Native Driver |
| 安全与鉴权 | JWT Session, RBAC, Middleware 基础限流与安全头 |
| 可视化 | Recharts |
| 工程工具 | TypeScript, ESLint, Playwright |

## 界面截图与演示

> 展示素材来自 `UI截图/` 目录。

| 电脑端首页 | 手机端首页 |
| --- | --- |
| ![电脑端首页](./UI截图/电脑端首页UI.jpg) | ![手机端首页](./UI截图/手机端首页UI.jpg) |

| 资料库页面 | 管理后台 |
| --- | --- |
| ![资料库UI](./UI截图/资料库UI.jpg) | ![管理后台UI](./UI截图/管理后台UI.png) |

- 演示视频: [查看 `UI截图/演示视频.mp4`](./UI截图/演示视频.mp4)

## 快速开始

### 环境要求

- Node.js `>= 20`
- npm `>= 10`
- MongoDB（本地或远程）

### 本地运行

```bash
npm ci
cp .env.example .env
npm run dev
```

访问: `http://localhost:3000`

### 构建与检查

```bash
npm run build
npm run lint
```

## 环境变量

`.env.example` 已提供模板，核心变量如下。

| 变量名 | 必填 | 示例 | 说明 |
| --- | --- | --- | --- |
| `DATABASE_URL` | 是 | `mongodb://127.0.0.1:27017/college_student_self_rescue_guide` | MongoDB 连接串 |
| `NEXTAUTH_URL` | 是 | `http://localhost:3000` | NextAuth 回调基础地址 |
| `NEXTAUTH_SECRET` | 是 | `replace-with-strong-random-string` | 会话签名密钥 |
| `DEV_SEED_ADMIN_EMAIL` | 否 | `admin@example.com` | 本地 seed 管理员邮箱 |
| `DEV_SEED_ADMIN_PASSWORD` | dev seed 场景必填 | `replace-with-strong-dev-password` | 本地 seed 管理员密码 |

## 项目结构

```text
.
├─ src/                  # 业务代码（页面、接口、组件、核心库）
├─ prisma/               # 数据模型定义
├─ public/               # 静态资源
├─ UI截图/               # README 展示素材（截图/视频）
├─ docs/                 # 项目文档（报告、清单、设计等）
├─ Dev-Log.md            # 开发日志
├─ README.md
└─ LICENSE
```

## 文档索引

- 开源前检查清单: [`docs/OPEN_SOURCE_PRE_FLIGHT_CHECKLIST.md`](./docs/OPEN_SOURCE_PRE_FLIGHT_CHECKLIST.md)
- 文档总览: [`docs/README.md`](./docs/README.md)
- 开发日志: [`Dev-Log.md`](./Dev-Log.md)

## 参与贡献

欢迎通过 Issue / PR 参与改进：

- 提交 bug 与复现步骤
- 提交性能优化或安全改进建议
- 提交 UI/交互与可用性提升方案

## 许可证

本项目使用 [MIT License](./LICENSE)。

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Marways7/college_student_self-rescue_guide_website&type=Date)](https://www.star-history.com/#Marways7/college_student_self-rescue_guide_website&Date)
