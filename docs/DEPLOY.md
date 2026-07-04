# 部署上线指南 · 太阳系互动模型

本项目是**纯静态前端**（Vite + Three.js），**无后端、无数据库**。
构建产物 `dist/` 是一组静态文件（HTML/CSS/JS/图片/音频），可托管在任何静态站点平台。

托管平台：**Cloudflare Pages**（免费、全球 CDN、自动 HTTPS、国内可访问）。
域名：使用你已有的域名。

---

## 整体流程

```
本地代码 → GitHub 仓库 → Cloudflare Pages 自动构建 → 全球 CDN → 你的域名
```

后续每次 `git push`，Cloudflare 会自动重新构建并上线，无需手动操作。

---

## 第 1 步：把代码推到 GitHub

### 1.1 在 GitHub 创建仓库

1. 登录 https://github.com → 右上角 **+** → **New repository**
2. Repository name：`solar-system`（随意）
3. 可见性：**Public**（免费账户 Cloudflare Pages 自动构建需公开仓库；私有仓库也支持，但免费版有并发限制）
4. **不要**勾选 "Add a README"、".gitignore"、"license"（本仓库已有这些文件）
5. 点 **Create repository**

### 1.2 本地推送

在项目根目录 `g:\Claude\太阳系运动` 打开终端，执行（把 `YOUR_USER` 换成你的 GitHub 用户名）：

```bash
# 暂存所有文件（已按 .gitignore 排除 node_modules / dist / 大音频源文件）
git add -A

# 首次提交
git commit -m "初始化：太阳系互动模型 3D（音频压缩为 MP3，准备部署）"

# 关联 GitHub 远程仓库
git remote add origin https://github.com/YOUR_USER/solar-system.git

# 推送
git branch -M main
git push -u origin main
```

如果用 HTTPS 推送要求输入密码，GitHub 已不支持账号密码，需用 **Personal Access Token**：
- GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
- Generate new token → 勾选 `repo` 权限 → 生成后把 token 当作密码粘贴

（或改用 SSH：`git remote add origin git@github.com:YOUR_USER/solar-system.git`，需先配置 SSH key）

---

## 第 2 步：在 Cloudflare Pages 连接仓库

### 2.1 注册 / 登录 Cloudflare

打开 https://dash.cloudflare.com → 注册或登录（免费账户即可）。

### 2.2 创建 Pages 项目

1. 左侧菜单 **Workers & Pages** → 点 **Create** → 选 **Pages** 标签 → **Connect to Git**
2. 授权 Cloudflare 访问 GitHub：首次会跳转 GitHub 授权页，选 **Only select repositories** → 勾选 `solar-system` → Install & Authorize
3. 回到 Cloudflare 后选中 `solar-system` 仓库 → **Begin setup**

### 2.3 构建配置（关键）

| 配置项 | 填写值 |
|---|---|
| Project name | `solar-system`（决定免费子域名：`solar-system.pages.dev`） |
| Production branch | `main` |
| Framework preset | None（或 Vite，均可） |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | （留空） |
| Environment variables | `NODE_VERSION` = `20`（建议显式指定，避免平台默认版本过旧） |

4. 点 **Save and Deploy**。首次构建约 1-2 分钟。
5. 构建完成后会得到一个 `https://solar-system.pages.dev` 地址，先打开验证页面正常。

> 若构建失败，在 Pages 项目 → **Deployments** → 点本次部署 → 查看 **Build log**。
> 常见问题：Node 版本过低（加 `NODE_VERSION=20` 环境变量即可）。

---

## 第 3 步：绑定你的自定义域名

### 3.1 在 Cloudflare 添加域名

1. Pages 项目 → **Custom domains** → **Set up a custom domain**
2. 输入你的域名（如 `solar.yourdomain.com`，建议用子域名而非根域名）
3. Cloudflare 会给出一条 **CNAME** 记录，要求你把该子域名指向 `solar-system.pages.dev`

### 3.2 在你的域名注册商配置 DNS

登录你买域名的注册商后台（阿里云/腾讯云/Namecheap/GoDaddy 等），找到 **DNS 解析管理**，添加：

| 记录类型 | 主机记录 | 记录值 | TTL |
|---|---|---|---|
| CNAME | `solar`（或你想用的子域名前缀） | `solar-system.pages.dev` | 自动/600 |

保存后等待 DNS 生效（通常几分钟到几十分钟）。

### 3.3 如果域名本身托管在 Cloudflare

则 DNS 记录会被 Cloudflare 自动添加，无需手动配置，直接生效。

### 3.4 HTTPS

Cloudflare 自动签发并续期 SSL 证书，绑定域名成功后 `https://solar.yourdomain.com` 即可访问，无需任何手动证书操作。

---

## 第 4 步：验证上线

1. 打开 `https://solar.yourdomain.com`（或过渡用的 `https://solar-system.pages.dev`）
2. 检查：
   - 3D 场景正常加载、行星运动正常
   - 贴图显示正常（太阳、行星、银河背景）
   - 打开"图层 ▸ 声音"，确认背景音乐能播放（MP3 已压缩到 4.4MB）
   - 移动端 / 桌面端切换画质模式正常
3. 在 **Deployments** 页可看到每次部署的预览地址、构建日志、回滚按钮。

---

## 后续更新流程

代码改完后，只需：

```bash
git add -A
git commit -m "描述你的改动"
git push
```

Cloudflare 检测到 `main` 分支推送后自动重新构建上线，约 1-2 分钟生效。
需要回滚时，在 Dashboard → Deployments 里选历史版本点 **Rollback to this deployment** 即可。

---

## 备选方案：不连 Git，命令行直传

如果你不想用 GitHub，也可以用 wrangler CLI 直接上传 `dist/`：

```bash
# 1. 本地构建
npm run build

# 2. 登录 Cloudflare（首次会打开浏览器授权）
npx wrangler login

# 3. 直传 dist 目录
npx wrangler pages deploy dist --project-name=solar-system
```

缺点：每次更新都要手动执行，没有自动部署和预览地址。**推荐还是用上面的 Git 方式。**

---

## 关于国内访问

- Cloudflare Pages 的 `*.pages.dev` 域名和自定义域名在**大陆大部分地区可访问**，速度中等（境外 CDN 节点）。
- 不走 ICP 备案：用海外托管 + 海外/非 .cn 域名，无需备案即可上线，但偶尔可能受网络波动影响。
- 若后续发现国内访问不稳定，可考虑：
  - 把域名 DNS 托管到 Cloudflare（即使注册商不是 Cloudflare，也可改 NS 服务器到 Cloudflare），启用其全球 Anycast 网络；
  - 或迁移到国内云（阿里云/腾讯云 OSS+CDN），但那时自定义域名必须 ICP 备案。

---

## 已完成的部署准备

- ✅ 音频压缩：`太空音效1.wav`（33.5MB）→ `public/audio/space-ambient-1.mp3`（4.4MB），代码引用已更新
- ✅ `.gitignore` 已配置（排除 `node_modules`、`dist`、大音频源文件、本地工具配置）
- ✅ Git 仓库已初始化在 `main` 分支
- ✅ Cloudflare Pages 配置文件 `wrangler.toml`（CLI 直传备选用）
- ✅ 构建验证通过（见下方"本地构建验证"）

## 本地构建验证

```bash
npm install      # 首次或依赖变更时
npm run build    # 生成 dist/
npm run preview  # 本地预览构建结果（http://localhost:4173）
```
