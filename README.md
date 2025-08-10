# 大学生自救指南 - 使用与部署指南

## 本地开发
- Node 20+，MongoDB 本地或远程可用
- 复制 `.env.example` 为 `.env` 并填写：
  - DATABASE_URL=mongodb://127.0.0.1:27017/college_student_self_rescue_guide
  - NEXTAUTH_URL=http://localhost:3000
  - NEXTAUTH_SECRET=生成一串随机字符串
- 安装依赖并启动
```
npm ci
npx prisma generate
npm run dev
```
- 访问 `http://localhost:3000`，注册首个用户将自动成为 ADMIN

## 质量检查
```
npm run lint
npm run build
npm run start
```

## 生产部署（国内服务器）
假设服务器系统为 Ubuntu 22.04，Node 20+。

### 1) 准备环境
```
# 安装 Node
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 pm2
sudo npm i -g pm2
```

### 2) 拉取代码并配置环境
```
cd /srv
sudo mkdir -p college-student-guide && sudo chown $USER:$USER college-student-guide
cd college-student-guide
git clone <your-repo-url> .
cp .env.example .env
# 编辑 .env，填写 DATABASE_URL、NEXTAUTH_URL、NEXTAUTH_SECRET
npm ci
npx prisma generate
npm run build
```

### 3) 使用 PM2 启动
```
# ecosystem 配置（可选）
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'college-student-guide',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: process.cwd(),
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
EOF

pm2 start ecosystem.config.js
pm2 save
pm2 startup  # 生成开机自启
```

### 4) 配置 Nginx 反向代理（含 HTTPS）
```
sudo apt-get install -y nginx
sudo tee /etc/nginx/sites-available/college-student-guide <<'CONF'
server {
  listen 80;
  server_name your.domain.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
CONF

sudo ln -sf /etc/nginx/sites-available/college-student-guide /etc/nginx/sites-enabled/college-student-guide
sudo nginx -t && sudo systemctl reload nginx
```
如需 HTTPS，建议用 acme.sh 或 certbot 申请证书并将 `listen 443 ssl` 与证书路径加入 server 块。

### 5) 数据库建议
- 正式环境建议使用 MongoDB 副本集或云服务（Aliyun/腾讯云/Atlas），以获得事务能力与高可用
- 本项目在本地开发阶段对写操作使用 Mongo 原生 driver 以避免副本集限制；生产可切换到副本集并回归 Prisma 写操作

## 管理后台使用
- 登录后访问 `/admin`
- 分类管理：增删改、启用/禁用、拖拽排序、直接编辑排序数值
- 资料管理：创建/编辑/删除；支持批量删除、批量公开/私有

## 常见问题
- Windows 下 `npm run build` 报 EPERM/ENOENT：关掉 dev 服务、删除 `.next` 后再构建
```
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force; Start-Sleep -Seconds 1; Remove-Item -Recurse -Force .next; npm run build
```
- Prisma 与 Mongo 本地非副本集报 P2031：本项目已在写操作上使用 Mongo 原生 driver 规避；生产建议副本集

## 许可
- 仅供学习与内部使用，外部部署请遵循依赖库许可。
