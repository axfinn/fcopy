# Clipboard Sync

一个简单的剪贴板同步工具，支持文本和文件的跨设备同步。

![GitHub stars](https://img.shields.io/github/stars/axfinn/fcopy.svg?style=social&label=Stars)
![GitHub forks](https://img.shields.io/github/forks/axfinn/fcopy.svg?style=social&label=Fork)

## 功能特性

- 📋 文本和文件剪贴板同步
- 🔐 安全的API密钥认证机制（多用户+管理员权限）
- 🖼️ 图片 / PDF / 文本预览（统一预览对话框）
- 📱 响应式设计，支持移动端使用
- 🌐 Socket.IO 实时同步 + 去重策略
- 📊 访问统计和监控面板（用户 / 在线 / 日志）
- 👤 用户管理和数据隔离
- 🧩 模块化架构：API 层 + Pinia Store + Composables
- ⚡ 计划中的按需加载与代码分割（即将优化首屏性能）
- 🐳 Docker 容器化部署支持

## 使用的组件/库/框架

- 后端：Node.js + Express + Socket.IO + better-sqlite3
- 前端：Vue 3 + Pinia + Element Plus + Webpack 5 + mitt
- 部署：Docker / Docker Compose

## 当前版本

v1.3.0 (2025-08-15)

> 完整变更请查看 `CHANGELOG.md` 1.3.0 条目。

## 1.3.0 亮点摘要

- 前端全面迁移 Pinia，移除自制 store
- 抽象 WebSocket：统一事件 `clipboard:new` / `presence:update`
- 剪贴板视图解耦：展示组件 `ClipboardHistoryImproved` + 桥接组件 `ClipboardList`
- 新增统一预览逻辑（文本 / PDF / 图片）与 Blob 下载（取代 window.open）
- Admin 面板修复并接入 stores（用户 / 日志 / 在线用户）
- 去除 legacy `services/api.js` / `services/socket.js`，建立 `apis/*` + `core/http/request`
- 预留后续性能优化与 API Key 动态更新 TODO

## 快速开始

### 使用 Docker (推荐)

```bash
# 拉取最新版本镜像
docker pull axiu/fcopy:latest

# 或指定版本
docker pull axiu/fcopy:1.3.0

# 运行容器
docker run -d \
  --name fcopy \
  -p 2001:2001 \
  -v /path/to/your/data:/app/uploads \
  axiu/fcopy:1.3.0
```

### 使用 Docker Compose

```bash
# 克隆项目
git clone https://github.com/axfinn/fcopy.git
cd fcopy

# 启动服务
docker-compose up -d

# 访问应用: http://localhost:2001
```

### 使用预构建的 Docker 镜像（固定版本）

```bash
# 拉取指定版本镜像
docker pull axiu/fcopy:1.3.0

# 启动容器
docker run -d \
  --name fcopy \
  -p 2001:2001 \
  -v $(pwd)/data:/app/data \
  axiu/fcopy:1.3.0
```

### Docker Compose 指定版本示例

```yaml
version: '3.8'
services:
  fcopy:
    image: axiu/fcopy:1.3.0
    container_name: fcopy
    ports:
      - "2001:2001"
    volumes:
      - ./data:/app/data
    environment:
      - EXPIRE_HOURS=24
```

### 配置 API 密钥

```env
CLIPBOARD_API_KEY=your-api-key-here
ADMIN_API_KEY=admin-secret-key
CLEANUP_DAYS=7
```

系统会自动创建两个默认用户：

1. 普通用户：用户名 `default`，API密钥为 `CLIPBOARD_API_KEY` 的值（默认 `default-api-key`）
2. 管理员用户：用户名 `admin`，API密钥为 `ADMIN_API_KEY` 的值（默认 `admin_secret_key`）

## 更新内容（摘录）

查看 `CHANGELOG.md` 获取完整历史。以下为近期关键版本：

### v1.3.0

- Pinia 重构、WebSocket 抽象、预览与下载改进、Admin 面板修复

### v1.2.12

- 多用户数据隔离 + 移动端删除按钮 + 安全增强

### v1.2.11

- 镜像名称统一 `axiu/fcopy` + CI/CD 构建修复

## 配置请求频率限制

```env
RATE_LIMIT_REQUESTS=10
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_BLOCK_DURATION_MS=600000
```

## 缓存控制策略

1. HTML：不缓存
2. JS/CSS：缓存 1 年（内容哈希）
3. 图片：缓存 1 年（内容哈希）

## 截图粘贴上传

支持直接系统截图后粘贴（Ctrl+V / Cmd+V）自动上传。

## 多用户支持与鉴权

Header 必须携带：

```http
X-API-Key: your-api-key-here
```

WebSocket 握手同样需要该密钥。

## API 列表（节选）

```text
GET  /api/clipboard
POST /api/clipboard/text
POST /api/clipboard/file
DELETE /api/clipboard/:id
GET  /api/users (admin)
POST /api/users (admin)
GET  /api/access-logs (admin)
GET  /api/rate-limits (admin)
```

## 部署脚本

```bash
chmod +x deploy.sh
./deploy.sh
```

## 自动清理机制

每日 02:00 清理 `CLEANUP_DAYS` 以前的数据库记录与文件。

## 项目结构（简化）

```text
├── client/
│   ├── apis/            # 前端 API 模块
│   ├── core/            # http / socket 抽象
│   ├── stores/          # Pinia stores
│   ├── composables/     # 复用逻辑（预览/上传等）
│   ├── features/        # 领域聚合（如 clipboard）
│   └── components/      # 基础组件
├── server/
│   ├── routes/          # REST 路由
│   ├── services/        # 数据/文件服务
│   └── middleware/      # 鉴权 / 限流
├── uploads/             # 数据库与文件持久化
├── CHANGELOG.md
├── Dockerfile(.prod)
└── README.md
```

## 使用说明

1. 首次访问输入 API Key 登录
2. 添加文本或拖拽 / 粘贴文件上传
3. 在历史列表中预览 / 下载 / 复制 / 删除
4. 管理员进入 Admin 面板管理用户与查看日志

## 即将进行的优化（Roadmap）

- updateApiKey 功能实现与 UI
- 预览对话框集中化与复用
- Element Plus / 图标按需加载
- 代码分割与首屏性能优化
- 全局错误提示统一（request 拦截）
- 移除已弃用 legacy 与 deprecated 文件

## 支持作者

如果这个项目对你有帮助，请作者喝杯咖啡吧！

| 微信赞赏 | 支付宝 |
| :------: | :----: |
| ![微信](img/wxpay.JPG) | ![支付宝](img/alipay.JPG) |

## 许可证

[MIT](LICENSE)