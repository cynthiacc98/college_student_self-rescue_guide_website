# DEBUG_LOG

日期：2025-08-10

问题 1：PowerShell 下长命令导致 PSReadLine 异常
- 现象：执行 `npm i ...` 时出现 `PSReadLine` 光标异常
- 处理：重新执行命令，拆分/避免交互，安装顺利完成

问题 2：Prisma 初始化重复
- 现象：`npx prisma init` 提示 prisma 目录已存在
- 处理：确认已生成 `prisma/schema.prisma`，直接编辑模型并 `npx prisma generate`

问题 3：Next.js 路由导出类型错误
- 现象：`Type error: checkFields ... AuthOptions is not assignable to type 'never'`
- 根因：在 Route Handler 中导出了 `authOptions` 等非 GET/POST 符号
- 处理：将 `authOptions` 移至 `src/lib/auth-options.ts`，Route 仅导出 `GET/POST`

问题 4：ESLint any 类型报错
- 处理：引入 `UserWithRole` 强类型，移除 `any` 强转，修复 d.ts 未使用导入

问题 5：构建时 `useSearchParams` 需要 Suspense 边界
- 处理：登录页使用 `<Suspense>` 包裹内部组件

问题 6：MongoDB SRV 解析失败（无云端 DNS）
- 现象：`querySrv ENOTFOUND _mongodb._tcp...`
- 处理：将 `.env` 的 `DATABASE_URL` 改为本地 `mongodb://127.0.0.1:27017/college_student_self_rescue_guide`

验证：
- 运行 `npm run build` 通过；页面静态构建通过
- 后续将使用 Playwright MCP 进行交互验证（需本地或远端 MongoDB 可用时完成注册/登录流程验证）

——

2025-08-11 补充：
- 修复：后台分类/资料 API 中涉及写操作的接口切换为 Mongo 原生 driver，避免 Prisma P2031（副本集事务要求）。
  - `POST /api/admin/categories`、`PATCH/DELETE /api/admin/categories/[id]`
  - `POST /api/admin/resources`、`DELETE /api/admin/resources/[id]`（同时支持表单 `_method=DELETE`）
- E2E 验证：
  - 登录管理员后在 `/admin/resources/new` 创建“离散数学 笔记精编”成功；跳转编辑页；列表显示；删除按钮删除后重定向回列表。
  - `/admin/categories` 新建、编辑、排序、启用/停用、删除均成功，删除会将关联资源 `categoryId` 置空。
- 后台仪表盘：新增“趋势占位”区块（后续可接入真实统计）。
