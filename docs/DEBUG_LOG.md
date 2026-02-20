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

问题 7：构建类型错误 - ResourceCard Props 不匹配
- 现象：`ResourceCardProps` 期望 `resource` 对象，但页面以散参 `id/title/coverImageUrl` 传入
- 处理：统一改为 `<ResourceCard resource={...} index={...}/>`，并调整 Prisma `select` 字段

问题 8：Prisma `include` 导致类型 `never`
- 根因：MongoDB Prisma 模型未定义关系，`include.category` 不可用
- 处理：改为 `select` 选择业务必需字段

问题 9：`ParticleBackground` `useRef<number>()` 报 Expected 1 arguments
- 根因：TS 严格模式下需提供初值或可空类型
- 处理：改为 `useRef<number | null>(null)` 并在清理时判空

问题 10：`springConfig` 与 `Transition` 类型不兼容
- 现象：`type: "spring"` 被推断为 `string` 导致不兼容
- 处理：`as const` 固定字面量并 `satisfies Record<string, Transition>`

验证：
- `npm run build` 绿色；`npm run dev` 启动成功
- 浏览器自动化：访问首页、进入资料库与后台均成功；MongoDB 中存在管理员账号与示例数据，端到端路径可用

2025-08-11 补充 2：后台管理与数据真实化完善

问题 11：ResourceCard 显示模拟数据
- 现象：卡片上显示"0 次浏览"、"最近更新"等固定文本
- 处理：修改 ResourceCard 组件支持 updatedAt 字段，浏览量改为下载次数，获取真实统计数据

问题 12：后台管理缺失重要页面
- 现象：用户管理、数据分析、系统设置页面空白
- 处理：
  - 创建 `/admin/users` 用户管理：用户列表、统计、角色展示，基于 MongoDB users 集合
  - 创建 `/admin/analytics` 数据分析：资源统计、点击统计、用户增长、热门排行
  - 创建 `/admin/settings` 系统设置：基础配置、安全选项、邮件设置、维护模式

问题 13：前后端数据不一致
- 根因：ResourceCard 查询缺少 updatedAt，统计数据未从 ResourceStat 获取
- 处理：
  - 统一所有页面查询包含 updatedAt 字段
  - HomeHotResources 通过 MongoDB 聚合获取真实点击数
  - 所有 ResourceCard 传入 updatedAt 转 ISO 字符串格式

问题 14：类型系统不兼容
- 现象：HotResource 类型 updatedAt 为 Date 但组件期望 string
- 处理：在映射时调用 .toISOString() 转换，确保类型一致性

验证：
- 构建成功，所有新页面正常访问
- 用户管理显示真实用户数据（7个用户，4个管理员）
- 数据分析显示真实统计（8个资源，5次总下载，热门排行正确）
- 系统设置页面完整，支持各项配置选项
- ResourceCard 显示真实更新时间（2025/8/11）和下载次数
- 后台仪表盘数据与各页面保持一致，无模拟数据

2025-08-11 补充 3：全面修复与功能验证

问题 15：资料卡片无法点击
- 现象：整个资料卡片区域无法点击跳转
- 根因：按钮被嵌套在 Link 内部，复杂的动画效果阻挡点击事件
- 处理：重构 ResourceCard，将整个卡片包装为 Link，移除嵌套的按钮Link
- 验证：浏览器自动化测试确认卡片可点击并正常跳转到详情页

问题 16：用户管理功能为摆设
- 现象：禁用/启用/删除按钮无实际功能，角色切换无效
- 处理：
  - 创建 `/api/admin/users/[id]` API支持PATCH（状态/角色更新）和DELETE操作
  - 实现 UsersManager 客户端组件，连接真实API
  - 加入安全检查：不允许操作管理员账户
- 验证：成功禁用用户 PanelUser1，状态从"正常"变为"已禁用"，UI实时更新

问题 17：系统设置无保存功能
- 现象：设置修改后无法保存，为静态展示
- 处理：
  - 创建 `/api/admin/settings` API支持GET/POST操作
  - 实现 SettingsManager 客户端组件，支持表单提交和验证
  - MongoDB settings集合持久化配置
