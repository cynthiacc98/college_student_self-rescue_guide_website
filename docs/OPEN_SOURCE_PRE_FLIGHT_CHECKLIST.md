# Open Source Pre-Flight Checklist

本清单用于 `college_student_self-rescue_guide_website` 在公开到 GitHub 前做最终核查。

## A. 凭据与敏感信息

- [ ] 已轮换所有历史可能泄露过的数据库账号/密码/API 密钥。
- [ ] `git ls-files .env .env.production .env.local.backup` 返回为空。
- [ ] `git ls-files .vercel/project.json` 返回为空。
- [ ] `git grep -nE 'mongodb\+srv://.*:.*@|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|github_pat_'` 未命中真实凭据。
- [ ] 本地会话文件（如 `cookies.txt`）不再被跟踪。

## B. 仓库卫生

- [ ] `git status` 仅包含计划发布的文件。
- [ ] `node_modules/`、`.next/`、日志、缓存未被提交。
- [ ] `UI截图/` 中需要展示的图片和视频已加入版本管理。
- [ ] 不需要公开的内部文档/脚本已剔除或说明用途。

## C. 文档完整性

- [ ] `README.md` 包含在线预览链接、功能说明、部署步骤、环境变量说明。
- [ ] `README.md` 明确声明“仅 UI 预览，不是线上真实资料分享服务”。
- [ ] `README.md` 引用了 `UI截图/` 中真实素材路径，GitHub 可正常显示。
- [ ] 已决定开源许可证并添加 `LICENSE`（推荐 MIT）。

## D. 可运行性核验

- [ ] 本地执行 `npm ci && npm run dev` 可正常启动。
- [ ] 本地执行 `npm run build && npm run start` 可访问核心页面。
- [ ] 关键流程已自测：注册/登录、资源浏览、后台登录、基础管理操作。
- [ ] dev 接口在生产环境已禁用（`NODE_ENV=production` 返回 403）。

## E. GitHub 发布动作

- [ ] 仓库命名为 `college_student_self-rescue_guide_website`。
- [ ] 远程地址设置为 `git@github.com:Marways7/college_student_self-rescue_guide_website.git`。
- [ ] 默认分支 `main`，已成功首推。
- [ ] 开启仓库设置：Issues、Discussions（按需）、Security（Secret Scanning/Dependabot）。

## F. Vercel 发布动作

- [ ] Vercel 成功导入 GitHub 仓库。
- [ ] 已配置 `DATABASE_URL`、`NEXTAUTH_URL`、`NEXTAUTH_SECRET`。
- [ ] 部署后页面可访问，`/admin` 权限控制符合预期。
- [ ] 自定义域名（可选）与 HTTPS 正常。

## 建议提交命令

```bash
git add README.md docs/OPEN_SOURCE_PRE_FLIGHT_CHECKLIST.md UI截图
git add docs
git add LICENSE
git add .gitignore verify-user-management.js src/app/api/dev .env.example
git rm --cached cookies.txt
git commit -m "docs: finalize open-source README and pre-flight checklist"
```

如你想把当前其它实验性改动排除在发布之外，请先用 `git add -p` 精确选择分块。
