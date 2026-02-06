# 部署到 Cloudflare Pages（云端数据同步）

本指南将帮助你将收藏夹应用部署到 Cloudflare Pages，并使用 KV 存储数据。

## 前置要求

1. [Cloudflare 账号](https://dash.cloudflare.com/sign-up)
2. [Node.js](https://nodejs.org/) 16+
3. Git

## 方式一：通过 Cloudflare Dashboard 部署（推荐）

### 步骤 1：准备代码仓库

将代码推送到 GitHub、GitLab 或其他 Git 仓库：

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 步骤 2：在 Cloudflare 创建 Pages 项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages**
3. 点击 **Create application** → **Pages** → **Connect to Git**
4. 选择你的代码仓库并授权
5. 配置构建设置：
   - **Framework preset**: `None`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`

### 步骤 3：创建 KV 命名空间

1. 在 Cloudflare Dashboard 进入 **Workers & Pages** → **KV**
2. 点击 **Create a namespace**
3. 命名为 `bookmark-data`（或其他名称）
4. 记下创建的命名空间 ID

### 步骤 4：绑定 KV 到 Pages 项目

1. 进入你的 Pages 项目设置
2. 点击 **Settings** → **Functions** → **KV namespace bindings**
3. 点击 **Add binding**
4. 设置：
   - **Variable name**: `BOOKMARK_KV`
   - **KV namespace**: 选择你创建的命名空间
5. 保存设置

### 步骤 5：重新部署

1. 进入 **Deployments** 页面
2. 点击最新部署旁的 **...** → **Retry deployment**

部署完成后，你的网站就可以访问了！

---

## ⚠️ 重要：验证云端同步是否正常工作

部署完成后，请按以下步骤验证：

1. 访问你的网站
2. 打开浏览器开发者工具（F12）→ **Console** 标签页
3. 刷新页面，观察控制台输出
   - 如果看到 API 请求成功，说明云端连接正常
   - 如果看到 `Cloud storage not available, using local storage`，说明 KV 未正确绑定
4. 使用默认密码 `admin` 登录
5. 添加一个分类或收藏
6. 切换到 **Network** 标签页，检查是否有 `/api/categories` 或 `/api/items` 的 POST 请求
7. 如果请求返回 200，说明云端同步正常工作
8. 可以尝试在另一个浏览器或隐私模式中打开网站，验证数据是否同步

### 常见问题排查

如果云端同步不工作：

1. **确认 KV 绑定**：进入项目 Settings → Functions → KV namespace bindings，确保变量名是 `BOOKMARK_KV`（区分大小写）
2. **重新部署**：绑定 KV 后必须重新部署才会生效
3. **检查 Functions**：进入项目 Functions 标签页，确认 `api/[[path]]` 函数存在
4. **查看日志**：点击 Functions 标签页，查看请求日志和错误信息

---

## 方式二：使用 Wrangler CLI 部署

### 步骤 1：安装 Wrangler

```bash
npm install -g wrangler
```

### 步骤 2：登录 Cloudflare

```bash
wrangler login
```

### 步骤 3：创建 KV 命名空间

```bash
wrangler kv:namespace create "BOOKMARK_KV"
```

记下输出的命名空间 ID。

### 步骤 4：更新 wrangler.toml

编辑 `wrangler.toml` 文件，取消注释并填入 KV 命名空间 ID：

```toml
[[kv_namespaces]]
binding = "BOOKMARK_KV"
id = "your-kv-namespace-id"
```

### 步骤 5：构建并部署

```bash
npm run build
wrangler pages deploy dist
```

---

## 配置说明

### 默认密码

首次部署后，管理员默认密码为 `admin`。登录后请立即修改密码。

### 数据存储

- **云端模式**：当 Cloudflare KV 可用时，数据存储在云端
- **本地模式**：如果 KV 不可用，会自动降级为 localStorage 存储

### 环境变量（可选）

可以在 Cloudflare Dashboard 的 Pages 项目设置中添加环境变量：

| 变量名 | 说明 |
|--------|------|
| `ADMIN_PASSWORD` | 初始管理员密码（不设置则默认为 `admin`）|

---

## 常见问题

### Q: 部署后看不到 API 路由？

确保 `functions` 目录在项目根目录下，并且文件名为 `api/[[path]].ts`。

### Q: KV 绑定不生效？

1. 确认变量名是 `BOOKMARK_KV`（区分大小写）
2. 确认绑定后重新部署了项目

### Q: 如何备份数据？

可以使用 Wrangler 导出 KV 数据：

```bash
wrangler kv:key list --namespace-id=<your-namespace-id>
wrangler kv:key get --namespace-id=<your-namespace-id> "categories"
wrangler kv:key get --namespace-id=<your-namespace-id> "items"
```

### Q: 如何重置密码？

使用 Wrangler 直接设置密码：

```bash
wrangler kv:key put --namespace-id=<your-namespace-id> "password" "newpassword"
```

---

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 本地预览（包含 Functions）
wrangler pages dev dist
```

---

## 项目结构

```
├── dist/                  # 构建输出
├── functions/
│   └── api/
│       └── [[path]].ts   # Cloudflare Pages Functions
├── src/
│   ├── components/       # React 组件
│   ├── hooks/           # 自定义 Hooks
│   ├── services/        # API 服务
│   └── types/           # TypeScript 类型
├── wrangler.toml        # Cloudflare 配置
└── DEPLOY.md            # 本文档
```