- 验证：修改网站名称为"大学生自救指南 - 测试版本"，成功保存并显示通知

问题 18：ObjectId序列化错误
- 现象：MongoDB ObjectId无法传递给客户端组件
- 根因：Next.js Client Components不支持非原始类型序列化
- 处理：在服务端将ObjectId转换为string，更新相关类型定义
- 验证：用户列表正常显示，无序列化错误

问题 19：数据库操作API缺失
- 现象：后台管理界面与数据库未连接
- 处理：
  - 用户管理：支持状态切换、角色变更、用户删除
  - 设置管理：支持配置读取和保存，参数验证
  - 错误处理：统一错误响应和客户端提示
- 验证：所有数据库操作正常，真实数据展示和修改成功

最终验证结果：
- ✅ ResourceCard：点击正常，跳转到 `/resources/6898fef1af34441998ce43ef`
- ✅ 用户管理：PanelUser1状态已禁用，按钮变为"启用"，数据库已更新
- ✅ 系统设置：网站名称已保存，显示成功通知，MongoDB已持久化
- ✅ 构建：`npm run build` 通过，仅余一个非阻断警告
- ✅ 类型安全：所有TypeScript错误已修复
- ✅ 端到端流程：前台资料浏览→后台用户管理→系统设置→数据库操作全链路打通

当前系统状态：
- 7个真实用户，4个管理员，3个普通用户
- 8个示例资源，真实更新时间2025/8/11
- 完整的用户权限管理体系
- 生产级系统设置功能
- 无模拟数据，全真实数据驱动

2025-08-11 补充 4：首页视觉与性能问题排查

问题 20：Hydration mismatch（首页随机星空/粒子）
- 现象：控制台反复出现 “A tree hydrated but some attributes ... didn't match”。
- 根因：背景随机星点与粒子系统使用 `Math.random()` 生成初始位置，导致 SSR 与 CSR DOM 属性不一致。
- 处理：彻底移除随机 DOM；改为可控的 Aurora 背景（基于 CSS 变量与渐变），无随机项。

问题 21：左上角卡顿与高 CPU（粒子 Canvas）
- 现象：用户反馈左上角有一小块动画导致页面卡顿。
- 根因：旧 `ParticleBackground` 使用高频 requestAnimationFrame 绘制 + 过多粒子，移动端/低配机明显卡顿。
- 处理：删除 `src/components/ParticleBackground.tsx`；取消所有 Canvas 动画。

问题 22：ESLint/TS 报错（any/@ts-expect-error、自定义CSS变量）
- 处理：通过 `CSSProperties` 合法注入 CSS 自定义变量；移除 `any` 与 `@ts-expect-error`。

验证：
- 首页打开无报错/警告；滚动、悬停动效稳定；切换配色持久化生效。
- E2E：使用 Playwright 打开首页与后台，控制台零错误，截图归档于运行目录。

2025-08-11 补充 5：首页“探索更多”与热门区背景不一致

问题 23：英雄区“探索更多”不可用
- 现象：点击无跳转，无法带用户至热门资料区
- 根因：缺少目标锚点与链接，只有装饰性的动效
- 处理：为滚动指示器包裹 `<a href="#home-hot">`，添加 `aria-label` 与键盘 Enter/Space 触发平滑滚动（`scrollIntoView`）；热门区 section 添加 `id="home-hot"`

问题 24：热门资料背景与英雄区不统一
- 现象：热门区为白色卡片背景，与顶部深色 Aurora 风格割裂
- 处理：在首页热门区外层加入深色径向渐变底图，内层使用玻璃卡片容器（`bg-white/5 + backdrop-blur + border-white/10`），标题使用品牌渐变并加强调线

验证：
- 使用浏览器自动化点击“探索更多”链接，URL 跳转 `#home-hot` 且视口滚动到热门区
- 视觉检查：热门区与顶部风格统一，无突兀白底；标题与分隔线采用品牌渐变
- 控制台无错误/警告；Fast Refresh 多次重建后功能稳定
