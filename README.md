# Clipboard Sync

一个简单的剪贴板同步工具，支持文本和文件的跨设备同步。

![GitHub stars](https://img.shields.io/github/stars/axfinn/fcopy.svg?style=social&label=Stars)
![GitHub forks](https://img.shields.io/github/forks/axfinn/fcopy.svg?style=social&label=Fork)

## 功能特性

- 📋 文本和文件剪贴板同步
- 🔐 安全的API密钥认证机制
- 🖼️ 图片预览和文件下载
- 📱 响应式设计，支持移动端使用
- 🌐 Socket.IO实时同步
- 📊 访问统计和监控面板
- 👤 用户管理和数据隔离
- 🐳 Docker容器化部署支持

## 使用的组件/库/框架

- 后端：[Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) + [Socket.IO](https://socket.io/) + [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- 前端：[Vue 3](https://v3.vuejs.org/) + [Webpack 5](https://webpack.js.org/)
- 部署：[Docker](https://www.docker.com/) + [Docker Compose](https://docs.docker.com/compose/)

## 当前版本

v1.2.15 (2025-08-09)

## 快速开始

### 使用 Docker (推荐)

```bash
# 拉取最新版本镜像
docker pull axiu/fcopy:latest

# 运行容器
docker run -d \
  --name fcopy \
  -p 2001:2001 \
  -v /path/to/your/data:/app/uploads \
  axiu/fcopy:latest
```

### 使用 Docker Compose (推荐)

```
# 克隆项目
git clone https://github.com/axfinn/fcopy.git
cd fcopy

# 启动服务
docker-compose up -d

# 访问应用: http://localhost:2001
```

### 使用预构建的 Docker 镜像 (推荐用于快速部署)

```
# 拉取指定版本镜像
docker pull axiu/fcopy:1.2.12

# 启动容器
docker run -d \
  --name fcopy \
  -p 2001:2001 \
  -v $(pwd)/data:/app/data \
  axiu/fcopy:1.2.12

# 访问应用: http://localhost:2001
```

### 使用 Docker Compose 部署指定版本

```
version: '3.8'
services:
  fcopy:
    image: axiu/fcopy:1.2.12
    container_name: fcopy
    ports:
      - "2001:2001"
    volumes:
      - ./data:/app/data
    environment:
      - EXPIRE_HOURS=24
```

### 配置 API 密钥

API 密钥可以在 `.env` 文件中配置:

```
CLIPBOARD_API_KEY=your-api-key-here
ADMIN_API_KEY=admin-secret-key
CLEANUP_DAYS=7
```

或者通过环境变量设置。

系统会自动创建两个默认用户：
1. 普通用户：用户名 `default`，API密钥为 `CLIPBOARD_API_KEY` 的值（默认为 `default-api-key`）
2. 管理员用户：用户名 `admin`，API密钥为 `ADMIN_API_KEY` 的值（默认为 `admin_secret_key`）

### 更新内容

### v1.2.12

- 实现完整的用户数据隔离功能，确保不同用户之间数据完全独立
- 在移动端界面添加删除按钮，提升移动端用户体验
- 增强安全机制，防止用户访问其他用户的数据

### v1.2.11

- 修正Docker镜像名称一致性问题：统一使用`axiu/fcopy`作为镜像名称
- 更新GitHub Actions构建流水线配置，确保镜像正确推送至Docker Hub
- 同步更新README和DOCKER文档中的镜像引用

### 配置请求频率限制

可以通过以下环境变量调整请求频率限制：

```
# 限制在时间窗口内的请求数量（默认10次）
RATE_LIMIT_REQUESTS=10

# 时间窗口（毫秒，默认60000毫秒即1分钟）
RATE_LIMIT_WINDOW_MS=60000

# 封禁时长（毫秒，默认600000毫秒即10分钟）
RATE_LIMIT_BLOCK_DURATION_MS=600000
```

### 缓存控制配置

项目已实现智能缓存控制策略：

1. HTML文件：不缓存，确保用户始终获取最新版本
2. JS/CSS文件：缓存1年，通过内容哈希实现版本控制
3. 图片文件：缓存1年，通过内容哈希实现版本控制

这种策略既保证了页面的实时更新，又优化了静态资源的加载速度。

### 截图粘贴上传

用户可以在任何地方截图（如QQ截图、微信截图、系统截图工具等），然后直接在应用界面按 `Ctrl+V` (Windows) 或 `Cmd+V` (Mac) 粘贴上传截图。

### 多用户支持

系统支持多用户，有两种类型的用户：
1. 管理员用户 - 可以创建新用户和查看系统统计信息
2. 普通用户 - 只能访问自己的数据

默认情况下，系统会创建一个管理员用户和一个普通用户。

## Nginx 配置示例

如果你希望通过 Nginx 接入网关，可以参考项目中的 [nginx.conf](file:///Volumes/M20/code/docs/fcopy/nginx.conf) 文件。

示例配置要点：

1. 静态文件服务
2. API 接口代理
3. WebSocket 支持
4. 文件上传目录访问

配置文件路径：[nginx.conf](file:///Volumes/M20/code/docs/fcopy/nginx.conf)

## API 接口

### 鉴权

所有 API 请求都需要在 Header 中包含 `X-API-Key` 字段：

```
X-API-Key: your-api-key-here
```

### 接口列表

- `GET /api/clipboard` - 获取剪贴板历史记录（仅当前用户数据）
- `POST /api/clipboard/text` - 添加文本内容
- `POST /api/clipboard/file` - 上传文件
- `DELETE /api/clipboard/:id` - 删除指定内容（仅能删除自己的内容）
- `GET /api/users` - 获取用户列表（仅管理员）
- `POST /api/users` - 创建新用户（仅管理员）
- `GET /api/access-logs` - 获取访问日志（仅管理员）
- `GET /api/rate-limits` - 获取限流状态（仅管理员）

## 部署

使用提供的 [deploy.sh](file:///Volumes/M20/code/docs/fcopy/deploy.sh) 脚本进行部署：

```bash
chmod +x deploy.sh
./deploy.sh
```

## 自动清理机制

系统每天凌晨2点会自动清理指定天数前的内容，包括数据库记录和存储的文件。

清理天数可通过环境变量 `CLEANUP_DAYS` 配置，默认为7天。

## 多用户和数据隔离

系统支持多用户，每个用户只能访问自己的数据：
- 管理员可以创建新用户
- 普通用户只能查看和操作自己的剪贴板内容
- 访问日志和限流状态仅管理员可查看

## GitHub 项目信息

- 项目地址: [https://github.com/axfinn/fcopy.git](https://github.com/axfinn/fcopy.git)
- Stars: ![GitHub stars](https://img.shields.io/github/stars/axfinn/fcopy.svg)
- Forks: ![GitHub forks](https://img.shields.io/github/forks/axfinn/fcopy.svg)

# 跨平台剪贴板同步工具

一个支持多平台访问的Web项目，可以快速复制粘贴内容并实现跨平台数据同步。

## 功能特性

- 多平台支持（Web、移动端）
- 快速复制粘贴内容
- 跨平台数据同步
- 支持文本、图片和文件同步
- 定期自动清理旧数据
- 原生安全鉴权机制
- 实时更新
- 简洁易用的界面

## 技术栈

- 前端：Vue.js + Element UI
- 后端：Node.js + Express
- 数据库：SQLite
- 实时通信：Socket.IO
- 构建工具：Webpack

## 项目结构

```
├── client/           # 前端代码
├── server/           # 后端代码
├── uploads/          # 上传文件存储目录
├── package.json      # 项目配置
└── README.md         # 项目说明
```

## 安全机制

### API 密钥鉴权
为了防止未授权访问和信息泄露，系统采用 API 密钥鉴权机制：

1. 所有 API 请求必须在 Header 中包含 `X-API-Key` 字段
2. WebSocket 连接也需要在握手时提供有效的 API 密钥
3. 密钥验证失败的请求将被拒绝访问

在生产环境中，应通过环境变量 `CLIPBOARD_API_KEY` 设置密钥：
```bash
CLIPBOARD_API_KEY=your_secret_api_key npm run dev
```

### 数据隔离
- 所有请求都必须通过鉴权才能访问
- 不同用户/设备使用不同密钥实现数据隔离
- 前端会将密钥存储在 localStorage 中以便下次访问

## 部署方案

### Docker 部署（推荐）

#### 使用 Docker Compose（推荐）
1. 确保已安装 Docker 和 Docker Compose
2. 克隆项目代码
3. 进入项目目录
4. 构建并启动服务：
   ```bash
   docker-compose up -d
   ```
5. 访问应用：http://localhost:3000

#### 环境变量配置
支持两种方式设置 API 密钥：

1. 通过环境变量：
   ```bash
   export CLIPBOARD_API_KEY=your_secret_api_key
   docker-compose up -d
   ```

2. 通过 `.env` 文件（会自动生成）：
   ```bash
   # 查看生成的API密钥
   cat .env
   ```

系统会优先使用环境变量中的 `CLIPBOARD_API_KEY`，如果没有设置，则从 `.env` 文件中读取。

#### 数据持久化
- 数据库文件 (`clipboard.db`) 会挂载到本地目录
- 上传的文件会保存在 `uploads` 目录中

### 部署脚本
项目提供了一个交互式部署脚本 `deploy.sh`，支持以下功能：

```bash
# 给脚本添加执行权限
chmod +x deploy.sh

# 运行交互式部署脚本
./deploy.sh

# 或者使用命令行参数
./deploy.sh deploy         # 部署应用
./deploy.sh start          # 启动服务
./deploy.sh stop           # 停止服务
./deploy.sh restart        # 重启服务
./deploy.sh status         # 查看服务状态
./deploy.sh logs           # 查看日志
./deploy.sh env            # 设置环境变量
./deploy.sh show-key       # 显示当前API密钥
./deploy.sh start-prod     # 启动生产环境服务
```

### 手动部署

1. 安装依赖：
```bash
npm install
```

2. 设置 API 密钥并启动开发服务器：
```bash
CLIPBOARD_API_KEY=your_secret_api_key npm run dev
```

或者在 Windows 系统中：
```bash
set CLIPBOARD_API_KEY=your_secret_api_key && npm run dev
```

3. 访问应用：
打开浏览器访问 `http://localhost:3000`

## 使用说明

1. **首次访问**：输入 API 密钥进行鉴权
2. **添加文本**：在"添加内容"标签页的文本框中输入内容，点击"添加文本并同步"按钮
3. **添加文件/图片**：在"添加内容"标签页中拖拽文件到上传区域或点击上传按钮选择文件
4. **查看历史**：切换到"内容历史"标签页查看所有同步的内容
5. **复制文本**：在历史记录中点击文本条目旁的"复制文本"按钮
6. **下载文件**：在历史记录中点击文件条目旁的"下载文件"按钮
7. **删除内容**：点击文件条目旁的"删除"按钮删除不需要的内容

## 自动清理机制

系统每天凌晨2点会自动清理7天前的内容，包括数据库记录和存储的文件，无需手动干预。

## 支持作者

如果这个项目对你有帮助，请作者喝杯咖啡吧！

| 微信赞赏 | 支付宝 |
| :------: | :----: |
| ![微信](img/wxpay.JPG) | ![支付宝](img/alipay.JPG) |

## 许可证

[MIT](LICENSE)