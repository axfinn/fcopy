# Docker 镜像使用指南

## 镜像拉取

从 Docker Hub 拉取最新版本的 fcopy 镜像：

```bash
docker pull axiu/fcopy:latest
```

或者拉取特定版本：

```bash
docker pull axiu/fcopy:1.3.0
```

## 快速启动

使用以下命令快速启动 fcopy 服务：

```bash
docker run -d \
  --name fcopy \
  -p 2001:3000 \
  -v /path/to/data:/app/uploads \
  -e CLIPBOARD_API_KEY=your_secret_api_key \
  -e ADMIN_API_KEY=your_admin_api_key \
  axiu/fcopy:1.3.0
```

## 环境变量配置

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `CLIPBOARD_API_KEY` | 默认普通用户 API 密钥 | `default-api-key` |
| `ADMIN_API_KEY` | 管理员用户 API 密钥 | `admin_secret_key` |
| `RATE_LIMIT_REQUESTS` | 限流：窗口内请求数 | `10` |
| `RATE_LIMIT_WINDOW_MS` | 限流：时间窗口（ms） | `60000` |
| `RATE_LIMIT_BLOCK_DURATION_MS` | 限流：封禁时长（ms） | `600000` |
| `CLEANUP_DAYS` | 自动清理天数 | `7` |
| `PORT` | 容器内部服务端口 | `3000` |
| `NODE_ENV` | 运行环境 | `production` |

## 数据持久化

挂载 `/app/uploads`：包含数据库 `clipboard.db` 与上传文件。

```bash
docker run -d \
  --name fcopy \
  -p 2001:3000 \
  -v $(pwd)/data:/app/uploads \
  -e CLIPBOARD_API_KEY=your_secret_api_key \
  -e ADMIN_API_KEY=your_admin_api_key \
  axiu/fcopy:1.3.0
```

## 使用 Docker Compose（推荐）

创建 `docker-compose.yml`：

```yaml
version: '3.8'
services:
  fcopy:
    image: axiu/fcopy:1.3.0
    container_name: fcopy
    ports:
      - "2001:3000"
    volumes:
      - ./data:/app/uploads
    environment:
      - CLIPBOARD_API_KEY=your_secret_api_key
      - ADMIN_API_KEY=your_admin_api_key
      - RATE_LIMIT_REQUESTS=10
      - RATE_LIMIT_WINDOW_MS=60000
      - RATE_LIMIT_BLOCK_DURATION_MS=600000
      - CLEANUP_DAYS=7
    restart: unless-stopped
```

然后运行：

```bash
docker-compose up -d
```

## 访问应用

```text
http://localhost:2001
```

> 外部访问端口由 `-p 2001:3000` 左侧决定。

## 日志查看

```bash
docker logs -f fcopy
```

## 更新镜像

```bash
docker pull axiu/fcopy:1.3.0
docker stop fcopy
docker rm fcopy
docker run -d --name fcopy -p 2001:3000 -v ./data:/app/uploads \
  -e CLIPBOARD_API_KEY=your_secret_api_key \
  -e ADMIN_API_KEY=your_admin_api_key \
  axiu/fcopy:1.3.0
```

## 常见问题

1. 端口冲突：修改 `-p 2001:3000` 前半部分即可。
2. 权限问题：挂载目录需具有可写权限（`chmod 755 data`）。
3. 文件未持久化：确认已挂载 `/app/uploads`。

## 安全建议

- 生产环境请自定义强随机 `ADMIN_API_KEY`。
- 建议置于反向代理（Nginx）后并启用 HTTPS。
- 结合 Fail2ban / WAF 增强安全。